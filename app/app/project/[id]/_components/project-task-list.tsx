"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/services/task.service";
import type { UserData } from "@/services/user.service";
import type { AssigneeOption } from "../_hooks/use-project-tasks-page-data";
import { ProjectTaskCard } from "./project-task-card";
import { ProjectTasksEmptyState } from "./project-tasks-empty-state";

type ProjectTaskListProps = {
  filteredTasks: Task[];
  totalTasksCount: number;
  visibleTaskCount: number;
  onLoadMore: () => void;
  canEditTaskActions: boolean;
  canDeleteTaskActions: boolean;
  canPlay: boolean;
  isTaskActive: (taskId: string) => boolean;
  isPaused: boolean;
  assignees: AssigneeOption[];
  usersMap: Record<string, UserData>;
  onTaskClick: (task: Task) => void;
  onInlineUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onPlay: (task: Task) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({
  filteredTasks,
  totalTasksCount,
  visibleTaskCount,
  onLoadMore,
  canEditTaskActions,
  canDeleteTaskActions,
  canPlay,
  isTaskActive,
  isPaused,
  assignees,
  usersMap,
  onTaskClick,
  onInlineUpdate,
  onDeleteTask,
  onPlay,
  onPause,
  onResume,
  onStop,
}) => {
  if (filteredTasks.length === 0) {
    return <ProjectTasksEmptyState hasTasks={totalTasksCount > 0} />;
  }

  return (
    <div className="space-y-3">
      {filteredTasks.slice(0, visibleTaskCount).map((task) => {
        const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
        const assignedUsers = assigneeIds
          .map((assigneeId) => usersMap[assigneeId])
          .filter((user): user is UserData => Boolean(user));
        return (
          <ProjectTaskCard
            key={task.id}
            task={task}
            assignedUsers={assignedUsers}
            assignees={assignees}
            canEditTaskActions={canEditTaskActions}
            canDeleteTaskActions={canDeleteTaskActions}
            canPlay={canPlay}
            isActive={isTaskActive(task.id)}
            isPaused={isTaskActive(task.id) && isPaused}
            onTaskClick={onTaskClick}
            onInlineUpdate={onInlineUpdate}
            onDeleteTask={onDeleteTask}
            onPlay={onPlay}
            onPause={onPause}
            onResume={onResume}
            onStop={onStop}
          />
        );
      })}
      {visibleTaskCount < filteredTasks.length ? (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={onLoadMore}>
            Ver mas
          </Button>
        </div>
      ) : null}
    </div>
  );
};
