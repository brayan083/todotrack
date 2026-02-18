"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { Search, Plus, MoreHorizontal, Edit, Play, ArrowLeft, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ProjectService, type Project } from "@/services/project.service";
import { TaskService, type Task } from "@/services/task.service";
import { UserService, type UserData } from "@/services/user.service";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { db } from "@/lib/firebase.config";
import { useAuthStore } from "@/stores";
import { canEditTasks, getUserRole } from "@/lib/roles";

interface KanbanPageProps {
  params: Promise<{
    id: string;
  }>;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
  urgent: "text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "done": "Done",
};

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const UNASSIGNED_FILTER_VALUE = "unassigned";

const KanbanPage: React.FC<KanbanPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<{ uid: string; label: string; photoURL?: string | null }[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const loadData = async () => {
      if (!user || !resolvedParams.id) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);
        const userService = UserService.getInstance(db);

        const foundProject = await projectService.getProject(resolvedParams.id);
        if (!foundProject) {
          if (isMounted) {
            setProject(null);
          }
          return;
        }

        if (isMounted) {
          setProject(foundProject);
        }

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
          if (isMounted) {
            setAssignees(mapped);
          }

          // Crear el mapa de usuarios
          const usersData: Record<string, UserData> = {};
          users.forEach((userData) => {
            if (userData) {
              usersData[userData.uid] = userData;
            }
          });
          if (isMounted) {
            setUsersMap(usersData);
          }
        } else {
          if (isMounted) {
            setAssignees([]);
            setUsersMap({});
          }
        }

        unsubscribe = taskService.subscribeToProjectTasks(
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
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, resolvedParams.id]);

  const currentUserRole = getUserRole(project, user?.uid);
  const canEditTaskActions = canEditTasks(currentUserRole);

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

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
    setDueDateFrom("");
    setDueDateTo("");
  };

  const activeFiltersCount =
    statusFilters.length +
    priorityFilters.length +
    assigneeFilters.length +
    (dueDateFrom ? 1 : 0) +
    (dueDateTo ? 1 : 0);

  const filteredTasks = tasks.filter((task) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      task.title.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term)
    );
  });

  const filteredTasksWithFilters = filteredTasks.filter((task) => {
    if (statusFilters.length > 0 && !statusFilters.includes(task.status)) {
      return false;
    }

    if (priorityFilters.length > 0) {
      const priorityValue = task.priority || "medium";
      if (!priorityFilters.includes(priorityValue)) {
        return false;
      }
    }

    if (assigneeFilters.length > 0) {
      if (!task.assigneeId) {
        if (!assigneeFilters.includes(UNASSIGNED_FILTER_VALUE)) {
          return false;
        }
      } else if (!assigneeFilters.includes(task.assigneeId)) {
        return false;
      }
    }

    if (dueDateFrom || dueDateTo) {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const fromDate = dueDateFrom ? new Date(`${dueDateFrom}T00:00:00`) : null;
      const toDate = dueDateTo ? new Date(`${dueDateTo}T23:59:59`) : null;
      if (fromDate && dueDate < fromDate) return false;
      if (toDate && dueDate > toDate) return false;
    }

    return true;
  });

  const sortTasksByPosition = (list: Task[]) =>
    [...list].sort((a, b) => {
      const aPos = a.position ?? 0;
      const bPos = b.position ?? 0;
      if (aPos !== bPos) return aPos - bPos;
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aCreated - bCreated;
    });

  const todoTasks = sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "todo"));
  const inProgressTasks = sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "in-progress"));
  const doneTasks = sortTasksByPosition(filteredTasksWithFilters.filter((task) => task.status === "done"));

  const getUserInfo = (userId: string) => {
    const userData = usersMap[userId];
    if (!userData) {
      return { displayName: "Unknown", email: "", photoURL: null };
    }
    return {
      displayName: userData.displayName || userData.email || "Unknown",
      email: userData.email || "",
      photoURL: userData.photoURL || null,
    };
  };

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

  const renderTaskCard = (task: Task, index: number) => {
    const assignee = task.assigneeId ? getUserInfo(task.assigneeId) : null;
    const priorityClass = task.priority ? PRIORITY_STYLES[task.priority] : PRIORITY_STYLES.medium;

    return (
      <Draggable
        key={task.id}
        draggableId={task.id}
        index={index}
        isDragDisabled={!canEditTaskActions}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <Card 
              className={`group ${
                canEditTaskActions
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default"
              } hover:shadow-md transition-all ${
                snapshot.isDragging ? "shadow-lg rotate-2" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={priorityClass}>
                    {task.priority || "medium"}
                  </Badge>
                  {canEditTaskActions && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/app/project/${resolvedParams.id}/task/${task.id}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <h4 className="text-sm font-medium mb-3 leading-snug">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {assignee ? (
                      <>
                        <Avatar className="w-6 h-6">
                          {assignee.photoURL && <AvatarImage src={assignee.photoURL} />}
                          <AvatarFallback className="text-[10px]">
                            {assignee.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{assignee.displayName}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                          UN
                        </div>
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading kanban...</p>
        </div>
      </div>
    );
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
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
                      todoTasks.map((task, index) => renderTaskCard(task, index))
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
                      inProgressTasks.map((task, index) => renderTaskCard(task, index))
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
                      doneTasks.map((task, index) => renderTaskCard(task, index))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanPage;
