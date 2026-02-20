"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import type { Task } from "@/services/task.service";
import type { AssigneeOption } from "../_hooks/use-project-tasks-page-data";

type ProjectTasksHeaderProps = {
  projectId: string;
  projectName: string;
  selectedTaskTitle?: string | null;
  totalTasks: number;
  filteredCount: number;
  canCreateTaskActions: boolean;
  userId?: string;
  assignees: AssigneeOption[];
  onTaskCreated: (task: Task) => void;
  onBackToList: () => void;
  onGoKanban: () => void;
  children?: React.ReactNode;
};

export const ProjectTasksHeader: React.FC<ProjectTasksHeaderProps> = ({
  projectId,
  projectName,
  selectedTaskTitle,
  totalTasks,
  filteredCount,
  canCreateTaskActions,
  userId,
  assignees,
  onTaskCreated,
  onBackToList,
  onGoKanban,
  children,
}) => {
  return (
    <>
      <div className="bg-background border-b border-border">
        <div className="px-6 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/project" className="cursor-pointer">
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {selectedTaskTitle ? (
                  <BreadcrumbLink onClick={onBackToList} className="cursor-pointer">
                    {projectName}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{projectName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {selectedTaskTitle ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedTaskTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">Tasks</h2>
                <Badge variant="secondary" className="text-xs">
                  {filteredCount}/{totalTasks}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing filtered tasks in this project.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={onGoKanban} className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Kanban
              </Button>
              {userId && canCreateTaskActions ? (
                <CreateTaskDialog
                  projectId={projectId}
                  userId={userId}
                  assignees={assignees}
                  onTaskCreated={onTaskCreated}
                />
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </>
  );
};
