"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { ProjectService, type Project } from "@/services/project.service";
import { TaskService, type Task } from "@/services/task.service";
import { db } from "@/lib/firebase.config";

const SearchResults: React.FC = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);

        const [allProjects, allTasks] = await Promise.all([
          projectService.getAllProjects(user.uid),
          taskService.getAllTasks(user.uid),
        ]);

        setProjects(allProjects);
        setTasks(allTasks);
      } catch (error) {
        console.error("Error loading search data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="px-6 py-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>Search results</span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {normalizedQuery ? (
              <>
                {totalResults} {totalResults === 1 ? "result" : "results"} for
                <span className="ml-1 font-medium text-foreground">"{query}"</span>
              </>
            ) : (
              "Type to search tasks or projects"
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading search data...</p>
            </div>
          </div>
        ) : !normalizedQuery ? null : totalResults === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No results found. Try a different search.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matching projects.</p>
                ) : (
                  filteredProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/project/${project.id}`}
                      className="block rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/50 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">Project</Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matching tasks.</p>
                ) : (
                  filteredTasks.map((task) => {
                    const project = projectLookup.get(task.projectId);
                    return (
                      <Link
                        key={task.id}
                        href={`/app/project/${task.projectId}/task/${task.id}`}
                        className="block rounded-lg border border-border bg-background px-4 py-3 hover:border-primary/50 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{task.title}</p>
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
                          <Badge variant="secondary">Task</Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
};

export default SearchPage;
