"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  Play,
  Square,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/services/task.service";
import type { UserData } from "@/services/user.service";
import {
  PRIORITY_OPTIONS,
  PROJECT_PRIORITY_STYLES,
  PROJECT_STATUS_ACCENTS,
  PROJECT_STATUS_STYLES,
  STATUS_LABELS,
} from "@/lib/task-constants";
import type { AssigneeOption } from "../_hooks/use-project-tasks-page-data";
import {
  formatDateInputValue,
  formatDateLabel,
  parseDateInputValue,
} from "../_utils/date-utils";

type ProjectTaskCardProps = {
  task: Task;
  assignedUsers: UserData[];
  assignees: AssigneeOption[];
  canEditTaskActions: boolean;
  canDeleteTaskActions: boolean;
  canPlay: boolean;
  isActive: boolean;
  isPaused: boolean;
  onTaskClick: (task: Task) => void;
  onInlineUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onPlay: (task: Task) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

const isInlineEditTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('[data-inline-edit="true"]'));
};

export const ProjectTaskCard: React.FC<ProjectTaskCardProps> = ({
  task,
  assignedUsers,
  assignees,
  canEditTaskActions,
  canDeleteTaskActions,
  canPlay,
  isActive,
  isPaused,
  onTaskClick,
  onInlineUpdate,
  onDeleteTask,
  onPlay,
  onPause,
  onResume,
  onStop,
}) => {
  const isDone = task.status === "completed";
  const statusAccent = PROJECT_STATUS_ACCENTS[task.status] || PROJECT_STATUS_ACCENTS.todo;
  const statusStyle = PROJECT_STATUS_STYLES[task.status] || PROJECT_STATUS_STYLES.todo;
  const priorityStyle = PROJECT_PRIORITY_STYLES[task.priority] || PROJECT_PRIORITY_STYLES.medium;
  const assigneeId = task.assigneeId || "";
  const selectedLabels = assignedUsers
    .map((user) => user.displayName || user.email || "User")
    .filter(Boolean);

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      onClick={(event) => {
        if (isInlineEditTarget(event.target)) return;
        onTaskClick(task);
      }}
    >
      <CardContent className="relative p-5">
        <div className={`absolute left-0 top-0 h-full w-1 ${statusAccent}`} />
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center pt-1">
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : task.status === "in-progress" ? (
              <Circle className="h-5 w-5 text-orange-500 fill-orange-500/20" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                {canEditTaskActions ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        data-inline-edit="true"
                        className={`text-left text-base font-semibold tracking-tight mb-1 transition-colors group-hover:text-primary ${
                          isDone ? "line-through text-muted-foreground" : ""
                        }`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {task.title}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 p-3" data-inline-edit="true">
                      <DropdownMenuLabel>Title</DropdownMenuLabel>
                      <Input
                        defaultValue={task.title}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value && value !== task.title) {
                            onInlineUpdate(task.id, { title: value });
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div
                    className={`text-left text-base font-semibold tracking-tight mb-1 ${
                      isDone ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </div>
                )}

                {canEditTaskActions ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        data-inline-edit="true"
                        className="text-left text-sm text-muted-foreground line-clamp-2 hover:text-foreground"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {task.description || "Add description"}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80 p-3" data-inline-edit="true">
                      <DropdownMenuLabel>Description</DropdownMenuLabel>
                      <Textarea
                        defaultValue={task.description || ""}
                        data-inline-edit="true"
                        className="min-h-[96px]"
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value !== (task.description || "")) {
                            onInlineUpdate(task.id, { description: value });
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        data-inline-edit="true"
                        onSelect={(event) => {
                          event.preventDefault();
                          onInlineUpdate(task.id, { description: "" });
                        }}
                      >
                        Clear description
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <p className="text-left text-sm text-muted-foreground line-clamp-2">
                    {task.description || "Add description"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {canPlay && !isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-inline-edit="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        onPlay(task);
                      }}
                      aria-label="Start task timer"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {canPlay && isActive ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-inline-edit="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isPaused) {
                            onResume();
                          } else {
                            onPause();
                          }
                        }}
                        aria-label={isPaused ? "Resume task timer" : "Pause task timer"}
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-inline-edit="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStop();
                        }}
                        aria-label="Stop task timer"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
                {canEditTaskActions ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        className={`${priorityStyle} cursor-pointer rounded-full px-3 py-1 text-xs font-semibold`}
                        variant="secondary"
                        data-inline-edit="true"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Priority: {task.priority}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-inline-edit="true">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={task.priority || "medium"}
                        onValueChange={(value) => onInlineUpdate(task.id, { priority: value })}
                      >
                        {PRIORITY_OPTIONS.map((value) => (
                          <DropdownMenuRadioItem key={value} data-inline-edit="true" value={value}>
                            {value.charAt(0).toUpperCase() + value.slice(1)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    className={`${priorityStyle} rounded-full px-3 py-1 text-xs font-semibold`}
                    variant="secondary"
                  >
                    Priority: {task.priority}
                  </Badge>
                )}
                {canDeleteTaskActions ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    data-inline-edit="true"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {canEditTaskActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge
                      className={`${statusStyle} cursor-pointer rounded-full px-3 py-1 text-xs font-semibold`}
                      variant="outline"
                      data-inline-edit="true"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Status: {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" data-inline-edit="true">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={task.status}
                      onValueChange={(value) =>
                        onInlineUpdate(task.id, { status: value as Task["status"] })
                      }
                    >
                      <DropdownMenuRadioItem data-inline-edit="true" value="todo">
                        To Do
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem data-inline-edit="true" value="in-progress">
                        In Progress
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem data-inline-edit="true" value="completed">
                        Completed
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge
                  className={`${statusStyle} rounded-full px-3 py-1 text-xs font-semibold`}
                  variant="outline"
                >
                  Status: {STATUS_LABELS[task.status] || task.status}
                </Badge>
              )}

              {canEditTaskActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      data-inline-edit="true"
                      className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <User className="h-4 w-4" />
                      {selectedLabels.length > 0 ? (
                        <span>
                          Assignees: {selectedLabels.slice(0, 2).join(", ")}
                          {selectedLabels.length > 2 ? ` +${selectedLabels.length - 2}` : ""}
                        </span>
                      ) : (
                        <span>Assignees: Unassigned</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" data-inline-edit="true">
                    <DropdownMenuLabel>Assignees</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={assigneeId || "unassigned"}
                      onValueChange={(value) =>
                        onInlineUpdate(task.id, {
                          assigneeId: value === "unassigned" ? "" : value,
                        })
                      }
                    >
                      <DropdownMenuRadioItem data-inline-edit="true" value="unassigned">
                        Unassigned
                      </DropdownMenuRadioItem>
                      {assignees.map((assignee) => (
                        <DropdownMenuRadioItem
                          key={assignee.uid}
                          data-inline-edit="true"
                          value={assignee.uid}
                        >
                          {assignee.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  {selectedLabels.length > 0 ? (
                    <span>
                      Assignees: {selectedLabels.slice(0, 2).join(", ")}
                      {selectedLabels.length > 2 ? ` +${selectedLabels.length - 2}` : ""}
                    </span>
                  ) : (
                    <span>Assignees: Unassigned</span>
                  )}
                </div>
              )}

              {canEditTaskActions ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      data-inline-edit="true"
                      className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Clock className="h-4 w-4" />
                      <span>
                        Due: {task.dueDate ? formatDateLabel(new Date(task.dueDate)) : "No due date"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="p-3" data-inline-edit="true">
                    <DropdownMenuLabel>Due date</DropdownMenuLabel>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="date"
                        data-inline-edit="true"
                        value={task.dueDate ? formatDateInputValue(new Date(task.dueDate)) : ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          onInlineUpdate(task.id, {
                            dueDate: value ? parseDateInputValue(value) : undefined,
                          });
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        data-inline-edit="true"
                        onSelect={(event) => {
                          event.preventDefault();
                          onInlineUpdate(task.id, { dueDate: undefined });
                        }}
                      >
                        Clear date
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Due: {task.dueDate ? formatDateLabel(new Date(task.dueDate)) : "No due date"}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
