"use client";

import React from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  UNASSIGNED_FILTER_VALUE,
} from "@/lib/task-constants";
import type { AssigneeOption } from "../_hooks/use-project-tasks-page-data";
import type { Tag } from "@/services/tag.service";

type SortByOption = "priority" | "dueDate" | "createdAt";

type SortDirection = "asc" | "desc";

type ProjectTasksFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: SortByOption;
  onSortByChange: (value: SortByOption) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (value: SortDirection) => void;
  statusFilters: string[];
  priorityFilters: string[];
  assigneeFilters: string[];
  tagFilters: string[];
  tags: Tag[];
  assignees: AssigneeOption[];
  dueDateFrom: string;
  dueDateTo: string;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onToggleFilterValue: (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  setStatusFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setPriorityFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setAssigneeFilters: React.Dispatch<React.SetStateAction<string[]>>;
  setTagFilters: React.Dispatch<React.SetStateAction<string[]>>;
  onDueDateFromChange: (value: string) => void;
  onDueDateToChange: (value: string) => void;
  onClearFilters: () => void;
};

export const ProjectTasksFilters: React.FC<ProjectTasksFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  statusFilters,
  priorityFilters,
  assigneeFilters,
  tagFilters,
  tags,
  assignees,
  dueDateFrom,
  dueDateTo,
  filtersOpen,
  onFiltersOpenChange,
  onToggleFilterValue,
  setStatusFilters,
  setPriorityFilters,
  setAssigneeFilters,
  setTagFilters,
  onDueDateFromChange,
  onDueDateToChange,
  onClearFilters,
}) => {
  const activeFiltersCount =
    statusFilters.length +
    priorityFilters.length +
    assigneeFilters.length +
    tagFilters.length +
    (dueDateFrom ? 1 : 0) +
    (dueDateTo ? 1 : 0);

  return (
    <Collapsible open={filtersOpen} onOpenChange={onFiltersOpenChange}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortByOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created date</SelectItem>
              <SelectItem value="dueDate">Due date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortDirection}
            onValueChange={(value) => onSortDirectionChange(value as SortDirection)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              ) : null}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          {activeFiltersCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <CollapsibleContent className="mt-4">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${value}`}
                    checked={statusFilters.includes(value)}
                    onCheckedChange={() => onToggleFilterValue(value, setStatusFilters)}
                  />
                  <label htmlFor={`status-${value}`} className="text-sm">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Priority</p>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`priority-${value}`}
                    checked={priorityFilters.includes(value)}
                    onCheckedChange={() => onToggleFilterValue(value, setPriorityFilters)}
                  />
                  <label htmlFor={`priority-${value}`} className="text-sm capitalize">
                    {value}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Assignee</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="assignee-unassigned"
                  checked={assigneeFilters.includes(UNASSIGNED_FILTER_VALUE)}
                  onCheckedChange={() =>
                    onToggleFilterValue(UNASSIGNED_FILTER_VALUE, setAssigneeFilters)
                  }
                />
                <label htmlFor="assignee-unassigned" className="text-sm">
                  Unassigned
                </label>
              </div>
              {assignees.map((assignee) => (
                <div key={assignee.uid} className="flex items-center gap-2">
                  <Checkbox
                    id={`assignee-${assignee.uid}`}
                    checked={assigneeFilters.includes(assignee.uid)}
                    onCheckedChange={() =>
                      onToggleFilterValue(assignee.uid, setAssigneeFilters)
                    }
                  />
                  <label htmlFor={`assignee-${assignee.uid}`} className="text-sm">
                    {assignee.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Tags</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={tagFilters.includes(tag.id)}
                      onCheckedChange={() => onToggleFilterValue(tag.id, setTagFilters)}
                    />
                    <label htmlFor={`tag-${tag.id}`} className="text-sm">
                      #{tag.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Due date</p>
            <div className="space-y-2">
              <div>
                <label htmlFor="due-from" className="text-xs text-muted-foreground">
                  From
                </label>
                <Input
                  id="due-from"
                  type="date"
                  value={dueDateFrom}
                  onChange={(event) => onDueDateFromChange(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="due-to" className="text-xs text-muted-foreground">
                  To
                </label>
                <Input
                  id="due-to"
                  type="date"
                  value={dueDateTo}
                  onChange={(event) => onDueDateToChange(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
