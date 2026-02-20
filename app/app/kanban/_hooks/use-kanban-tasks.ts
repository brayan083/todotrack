"use client";

import { useMemo } from "react";
import type { Task } from "@/services/task.service";
import { useTaskFilters } from "@/app/app/_hooks/use-task-filters";

type UseKanbanTasksArgs = {
  tasks: Task[];
  searchTerm: string;
  statusFilters: string[];
  priorityFilters: string[];
  assigneeFilters: string[];
  tagFilters: string[];
  dueDateFrom: string;
  dueDateTo: string;
};

const sortTasksByPosition = (list: Task[]) =>
  [...list].sort((a, b) => {
    const aPos = a.position ?? 0;
    const bPos = b.position ?? 0;
    if (aPos !== bPos) return aPos - bPos;
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aCreated - bCreated;
  });

export const useKanbanTasks = ({
  tasks,
  searchTerm,
  statusFilters,
  priorityFilters,
  assigneeFilters,
  tagFilters,
  dueDateFrom,
  dueDateTo,
}: UseKanbanTasksArgs) => {
  const filteredTasksWithFilters = useTaskFilters({
    tasks,
    searchTerm,
    statusFilters,
    priorityFilters,
    assigneeFilters,
    tagFilters,
    dueDateFrom,
    dueDateTo,
  });

  const todoTasks = useMemo(
    () => sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "todo")),
    [filteredTasksWithFilters]
  );
  const inProgressTasks = useMemo(
    () =>
      sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "in-progress")),
    [filteredTasksWithFilters]
  );
  const doneTasks = useMemo(
    () => sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "done")),
    [filteredTasksWithFilters]
  );

  return { filteredTasksWithFilters, todoTasks, inProgressTasks, doneTasks };
};
