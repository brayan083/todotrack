"use client";

import { useMemo } from "react";
import type { Task } from "@/services/task.service";
import { UNASSIGNED_FILTER_VALUE } from "@/lib/task-constants";

type UseTaskFiltersArgs = {
  tasks: Task[];
  searchTerm: string;
  statusFilters: string[];
  priorityFilters: string[];
  assigneeFilters: string[];
  tagFilters: string[];
  dueDateFrom: string;
  dueDateTo: string;
};

export const useTaskFilters = ({
  tasks,
  searchTerm,
  statusFilters,
  priorityFilters,
  assigneeFilters,
  tagFilters,
  dueDateFrom,
  dueDateTo,
}: UseTaskFiltersArgs) => {
  return useMemo(() => {
    let filtered = tasks;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((task) => {
        return (
          task.title.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilters.length > 0) {
      filtered = filtered.filter((task) => statusFilters.includes(task.status));
    }

    if (priorityFilters.length > 0) {
      filtered = filtered.filter((task) => {
        const priorityValue = task.priority || "medium";
        return priorityFilters.includes(priorityValue);
      });
    }

    if (assigneeFilters.length > 0) {
      filtered = filtered.filter((task) => {
        const assigneeIds = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);
        if (assigneeIds.length === 0) {
          return assigneeFilters.includes(UNASSIGNED_FILTER_VALUE);
        }
        return assigneeIds.some((assigneeId) => assigneeFilters.includes(assigneeId));
      });
    }

    if (tagFilters.length > 0) {
      filtered = filtered.filter((task) => {
        const taskTags = task.tagIds || [];
        return tagFilters.some((tagId) => taskTags.includes(tagId));
      });
    }

    if (dueDateFrom || dueDateTo) {
      const fromDate = dueDateFrom ? new Date(`${dueDateFrom}T00:00:00`) : null;
      const toDate = dueDateTo ? new Date(`${dueDateTo}T23:59:59`) : null;
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        if (fromDate && dueDate < fromDate) return false;
        if (toDate && dueDate > toDate) return false;
        return true;
      });
    }

    return filtered;
  }, [
    tasks,
    searchTerm,
    statusFilters,
    priorityFilters,
    assigneeFilters,
    tagFilters,
    dueDateFrom,
    dueDateTo,
  ]);
};
