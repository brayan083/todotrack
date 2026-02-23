"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, LayoutDashboard, Trash2, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  PROJECT_PRIORITY_STYLES,
  PROJECT_STATUS_STYLES,
  STATUS_LABELS,
} from "@/lib/task-constants";
import type { AssigneeOption } from "../_hooks/use-project-tasks-page-data";
import { TagService, type Tag } from "@/services/tag.service";
import { db } from "@/lib/firebase.config";

type ProjectTaskDrawerProps = {
  selectedTask: Task | null;
  editData: Partial<Task>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<Task>>>;
  canEditTaskActions: boolean;
  canDeleteTaskActions: boolean;
  isEditing: boolean;
  projectName?: string;
  assignees: AssigneeOption[];
  usersMap: Record<string, UserData>;
  availableTags: Tag[];
  projectId: string;
  onTagsUpdated: (tags: Tag[]) => void;
  onBackToList: () => void;
  onDeleteTask: (taskId: string) => void;
};

export const ProjectTaskDrawer: React.FC<ProjectTaskDrawerProps> = ({
  selectedTask,
  editData,
  setEditData,
  canEditTaskActions,
  canDeleteTaskActions,
  isEditing,
  projectName,
  assignees,
  usersMap,
  availableTags,
  projectId,
  onTagsUpdated,
  onBackToList,
  onDeleteTask,
}) => {
  const selectedAssigneeId = editData.assigneeId ?? selectedTask?.assigneeId ?? "";
  const selectedAssignees = assignees.filter((assignee) => assignee.uid === selectedAssigneeId);
  const selectedTagIds = useMemo(
    () => editData.tagIds ?? selectedTask?.tagIds ?? [],
    [editData.tagIds, selectedTask?.tagIds]
  );
  const [tagInput, setTagInput] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);

  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [availableTags, selectedTagIds]
  );

  useEffect(() => {
    if (!selectedTask) {
      setTagInput("");
      return;
    }
    const tagNames = selectedTagIds
      .map((tagId) => availableTags.find((tag) => tag.id === tagId)?.name)
      .filter(Boolean) as string[];
    setTagInput(tagNames.join(", "));
  }, [selectedTask, selectedTagIds, availableTags]);

  const handleAssigneeChange = (assigneeId: string) => {
    setEditData({
      ...editData,
      assigneeId: assigneeId === "unassigned" ? "" : assigneeId,
    });
  };

  const handleTagsCommit = async () => {
    if (!selectedTask || !projectId) return;
    const names = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      setTagsSaving(true);
      const tagService = TagService.getInstance(db);
      const tags = names.length > 0
        ? await tagService.getOrCreateTagsByName(projectId, names)
        : [];
      const nextTags = [...availableTags];
      tags.forEach((tag) => {
        if (!nextTags.some((item) => item.id === tag.id)) {
          nextTags.push(tag);
        }
      });
      onTagsUpdated(nextTags);
      setEditData({ ...editData, tagIds: tags.map((tag) => tag.id) });
      setTagInput(tags.map((tag) => tag.name).join(", "));
    } catch (error) {
      console.error("Error updating tags:", error);
    } finally {
      setTagsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const nextIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setEditData({ ...editData, tagIds: nextIds });
  };

  return (
    <Drawer
      open={Boolean(selectedTask)}
      onOpenChange={(open) => {
        if (!open) {
          onBackToList();
        }
      }}
    >
      <DrawerContent direction="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <VisuallyHidden>
          <DrawerTitle>{selectedTask?.title ?? "Task details"}</DrawerTitle>
          <DrawerDescription>
            View and edit task information, status, priority, and assignee.
          </DrawerDescription>
        </VisuallyHidden>
        {selectedTask ? (
          <div className="flex min-h-full flex-col bg-gradient-to-b from-muted/30 via-background to-background">
            <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
              <DrawerHeader className="space-y-4 px-6 py-4 text-left">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button variant="ghost" size="sm" onClick={onBackToList} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to tasks
                  </Button>
                  <div className="flex items-center gap-2">
                    {projectName ? (
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                        {projectName}
                      </Badge>
                    ) : null}
                    {isEditing ? (
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {canEditTaskActions ? "Auto-save on" : "Read-only"}
                      </Badge>
                    ) : null}
                    {canDeleteTaskActions ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteTask(selectedTask.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3">
                  <Input
                    value={editData.title ?? selectedTask.title}
                    onChange={(event) => setEditData({ ...editData, title: event.target.value })}
                    disabled={!canEditTaskActions}
                    className="h-auto border-none bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                    placeholder="Task title"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        PROJECT_STATUS_STYLES[selectedTask.status] || PROJECT_STATUS_STYLES.todo
                      }`}
                    >
                      {STATUS_LABELS[selectedTask.status] || selectedTask.status}
                    </Badge>
                    <Badge
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        PROJECT_PRIORITY_STYLES[selectedTask.priority] || PROJECT_PRIORITY_STYLES.medium
                      }`}
                    >
                      {selectedTask.priority}
                    </Badge>
                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {selectedTask.dueDate
                          ? `Due ${new Date(selectedTask.dueDate).toLocaleDateString()}`
                          : "No due date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      <span>Created {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </DrawerHeader>
            </div>

            <div className="space-y-6 px-6 py-6">
              <Card className="border-border/60 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={editData.title ?? selectedTask.title}
                    onChange={(event) => setEditData({ ...editData, title: event.target.value })}
                    disabled={!canEditTaskActions}
                    className="h-11 rounded-xl bg-background"
                    placeholder="Task title"
                  />
                  <Textarea
                    className="min-h-32"
                    value={editData.description || ""}
                    onChange={(event) =>
                      setEditData({ ...editData, description: event.target.value })
                    }
                    disabled={!canEditTaskActions}
                    placeholder="Add a clear description, scope, or notes..."
                  />
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    Tip: Use short paragraphs or bullet points for clarity.
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">At a glance</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <div className="mt-2">
                        <Select
                          disabled={!canEditTaskActions}
                          value={editData.status || "todo"}
                          onValueChange={(value) =>
                            setEditData({ ...editData, status: value as Task["status"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>Priority</span>
                      </div>
                      <div className="mt-2">
                        <Select
                          disabled={!canEditTaskActions}
                          value={editData.priority || "medium"}
                          onValueChange={(value) => setEditData({ ...editData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Due Date</span>
                      </div>
                      <div className="mt-2">
                        <Input
                          type="date"
                          disabled={!canEditTaskActions}
                          value={
                            editData.dueDate
                              ? new Date(editData.dueDate).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(event) =>
                            setEditData({
                              ...editData,
                              dueDate: event.target.value
                                ? new Date(event.target.value)
                                : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Assignee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between"
                          disabled={!canEditTaskActions}
                        >
                          {selectedAssignees.length > 0 ? (
                            <span className="truncate">
                              {selectedAssignees.slice(0, 2).map((assignee) => assignee.label).join(", ")}
                              {selectedAssignees.length > 2
                                ? ` +${selectedAssignees.length - 2}`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64">
                        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={selectedAssigneeId || "unassigned"}
                          onValueChange={handleAssigneeChange}
                        >
                          <DropdownMenuRadioItem value="unassigned">
                            Unassigned
                          </DropdownMenuRadioItem>
                          {assignees.map((assignee) => (
                            <DropdownMenuRadioItem key={assignee.uid} value={assignee.uid}>
                              {assignee.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedAssigneeId ? (
                      <div className="mt-4 space-y-2">
                        {(() => {
                          const member = usersMap[selectedAssigneeId];
                          if (!member) return null;
                          return (
                            <div
                              className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-4"
                            >
                              <Avatar className="h-11 w-11">
                                <AvatarFallback>
                                  {member.displayName?.[0] || member.email?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {member.displayName || member.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>No one assigned yet</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onBlur={handleTagsCommit}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleTagsCommit();
                        }
                      }}
                      disabled={!canEditTaskActions || tagsSaving}
                      placeholder="#meeting, #development"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas.
                    </p>
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="gap-1">
                            #{tag.name}
                            {canEditTaskActions ? (
                              <button
                                type="button"
                                className="ml-1 rounded-full hover:text-foreground"
                                onClick={() => toggleTag(tag.id)}
                                aria-label={`Remove ${tag.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            ) : null}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No tags selected.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {availableTags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No tags in this project.</span>
                      ) : (
                        availableTags.map((tag) => (
                          <Button
                            key={tag.id}
                            type="button"
                            variant={selectedTagIds.includes(tag.id) ? "secondary" : "outline"}
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => toggleTag(tag.id)}
                            disabled={!canEditTaskActions}
                          >
                            #{tag.name}
                          </Button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};
