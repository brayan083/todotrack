"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { ProjectService, type Project } from "@/services/project.service";
import { UserService, type UserData } from "@/services/user.service";
import { TaskService, type Task } from "@/services/task.service";
import { db } from "@/lib/firebase.config";
import { useAuthStore } from "@/stores";

interface ProjectTasksPageProps {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "done": "Done",
};

const STATUS_STYLES: Record<string, string> = {
  "todo": "bg-slate-100 text-slate-700",
  "in-progress": "bg-orange-100 text-orange-700",
  "done": "bg-green-100 text-green-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  "low": "bg-blue-100 text-blue-700",
  "medium": "bg-yellow-100 text-yellow-700",
  "high": "bg-orange-100 text-orange-700",
  "urgent": "bg-red-100 text-red-700",
};

const ProjectTasksPage: React.FC<ProjectTasksPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<{ uid: string; label: string; photoURL?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!user || !resolvedParams.id) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);
        const userService = UserService.getInstance(db);

        const foundProject = await projectService.getProject(resolvedParams.id);
        if (!foundProject) {
          setProject(null);
          return;
        }

        setProject(foundProject);

        const memberIds = (foundProject.members || []).filter(Boolean);
        if (memberIds.length > 0) {
          const users = await Promise.all(memberIds.map((memberId) => userService.getUser(memberId)));
          const mapped = users
            .filter((userData): userData is UserData => Boolean(userData))
            .map((userData) => ({
              uid: userData.uid,
              label: userData.displayName || userData.email || userData.uid.slice(0, 8),
              photoURL: userData.photoURL,
            }));
          setAssignees(mapped);
        } else {
          setAssignees([]);
        }

        const projectTasks = await taskService.getAllTasks(user.uid, resolvedParams.id);
        setTasks(projectTasks);
      } catch (error) {
        console.error("Error loading project tasks:", error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, resolvedParams.id]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      );
    });
  }, [tasks, searchTerm]);

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return notFound();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/app/project")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            />
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {user && (
            <CreateTaskDialog
              projectId={resolvedParams.id}
              userId={user.uid}
              assignees={assignees}
              onTaskCreated={handleTaskCreated}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No tasks yet
            </div>
            <p className="text-sm text-muted-foreground">
              Create your first task to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[task.status] || STATUS_STYLES["todo"]}>
                      {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_STYLES[task.priority] || PRIORITY_STYLES["medium"]}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.assignedId?.slice(0, 8) || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ProjectTasksPage;
