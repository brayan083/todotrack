"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { useWorkspace } from "@/hooks";
import { ProjectService, type Project } from "@/services/project.service";
import { TaskService, type Task } from "@/services/task.service";
import { db } from "@/lib/firebase.config";
import { useRouter } from "next/navigation";

const GlobalSearchModal: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { workspaceId } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      if (!user || !workspaceId || hasLoadedRef.current) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);

        const [allProjects, allTasks] = await Promise.all([
          projectService.getAllProjects(user.uid, workspaceId),
          taskService.getAllTasks(user.uid, workspaceId),
        ]);

        setProjects(allProjects);
        setTasks(allTasks);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading search data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, user, workspaceId]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return [];
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [projects, normalizedQuery]);

  const filteredTasks = useMemo(() => {
    if (!normalizedQuery) return [];
    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [tasks, normalizedQuery]);

  const projectLookup = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((project) => map.set(project.id, project));
    return map;
  }, [projects]);

  const totalResults = filteredProjects.length + filteredTasks.length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  };

  const handleResultClick = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="relative group w-40 sm:w-48 md:w-56">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
        </div>
        <Input
          readOnly
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="pl-10 bg-muted/50 border-input focus:bg-background transition-colors cursor-text"
          placeholder="Search tasks or projects..."
        />
      </div>

      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <VisuallyHidden>Global search</VisuallyHidden>
          </DialogTitle>
        </DialogHeader>
        <div className="border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Global search</span>
            </div>
            {normalizedQuery ? (
              <Badge variant="secondary">{totalResults} results</Badge>
            ) : null}
          </div>
          <div className="relative mt-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-10 bg-background"
              placeholder="Search tasks or projects..."
            />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 space-y-6">
          {!user ? (
            <div className="text-sm text-muted-foreground">Sign in to search.</div>
          ) : loading ? (
            <div className="text-sm text-muted-foreground">Loading search data...</div>
          ) : !normalizedQuery ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Type to search tasks or projects.
            </div>
          ) : totalResults === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Projects</span>
                  </div>
                  <Badge variant="secondary">{filteredProjects.length}</Badge>
                </div>
                <div className="space-y-2">
                  {filteredProjects.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No matching projects.</div>
                  ) : (
                    filteredProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleResultClick(`/app/project/${project.id}`)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{project.name}</p>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="rounded-full px-3">Project</Badge>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tasks</span>
                  </div>
                  <Badge variant="secondary">{filteredTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No matching tasks.</div>
                  ) : (
                    filteredTasks.map((task) => {
                      const project = projectLookup.get(task.projectId);
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() =>
                            handleResultClick(`/app/project/${task.projectId}/task/${task.id}`)
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {project && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {project.name}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="rounded-full px-3">Task</Badge>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchModal;
