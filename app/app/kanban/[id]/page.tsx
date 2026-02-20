"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { Search, MoreHorizontal, ArrowLeft, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { ProjectService, type Project } from "@/services/project.service";
import { TaskService, type Task } from "@/services/task.service";
import { UserService, type UserData } from "@/services/user.service";
import { TagService, type Tag } from "@/services/tag.service";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { db } from "@/lib/firebase.config";
import {
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  UNASSIGNED_FILTER_VALUE,
} from "@/lib/task-constants";
import { useAuthStore } from "@/stores";
import { useTimer } from "@/hooks";
import { canDeleteTasks, canEditTasks, getUserRole } from "@/lib/roles";
import { useKanbanTasks } from "../_hooks/use-kanban-tasks";
import { KanbanTaskCard } from "../_components/kanban-task-card";
import { ProjectTaskDrawer } from "../../project/[id]/_components/project-task-drawer";

interface KanbanPageProps {
  params: Promise<{
    id: string;
  }>;
}

const KanbanPage: React.FC<KanbanPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const {
    activeEntry,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<{ uid: string; label: string; photoURL?: string | null }[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    let unsubscribeProject: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;
    let isMounted = true;

    const loadData = async () => {
      if (!user || !resolvedParams.id) {
        if (isMounted) {
          setProject(null);
          setProjectLoaded(false);
          setTasks([]);
          setAssignees([]);
          setUsersMap({});
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setProjectLoaded(false);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);

        unsubscribeProject = projectService.subscribeToProject(
          resolvedParams.id,
          (nextProject) => {
            if (!isMounted) return;
            setProjectLoaded(true);
            if (!nextProject) {
              setProject(null);
              setTasks([]);
              setAssignees([]);
              setUsersMap({});
              setLoading(false);
              return;
            }

            setProject(nextProject);
            setLoading(false);
          },
          (error) => {
            console.error("Error loading project:", error);
            if (isMounted) {
              setProjectLoaded(true);
              setProject(null);
              setLoading(false);
            }
          }
        );

        unsubscribeTasks = taskService.subscribeToProjectTasks(
          resolvedParams.id,
          (projectTasks) => {
            if (isMounted) {
              setTasks(projectTasks);
            }
          },
          (error) => {
            console.error("Error loading project tasks:", error);
          }
        );
      } catch (error) {
        console.error("Error loading project data:", error);
        if (isMounted) {
          setProject(null);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      unsubscribeProject?.();
      unsubscribeTasks?.();
    };
  }, [user, resolvedParams.id]);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!project) {
        if (isMounted) {
          setAssignees([]);
          setUsersMap({});
        }
        return;
      }

      const memberIds = (project.members || []).filter(Boolean);
      if (memberIds.length === 0) {
        if (isMounted) {
          setAssignees([]);
          setUsersMap({});
        }
        return;
      }

      try {
        const userService = UserService.getInstance(db);
        const users = await Promise.all(memberIds.map((memberId) => userService.getUser(memberId)));
        if (!isMounted) return;

        const mapped = users
          .filter((userData): userData is UserData => Boolean(userData))
          .map((userData) => ({
            uid: userData.uid,
            label: userData.displayName || userData.email || userData.uid.slice(0, 8),
            photoURL: userData.photoURL,
          }));
        setAssignees(mapped);

        const usersData: Record<string, UserData> = {};
        users.forEach((userData) => {
          if (userData) {
            usersData[userData.uid] = userData;
          }
        });
        setUsersMap(usersData);
      } catch (error) {
        console.error("Error loading project members:", error);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [project?.id, project?.members?.join("|")]);

  const currentUserRole = getUserRole(project, user?.uid);
  const canEditTaskActions = canEditTasks(currentUserRole);
  const canDeleteTaskActions = canDeleteTasks(currentUserRole);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handlePlayTask = async (task: Task) => {
    if (!canEditTaskActions) return;

    try {
      await startTimer({
        projectId: task.projectId,
        taskId: task.id,
        description: task.title,
      });

      if (task.status === "in-progress") {
        return;
      }

      const nextPosition = tasks.filter((item) => item.status === "in-progress").length;
      const taskService = TaskService.getInstance(db);
      await taskService.updateTask(task.id, { status: "in-progress", position: nextPosition });

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, status: "in-progress", position: nextPosition }
            : item
        )
      );
    } catch (error) {
      console.error("Error starting timer for task:", error);
    }
  };

  const isTaskActive = (taskId: string) =>
    Boolean(isRunning && activeEntry?.taskId && activeEntry.taskId === taskId);

  const toggleFilterValue = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleClearFilters = () => {
    setStatusFilters([]);
    setPriorityFilters([]);
    setAssigneeFilters([]);
    setTagFilters([]);
    setDueDateFrom("");
    setDueDateTo("");
  };

  const activeFiltersCount =
    statusFilters.length +
    priorityFilters.length +
    assigneeFilters.length +
    tagFilters.length +
    (dueDateFrom ? 1 : 0) +
    (dueDateTo ? 1 : 0);

  const { todoTasks, inProgressTasks, doneTasks } = useKanbanTasks({
    tasks,
    searchTerm,
    statusFilters,
    priorityFilters,
    assigneeFilters,
    tagFilters,
    dueDateFrom,
    dueDateTo,
  });

  useEffect(() => {
    const loadTags = async () => {
      if (!resolvedParams.id) {
        setTags([]);
        return;
      }
      try {
        const tagService = TagService.getInstance(db);
        const projectTags = await tagService.getTagsByProject(resolvedParams.id);
        setTags(projectTags);
      } catch (error) {
        console.error("Error loading tags:", error);
        setTags([]);
      }
    };

    loadTags();
  }, [resolvedParams.id]);

  type KanbanAssignee = { id: string; displayName: string; photoURL?: string | null };

  const getUserInfo = (userId: string): KanbanAssignee | null => {
    const userData = usersMap[userId];
    if (!userData) {
      return null;
    }
    return {
      id: userId,
      displayName: userData.displayName || userData.email || "Unknown",
      photoURL: userData.photoURL ?? null,
    };
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setSelectedTask(task);
    setEditData(task);
  };

  const handleBackToList = () => {
    setSelectedTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canDeleteTaskActions) return;
    const confirmed = window.confirm("Delete this task? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const taskService = TaskService.getInstance(db);
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    if (!selectedTask) return;
    const latest = tasks.find((task) => task.id === selectedTask.id);
    if (latest && latest !== selectedTask) {
      setSelectedTask(latest);
    }
  }, [tasks, selectedTask]);

  useEffect(() => {
    if (!selectedTask || !canEditTaskActions) return;

    const payload = {
      title: editData.title ?? selectedTask.title,
      description: editData.description ?? "",
      status: editData.status ?? selectedTask.status,
      priority: editData.priority ?? selectedTask.priority,
      dueDate: editData.dueDate ?? selectedTask.dueDate,
      assigneeIds: editData.assigneeIds ?? selectedTask.assigneeIds ?? [],
      tagIds: editData.tagIds ?? selectedTask.tagIds ?? [],
    };

    const normalizeDate = (value?: Date | string) => (value ? new Date(value).toISOString() : "");

    const currentSnapshot = JSON.stringify({
      title: payload.title || "",
      description: payload.description || "",
      status: payload.status || "todo",
      priority: payload.priority || "medium",
      dueDate: normalizeDate(payload.dueDate),
      assigneeIds: payload.assigneeIds,
      tagIds: payload.tagIds,
    });

    const savedSnapshot = JSON.stringify({
      title: selectedTask.title || "",
      description: selectedTask.description || "",
      status: selectedTask.status || "todo",
      priority: selectedTask.priority || "medium",
      dueDate: normalizeDate(selectedTask.dueDate),
      assigneeIds: selectedTask.assigneeIds || [],
      tagIds: selectedTask.tagIds || [],
    });

    if (currentSnapshot === savedSnapshot) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const taskService = TaskService.getInstance(db);
        const updates: Partial<Task> = {};

        if (payload.title !== selectedTask.title) updates.title = payload.title;
        if ((payload.description || "") !== (selectedTask.description || "")) {
          updates.description = payload.description;
        }
        if (payload.status !== selectedTask.status) updates.status = payload.status;
        if (payload.priority !== selectedTask.priority) updates.priority = payload.priority;

        const payloadDue = normalizeDate(payload.dueDate);
        const selectedDue = normalizeDate(selectedTask.dueDate);
        if (payloadDue !== selectedDue) {
          updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
        }

        const selectedAssigneeIds = selectedTask.assigneeIds || [];
        const payloadAssigneeIds = payload.assigneeIds || [];
        if (JSON.stringify(payloadAssigneeIds) !== JSON.stringify(selectedAssigneeIds)) {
          updates.assigneeIds = payloadAssigneeIds;
          updates.assigneeId = payloadAssigneeIds[0] || "";
        }

        const selectedTagIds = selectedTask.tagIds || [];
        const payloadTagIds = payload.tagIds || [];
        if (JSON.stringify(payloadTagIds) !== JSON.stringify(selectedTagIds)) {
          updates.tagIds = payloadTagIds;
        }

        if (Object.keys(updates).length === 0) return;

        await taskService.updateTask(selectedTask.id, updates);
        setTasks((prev) =>
          prev.map((task) => (task.id === selectedTask.id ? { ...task, ...updates } : task))
        );
        setSelectedTask((prev) => (prev ? { ...prev, ...updates } : prev));
      } catch (error) {
        console.error("Error auto-saving task:", error);
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editData, selectedTask, canEditTaskActions, setTasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!canEditTaskActions) return;
    const { source, destination, draggableId } = result;

    // Si no hay destino válido, no hacer nada
    if (!destination) {
      return;
    }

    // Si se soltó en el mismo lugar, no hacer nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Mapeo de droppableId a status
    const statusMap: Record<string, string> = {
      "todo": "todo",
      "in-progress": "in-progress",
      "done": "done"
    };

    const newStatus = statusMap[destination.droppableId];
    
    if (!newStatus) {
      console.error("Invalid droppableId:", destination.droppableId);
      return;
    }

    const columns: Record<string, Task[]> = {
      "todo": todoTasks,
      "in-progress": inProgressTasks,
      "done": doneTasks,
    };

    const sourceTasks = [...(columns[source.droppableId] || [])];
    const destinationTasks =
      source.droppableId === destination.droppableId
        ? sourceTasks
        : [...(columns[destination.droppableId] || [])];

    const [movedTask] = sourceTasks.splice(source.index, 1);
    if (!movedTask) return;
    destinationTasks.splice(destination.index, 0, { ...movedTask, status: newStatus });

    const updatedSourceTasks = source.droppableId === destination.droppableId
      ? destinationTasks
      : sourceTasks;
    const updatedDestinationTasks = destinationTasks;

    const updatedPositions = new Map<string, number>();
    updatedSourceTasks.forEach((task, index) => updatedPositions.set(task.id, index));
    if (source.droppableId !== destination.droppableId) {
      updatedDestinationTasks.forEach((task, index) => updatedPositions.set(task.id, index));
    }

    // Actualizar optimísticamente el estado local
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (!updatedPositions.has(task.id) && task.id !== draggableId) return task;
        const updatedStatus = task.id === draggableId ? newStatus : task.status;
        const updatedPosition = updatedPositions.get(task.id) ?? task.position ?? 0;
        return { ...task, status: updatedStatus, position: updatedPosition };
      })
    );

    // Actualizar en Firebase
    try {
      const taskService = TaskService.getInstance(db);
      const updates: Array<Promise<void>> = [];

      updatedPositions.forEach((position, taskId) => {
        const status = taskId === draggableId ? newStatus : undefined;
        updates.push(taskService.updateTask(taskId, {
          position,
          ...(status ? { status } : {}),
        }));
      });

      await Promise.all(updates);
    } catch (error) {
      console.error("Error updating task order:", error);
    }
  };


  if (authLoading || loading || !projectLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading kanban...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!project) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border z-10">
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
                <BreadcrumbLink href={`/app/project/${resolvedParams.id}`} className="cursor-pointer">
                  {project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Kanban</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Board Toolbar */}
      <div className="px-6 py-4 flex flex-col gap-4 bg-background border-b border-border flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/app/project/${resolvedParams.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            />
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.members && project.members.length > 0 && (
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((memberId) => {
                  const userData = usersMap[memberId];
                  if (!userData) return null;
                  return (
                    <Avatar key={memberId} className="w-8 h-8 border-2 border-background">
                      {userData.photoURL && <AvatarImage src={userData.photoURL} />}
                      <AvatarFallback className="text-xs">
                        {(userData.displayName || userData.email || "U").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {project.members.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary text-xs font-medium flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user && (
              <CreateTaskDialog
                projectId={resolvedParams.id}
                userId={user.uid}
                assignees={assignees}
                onTaskCreated={handleTaskCreated}
                disabled={!canEditTaskActions}
              />
            )}
          </div>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          <CollapsibleContent className="mt-2 rounded-lg border border-border/60 bg-background/80 p-4">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="space-y-2">
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${value}`}
                        checked={statusFilters.includes(value)}
                        onCheckedChange={() => toggleFilterValue(value, setStatusFilters)}
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
                        onCheckedChange={() => toggleFilterValue(value, setPriorityFilters)}
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
                      onCheckedChange={() => toggleFilterValue(UNASSIGNED_FILTER_VALUE, setAssigneeFilters)}
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
                        onCheckedChange={() => toggleFilterValue(assignee.uid, setAssigneeFilters)}
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
                          onCheckedChange={() => toggleFilterValue(tag.id, setTagFilters)}
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
                    <label htmlFor="due-from" className="text-xs text-muted-foreground">From</label>
                    <Input
                      id="due-from"
                      type="date"
                      value={dueDateFrom}
                      onChange={(event) => setDueDateFrom(event.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="due-to" className="text-xs text-muted-foreground">To</label>
                    <Input
                      id="due-to"
                      type="date"
                      value={dueDateTo}
                      onChange={(event) => setDueDateTo(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Kanban Columns Container */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-6">
          <div className="flex h-full gap-6 min-w-[1000px]">
            {/* Column: To Do */}
            <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <h3 className="font-semibold text-foreground">To Do</h3>
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">
                    {todoTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <Droppable droppableId="todo" isDropDisabled={!canEditTaskActions}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${
                      snapshot.isDraggingOver ? "bg-secondary/70" : ""
                    }`}
                  >
                    {todoTasks.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground text-sm">
                        No tasks in To Do
                      </div>
                    ) : (
                      todoTasks.map((task, index) => (
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          assignees={(task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []))
                            .map((assigneeId) => getUserInfo(assigneeId))
                            .filter((assignee): assignee is KanbanAssignee => Boolean(assignee))}
                          canEdit={canEditTaskActions}
                          canPlay={canEditTaskActions}
                          isActive={isTaskActive(task.id)}
                          isPaused={isTaskActive(task.id) && isPaused}
                          onPlay={handlePlayTask}
                          onPause={pauseTimer}
                          onResume={resumeTimer}
                          onStop={stopTimer}
                          onEdit={handleEditTask}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Column: In Progress */}
            <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <h3 className="font-semibold text-foreground">In Progress</h3>
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">
                    {inProgressTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
              
              <Droppable droppableId="in-progress" isDropDisabled={!canEditTaskActions}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${
                      snapshot.isDraggingOver ? "bg-secondary/70" : ""
                    }`}
                  >
                    {inProgressTasks.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground text-sm">
                        Drag tasks here to start
                      </div>
                    ) : (
                      inProgressTasks.map((task, index) => (
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          assignees={(task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []))
                            .map((assigneeId) => getUserInfo(assigneeId))
                            .filter((assignee): assignee is KanbanAssignee => Boolean(assignee))}
                          canEdit={canEditTaskActions}
                          canPlay={canEditTaskActions}
                          isActive={isTaskActive(task.id)}
                          isPaused={isTaskActive(task.id) && isPaused}
                          onPlay={handlePlayTask}
                          onPause={pauseTimer}
                          onResume={resumeTimer}
                          onStop={stopTimer}
                          onEdit={handleEditTask}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Column: Done */}
            <div className="flex-1 flex flex-col min-w-[320px] max-w-md bg-secondary/50 rounded-xl border border-border">
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <h3 className="font-semibold text-foreground">Done</h3>
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-medium">
                    {doneTasks.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
              
              <Droppable droppableId="done" isDropDisabled={!canEditTaskActions}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${
                      snapshot.isDraggingOver ? "bg-secondary/70" : ""
                    }`}
                  >
                    {doneTasks.length === 0 ? (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground text-sm">
                        No completed tasks
                      </div>
                    ) : (
                      doneTasks.map((task, index) => (
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          assignees={(task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []))
                            .map((assigneeId) => getUserInfo(assigneeId))
                            .filter((assignee): assignee is KanbanAssignee => Boolean(assignee))}
                          canEdit={canEditTaskActions}
                          canPlay={canEditTaskActions}
                          isActive={isTaskActive(task.id)}
                          isPaused={isTaskActive(task.id) && isPaused}
                          onPlay={handlePlayTask}
                          onPause={pauseTimer}
                          onResume={resumeTimer}
                          onStop={stopTimer}
                          onEdit={handleEditTask}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </DragDropContext>

      <ProjectTaskDrawer
        selectedTask={selectedTask}
        editData={editData}
        setEditData={setEditData}
        canEditTaskActions={canEditTaskActions}
        canDeleteTaskActions={canDeleteTaskActions}
        isEditing={true}
        projectName={project?.name}
        assignees={assignees}
        usersMap={usersMap}
        availableTags={tags}
        projectId={resolvedParams.id}
        onTagsUpdated={setTags}
        onBackToList={handleBackToList}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default KanbanPage;
