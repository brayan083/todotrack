"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { ArrowLeft, Search, User2, DollarSign, Clock, Users, CheckCircle2, Circle, AlertCircle, Edit2, Save, X, LayoutDashboard, UserPlus, Trash2, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { ProjectService, type Project } from "@/services/project.service";
import { UserService, type UserData } from "@/services/user.service";
import { TaskService, type Task } from "@/services/task.service";
import { InvitationService, type Invitation } from "@/services/invitation.service";
import { ActivityLogService } from "@/services/activity-log.service";
import { db } from "@/lib/firebase.config";
import { useAuthStore } from "@/stores";
import {
  canCreateTasks,
  canDeleteTasks,
  canEditTasks,
  canChangeMemberRole,
  canInviteMembers,
  canManageMembers,
  canRemoveMember,
  getRoleLabel,
  getUserRole,
  type InviteRole,
  type ProjectRole,
} from "@/lib/roles";

interface ProjectTasksPageProps {
  params: Promise<{
    id: string;
    taskId?: string;
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

const STATUS_ACCENTS: Record<string, string> = {
  "todo": "bg-slate-300",
  "in-progress": "bg-orange-400",
  "done": "bg-green-500",
};

const PRIORITY_STYLES: Record<string, string> = {
  "low": "bg-blue-100 text-blue-700",
  "medium": "bg-yellow-100 text-yellow-700",
  "high": "bg-orange-100 text-orange-700",
  "urgent": "bg-red-100 text-red-700",
};

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const PRIORITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};
const UNASSIGNED_FILTER_VALUE = "unassigned";
const TASKS_PAGE_SIZE = 7;

const ProjectTasksPage: React.FC<ProjectTasksPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<{ uid: string; label: string; photoURL?: string | null }[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(["todo", "in-progress"]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [visibleTaskCount, setVisibleTaskCount] = useState(TASKS_PAGE_SIZE);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteMode, setInviteMode] = useState<'email' | 'uid'>('email');
  const [inviteValue, setInviteValue] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string | null>(null);

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

        try {
          const invitationService = InvitationService.getInstance(db);
          const projectInvitations = await invitationService.getProjectInvitations(resolvedParams.id);
          if (isMounted) {
            setInvitations(projectInvitations);
          }
        } catch (inviteError) {
          console.error('Error loading invitations:', inviteError);
          if (isMounted) {
            setInvitations([]);
            setInviteError('Unable to load invitations');
          }
        }
      } catch (error) {
        console.error("Error loading project tasks:", error);
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

  // Check URL for task ID and load task if present
  useEffect(() => {
    if (typeof window === 'undefined' || tasks.length === 0) return;
    
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/');
    const taskIndex = pathParts.indexOf('task');
    
    if (taskIndex !== -1 && pathParts[taskIndex + 1]) {
      const taskId = pathParts[taskIndex + 1];
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setEditData(task);
      }
    } else {
      setSelectedTask(null);
    }
  }, [tasks]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split('/');
      const taskIndex = pathParts.indexOf('task');
      
      if (taskIndex !== -1 && pathParts[taskIndex + 1]) {
        const taskId = pathParts[taskIndex + 1];
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          setEditData(task);
        }
      } else {
        setSelectedTask(null);
        setIsEditing(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditData(task);
    setIsEditing(false);
    // Update URL without navigation
    const newUrl = `/app/project/${resolvedParams.id}/task/${task.id}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleBackToList = () => {
    setSelectedTask(null);
    setIsEditing(false);
    // Update URL back to project
    const newUrl = `/app/project/${resolvedParams.id}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleSaveChanges = async () => {
    if (!canEditTaskActions) return;
    if (!selectedTask) return;

    try {
      const taskService = TaskService.getInstance(db);
      await taskService.updateTask(selectedTask.id, editData);
      
      // Update task in list
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...editData } : t));
      setSelectedTask({ ...selectedTask, ...editData });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleInlineUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!canEditTaskActions) return;
    try {
      const taskService = TaskService.getInstance(db);
      await taskService.updateTask(taskId, updates);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));

      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
        setEditData((prev) => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
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
        handleBackToList();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const currentUserRole = useMemo(
    () => getUserRole(project, user?.uid),
    [project, user]
  );

  const canInvite = useMemo(() => canInviteMembers(currentUserRole), [currentUserRole]);
  const canManageMembersActions = useMemo(
    () => canManageMembers(currentUserRole),
    [currentUserRole]
  );
  const canCreateTaskActions = useMemo(
    () => canCreateTasks(currentUserRole),
    [currentUserRole]
  );
  const canEditTaskActions = useMemo(
    () => canEditTasks(currentUserRole),
    [currentUserRole]
  );
  const canDeleteTaskActions = useMemo(
    () => canDeleteTasks(currentUserRole),
    [currentUserRole]
  );

  const pendingInvites = useMemo(
    () => invitations.filter((invite) => invite.status === 'pending'),
    [invitations]
  );

  const handleSendInvite = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user || !project) return;

    setInviteError(null);
    const value = inviteValue.trim();
    if (!value) {
      setInviteError(inviteMode === 'email' ? 'Email is required' : 'UID is required');
      return;
    }

    try {
      setInviteLoading(true);
      const userService = UserService.getInstance(db);
      const invitationService = InvitationService.getInstance(db);
      const activityLogService = ActivityLogService.getInstance(db);

      let email = '';
      let inviteeId: string | undefined;

      if (inviteMode === 'email') {
        email = value.toLowerCase();
        if (!/.+@.+\..+/.test(email)) {
          setInviteError('Invalid email format');
          return;
        }

        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
          inviteeId = existingUser.uid;
        }
      } else {
        const existingUser = await userService.getUser(value);
        if (!existingUser) {
          setInviteError('No user found with that UID');
          return;
        }
        email = (existingUser.email || '').toLowerCase();
        if (!email) {
          setInviteError('User does not have an email configured');
          return;
        }
        inviteeId = existingUser.uid;
      }

      if (inviteeId && project.members?.includes(inviteeId)) {
        setInviteError('User is already a member of this project');
        return;
      }

      await invitationService.createInvitation({
        projectId: project.id,
        email,
        invitedBy: user.uid,
        role: inviteRole,
        inviteeId,
      });

      await activityLogService.logMemberInvited(
        project.id,
        user.uid,
        user.displayName || user.email || 'User',
        email
      );

      const refreshedInvites = await invitationService.getProjectInvitations(project.id);
      setInvitations(refreshedInvites);
      setInviteValue('');
    } catch (error: any) {
      setInviteError(error.message || 'Error sending invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setInviteLoading(true);
      const invitationService = InvitationService.getInstance(db);
      await invitationService.revokeInvitation(inviteId);
      const refreshedInvites = await invitationService.getProjectInvitations(resolvedParams.id);
      setInvitations(refreshedInvites);
    } catch (error: any) {
      setInviteError(error.message || 'Error revoking invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: ProjectRole) => {
    if (!project) return;
    setMemberActionError(null);

    try {
      setMemberActionLoadingId(memberId);
      const projectService = ProjectService.getInstance(db);
      await projectService.updateMemberRole(project.id, memberId, role);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              userRoles: {
                ...(prev.userRoles || {}),
                [memberId]: role,
              },
            }
          : prev
      );
    } catch (error: any) {
      setMemberActionError(error.message || "Unable to update member role");
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    const confirmed = window.confirm("Remove this member from the project?");
    if (!confirmed) return;

    setMemberActionError(null);

    try {
      setMemberActionLoadingId(memberId);
      const projectService = ProjectService.getInstance(db);
      await projectService.removeMember(project.id, memberId);
      setProject((prev) => {
        if (!prev) return prev;
        const nextRoles = { ...(prev.userRoles || {}) };
        delete nextRoles[memberId];
        return {
          ...prev,
          members: (prev.members || []).filter((id) => id !== memberId),
          userRoles: nextRoles,
        };
      });
      setAssignees((prev) => prev.filter((assignee) => assignee.uid !== memberId));
      setUsersMap((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } catch (error: any) {
      setMemberActionError(error.message || "Unable to remove member");
    } finally {
      setMemberActionLoadingId(null);
    }
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

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by status
    if (statusFilters.length > 0) {
      filtered = filtered.filter((task) => statusFilters.includes(task.status));
    }

    // Filter by priority
    if (priorityFilters.length > 0) {
      filtered = filtered.filter((task) => {
        const priorityValue = task.priority || "medium";
        return priorityFilters.includes(priorityValue);
      });
    }

    // Filter by assignee
    if (assigneeFilters.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.assigneeId) {
          return assigneeFilters.includes(UNASSIGNED_FILTER_VALUE);
        }
        return assigneeFilters.includes(task.assigneeId);
      });
    }

    // Filter by due date range
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

    // Filter by search term
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((task) => {
        return (
          task.title.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term)
        );
      });
    }
    
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "priority") {
        const aPriority = PRIORITY_ORDER[a.priority || "medium"] || 0;
        const bPriority = PRIORITY_ORDER[b.priority || "medium"] || 0;
        return sortDirection === "asc" ? aPriority - bPriority : bPriority - aPriority;
      }

      if (sortBy === "dueDate") {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return sortDirection === "asc" ? aDue - bDue : bDue - aDue;
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "asc" ? aCreated - bCreated : bCreated - aCreated;
    });

    return sorted;
  }, [tasks, searchTerm, statusFilters, priorityFilters, assigneeFilters, dueDateFrom, dueDateTo, sortBy, sortDirection]);

  useEffect(() => {
    setVisibleTaskCount(TASKS_PAGE_SIZE);
  }, [searchTerm, statusFilters, priorityFilters, assigneeFilters, dueDateFrom, dueDateTo, sortBy, sortDirection]);

  const taskStats = useMemo(() => {
    const stats = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      done: 0,
    };
    tasks.forEach((task) => {
      if (task.status === "todo") stats.todo++;
      else if (task.status === "in-progress") stats.inProgress++;
      else if (task.status === "done") stats.done++;
    });
    return stats;
  }, [tasks]);

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => (prev.some((task) => task.id === newTask.id) ? prev : [...prev, newTask]));
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
      {/* Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Tasks */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Breadcrumb */}
          <div className="bg-background border-b border-border">
            <div className="px-6 py-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/app/project"
                      className="cursor-pointer"
                    >
                      Projects
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {selectedTask ? (
                      <BreadcrumbLink
                        onClick={handleBackToList}
                        className="cursor-pointer"
                      >
                        {project?.name}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{project?.name}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {selectedTask && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{selectedTask.title}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          {/* Tasks Header */}
          <div className="border-b border-border bg-background px-6 py-4">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">Tasks</h2>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTasks.length}/{tasks.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Showing filtered tasks in this project.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/app/kanban/${resolvedParams.id}`)}
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Kanban
                  </Button>
                  {user && canCreateTaskActions && (
                    <CreateTaskDialog
                      projectId={resolvedParams.id}
                      userId={user.uid}
                      assignees={assignees}
                      onTaskCreated={handleTaskCreated}
                    />
                  )}
                </div>
              </div>

              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search tasks..."
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                      </div>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as "priority" | "dueDate" | "createdAt")}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Created date</SelectItem>
                          <SelectItem value="dueDate">Due date</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as "asc" | "desc")}>
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
                  <CollapsibleContent className="mt-4">
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
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {tasks.length === 0 ? (
                  <>
                    <div className="mb-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                      No tasks yet
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create your first task to get started.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                      No tasks match your filters
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.slice(0, visibleTaskCount).map((task) => {
                  const assignedUser = usersMap[task.assigneeId];
                  const isDone = task.status === "done";
                  
                  return (
                    <Card
                      key={task.id}
                      className="group relative cursor-pointer overflow-hidden border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardContent className="relative p-5">
                        <div
                          className={`absolute left-0 top-0 h-full w-1 ${
                            STATUS_ACCENTS[task.status] || STATUS_ACCENTS.todo
                          }`}
                        />
                        <div className="flex items-start gap-4">
                          {/* Status Indicator */}
                          <div className="flex items-center justify-center pt-1">
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : task.status === "in-progress" ? (
                              <Circle className="h-5 w-5 text-orange-500 fill-orange-500/20" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-400" />
                            )}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                {canEditTaskActions ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className={`text-left text-base font-semibold tracking-tight mb-1 transition-colors group-hover:text-primary ${
                                          isDone ? "line-through text-muted-foreground" : ""
                                        }`}
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        {task.title}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-72 p-3">
                                      <DropdownMenuLabel>Title</DropdownMenuLabel>
                                      <Input
                                        defaultValue={task.title}
                                        onBlur={(event) => {
                                          const value = event.target.value.trim();
                                          if (value && value !== task.title) {
                                            handleInlineUpdate(task.id, { title: value });
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
                                        className="text-left text-sm text-muted-foreground line-clamp-2 hover:text-foreground"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        {task.description || "Add description"}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-80 p-3">
                                      <DropdownMenuLabel>Description</DropdownMenuLabel>
                                      <Textarea
                                        defaultValue={task.description || ""}
                                        className="min-h-[96px]"
                                        onBlur={(event) => {
                                          const value = event.target.value.trim();
                                          if (value !== (task.description || "")) {
                                            handleInlineUpdate(task.id, { description: value });
                                          }
                                        }}
                                        onClick={(event) => event.stopPropagation()}
                                      />
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(event) => {
                                          event.preventDefault();
                                          handleInlineUpdate(task.id, { description: "" });
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
                              
                              {/* Priority Badge */}
                              <div className="flex items-center gap-2 shrink-0">
                                {canEditTaskActions ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Badge
                                        className={`${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES["medium"]} cursor-pointer rounded-full px-3 py-1 text-xs font-semibold`}
                                        variant="secondary"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        Priority: {task.priority}
                                      </Badge>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                                      <DropdownMenuRadioGroup
                                        value={task.priority || "medium"}
                                        onValueChange={(value) => handleInlineUpdate(task.id, { priority: value })}
                                      >
                                        <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <Badge
                                    className={`${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES["medium"]} rounded-full px-3 py-1 text-xs font-semibold`}
                                    variant="secondary"
                                  >
                                    Priority: {task.priority}
                                  </Badge>
                                )}
                                {canDeleteTaskActions && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeleteTask(task.id);
                                    }}
                                    aria-label="Delete task"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Task Meta */}
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {/* Status */}
                              {canEditTaskActions ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Badge
                                      className={`${STATUS_STYLES[task.status] || STATUS_STYLES["todo"]} cursor-pointer rounded-full px-3 py-1 text-xs font-semibold`}
                                      variant="outline"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      Status: {STATUS_LABELS[task.status] || task.status}
                                    </Badge>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                      value={task.status}
                                      onValueChange={(value) => handleInlineUpdate(task.id, { status: value })}
                                    >
                                      <DropdownMenuRadioItem value="todo">To Do</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="in-progress">In Progress</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="done">Done</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Badge
                                  className={`${STATUS_STYLES[task.status] || STATUS_STYLES["todo"]} rounded-full px-3 py-1 text-xs font-semibold`}
                                  variant="outline"
                                >
                                  Status: {STATUS_LABELS[task.status] || task.status}
                                </Badge>
                              )}

                              {/* Assignee */}
                              {canEditTaskActions ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <User2 className="h-4 w-4" />
                                      {assignedUser ? (
                                        <span>Assignee: {assignedUser.displayName || assignedUser.email}</span>
                                      ) : (
                                        <span>Assignee: Unassigned</span>
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Assignee</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                      value={task.assigneeId || UNASSIGNED_FILTER_VALUE}
                                      onValueChange={(value) =>
                                        handleInlineUpdate(task.id, {
                                          assigneeId: value === UNASSIGNED_FILTER_VALUE ? "" : value,
                                        })
                                      }
                                    >
                                      <DropdownMenuRadioItem value={UNASSIGNED_FILTER_VALUE}>
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
                              ) : (
                                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                  <User2 className="h-4 w-4" />
                                  {assignedUser ? (
                                    <span>Assignee: {assignedUser.displayName || assignedUser.email}</span>
                                  ) : (
                                    <span>Assignee: Unassigned</span>
                                  )}
                                </div>
                              )}

                              {/* Due Date */}
                              {canEditTaskActions ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        Due: {task.dueDate
                                          ? new Date(task.dueDate).toLocaleDateString()
                                          : "No due date"}
                                      </span>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="p-3">
                                    <DropdownMenuLabel>Due date</DropdownMenuLabel>
                                    <div className="mt-2 space-y-2">
                                      <Input
                                        type="date"
                                        value={
                                          task.dueDate
                                            ? new Date(task.dueDate).toISOString().split("T")[0]
                                            : ""
                                        }
                                        onChange={(event) => {
                                          const value = event.target.value;
                                          handleInlineUpdate(task.id, {
                                            dueDate: value ? new Date(value) : undefined,
                                          });
                                        }}
                                        onClick={(event) => event.stopPropagation()}
                                      />
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onSelect={(event) => {
                                          event.preventDefault();
                                          handleInlineUpdate(task.id, { dueDate: undefined });
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
                                    Due: {task.dueDate
                                      ? new Date(task.dueDate).toLocaleDateString()
                                      : "No due date"}
                                  </span>
                                </div>
                              )}

                              {/* Created Date */}
                              <div className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {visibleTaskCount < filteredTasks.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setVisibleTaskCount((prev) =>
                          Math.min(prev + TASKS_PAGE_SIZE, filteredTasks.length)
                        )
                      }
                    >
                      Ver mas
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Drawer
            open={Boolean(selectedTask)}
            onOpenChange={(open) => {
              if (!open) {
                handleBackToList();
              }
            }}
          >
            <DrawerContent direction="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
              {selectedTask && (
                <div className="flex min-h-full flex-col">
                  <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                    <DrawerHeader className="space-y-3 px-6 py-4 text-left">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToList}
                          className="gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to tasks
                        </Button>
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={handleSaveChanges}>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            {canDeleteTaskActions && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteTask(selectedTask.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setEditData(selectedTask);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          canEditTaskActions && (
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              {canDeleteTaskActions && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteTask(selectedTask.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <div className="space-y-2">
                        <DrawerTitle className="text-2xl font-bold tracking-tight">
                          {selectedTask.title}
                        </DrawerTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[selectedTask.status] || STATUS_STYLES["todo"]
                            }`}
                          >
                            {STATUS_LABELS[selectedTask.status] || selectedTask.status}
                          </Badge>
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              PRIORITY_STYLES[selectedTask.priority] || PRIORITY_STYLES["medium"]
                            }`}
                          >
                            {selectedTask.priority}
                          </Badge>
                          {project?.name && (
                            <span className="text-xs text-muted-foreground">Project: {project.name}</span>
                          )}
                          {isEditing && (
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                              Editing
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DrawerHeader>
                  </div>

                  <div className="space-y-6 px-6 py-6">
                    {/* Description */}
                    <Card className="border-border/60 bg-card/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditing ? (
                          <Textarea
                            className="min-h-32"
                            value={editData.description || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, description: e.target.value })
                            }
                            placeholder="Enter task description..."
                          />
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {selectedTask.description || "No description provided"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Details */}
                    <Card className="border-border/60 bg-card/60 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                          {/* Status */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            {isEditing ? (
                              <Select
                                value={editData.status || "todo"}
                                onValueChange={(value) =>
                                  setEditData({ ...editData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  STATUS_STYLES[selectedTask.status] || STATUS_STYLES["todo"]
                                }`}
                              >
                                {STATUS_LABELS[selectedTask.status] || selectedTask.status}
                              </Badge>
                            )}
                          </div>

                          {/* Priority */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Priority</label>
                            {isEditing ? (
                              <Select
                                value={editData.priority || "medium"}
                                onValueChange={(value) =>
                                  setEditData({ ...editData, priority: value })
                                }
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
                            ) : (
                              <Badge
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  PRIORITY_STYLES[selectedTask.priority] || PRIORITY_STYLES["medium"]
                                }`}
                              >
                                {selectedTask.priority}
                              </Badge>
                            )}
                          </div>

                          {/* Due Date */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={
                                  editData.dueDate
                                    ? new Date(editData.dueDate).toISOString().split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    dueDate: e.target.value ? new Date(e.target.value) : undefined,
                                  })
                                }
                              />
                            ) : (
                              <p className="text-sm">
                                {selectedTask.dueDate
                                  ? new Date(selectedTask.dueDate).toLocaleDateString()
                                  : "No due date"}
                              </p>
                            )}
                          </div>

                          {/* Created Date */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Created</label>
                            <p className="text-sm">
                              {new Date(selectedTask.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Assigned To */}
                          <div className="space-y-2 sm:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                            {isEditing ? (
                              <Select
                                value={editData.assigneeId || UNASSIGNED_FILTER_VALUE}
                                onValueChange={(value) =>
                                  setEditData({
                                    ...editData,
                                    assigneeId: value === UNASSIGNED_FILTER_VALUE ? "" : value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UNASSIGNED_FILTER_VALUE}>Unassigned</SelectItem>
                                  {assignees.map((assignee) => (
                                    <SelectItem key={assignee.uid} value={assignee.uid}>
                                      {assignee.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : usersMap[selectedTask.assigneeId] ? (
                              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {usersMap[selectedTask.assigneeId].displayName?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {usersMap[selectedTask.assigneeId].displayName || usersMap[selectedTask.assigneeId].email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {usersMap[selectedTask.assigneeId].email}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not assigned</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DrawerContent>
          </Drawer>
        </div>

        {/* Right Column - Project Configuration */}
        <div className="w-96 flex flex-col overflow-hidden bg-muted/30">
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-6">
            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Project Details</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.name}</p>
                  </div>
                  <Badge variant="secondary" className="h-6">
                    {taskStats.total} {taskStats.total === 1 ? "task" : "tasks"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {project.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}

                <Separator />

                {/* Client */}
                {project.clientName && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Client</h3>
                    <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{project.clientName}</span>
                    </div>
                  </div>
                )}

                {/* Budget & Rate */}
                {(project.budget !== null || project.hourlyRate !== null) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Financial</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {project.budget !== null && (
                        <div className="bg-green-500/10 rounded-md px-3 py-2">
                          <div className="flex items-center gap-1 text-green-700 dark:text-green-400 mb-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Budget</span>
                          </div>
                          <span className="text-sm font-bold">${project.budget.toLocaleString()}</span>
                        </div>
                      )}
                      {project.hourlyRate !== null && (
                        <div className="bg-blue-500/10 rounded-md px-3 py-2">
                          <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Rate</span>
                          </div>
                          <span className="text-sm font-bold">${project.hourlyRate}/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimated Time */}
                {project.estimatedTime && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Estimated Time</h3>
                    <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.estimatedTime}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members Card */}
            {project.members && project.members.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  {canInvite && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Invite Members
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {inviteError && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                              {inviteError}
                            </div>
                          )}
                          <form onSubmit={handleSendInvite} className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <Select value={inviteMode} onValueChange={(value) => setInviteMode(value as 'email' | 'uid')}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="uid">UID</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                className="col-span-2"
                                placeholder={inviteMode === 'email' ? 'user@example.com' : 'Firebase UID'}
                                value={inviteValue}
                                onChange={(event) => setInviteValue(event.target.value)}
                                disabled={inviteLoading}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as InviteRole)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button type="submit" disabled={inviteLoading} className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Invite
                              </Button>
                            </div>
                          </form>

                          {pendingInvites.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Pending invitations</p>
                              {pendingInvites.map((invite) => (
                                <div
                                  key={invite.id}
                                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{invite.email}</p>
                                    <p className="text-xs text-muted-foreground">Role: {invite.role}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={inviteLoading}
                                    onClick={() => handleRevokeInvite(invite.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {memberActionError && (
                    <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {memberActionError}
                    </div>
                  )}
                  <div className="space-y-3">
                    {project.members.map((memberId) => {
                      const memberData = usersMap[memberId];
                      const memberRole =
                        (getUserRole(project, memberId) || "member") as ProjectRole;
                      const availableRoles: ProjectRole[] =
                        currentUserRole === "owner"
                          ? ["admin", "member", "viewer"]
                          : ["member", "viewer"];
                      const canManageMember =
                        canManageMembersActions &&
                        canChangeMemberRole(currentUserRole, memberRole) &&
                        memberId !== user?.uid;
                      const canRemove =
                        canManageMembersActions &&
                        canRemoveMember(currentUserRole, memberRole) &&
                        memberId !== user?.uid;
                      const isMemberLoading = memberActionLoadingId === memberId;

                      return (
                        <div key={memberId} className="flex items-center gap-3 py-2">
                          <Avatar className="h-9 w-9">
                            {memberData?.photoURL && (
                              <AvatarImage
                                src={memberData.photoURL}
                                alt={memberData.displayName || memberData.email || "User"}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {memberData?.displayName?.[0]?.toUpperCase() ||
                               memberData?.email?.[0]?.toUpperCase() ||
                               'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {memberData?.displayName || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {memberData?.email || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(memberRole)}
                            </Badge>
                            {canManageMember && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={isMemberLoading}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Change role</DropdownMenuLabel>
                                  <DropdownMenuRadioGroup
                                    value={memberRole}
                                    onValueChange={(value) =>
                                      handleUpdateMemberRole(memberId, value as ProjectRole)
                                    }
                                  >
                                    {availableRoles.map((role) => (
                                      <DropdownMenuRadioItem key={role} value={role}>
                                        {getRoleLabel(role as ProjectRole)}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                  {canRemove && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleRemoveMember(memberId)}
                                      >
                                        Remove member
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Completion</span>
                    <span className="text-muted-foreground">
                      {taskStats.total > 0 
                        ? Math.round((taskStats.done / taskStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${taskStats.total > 0 
                          ? (taskStats.done / taskStats.total) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Task Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-500" />
                      <span className="text-sm font-medium">To Do</span>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {taskStats.todo}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                      {taskStats.inProgress}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                      <span className="text-sm font-medium">Done</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                      {taskStats.done}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between pt-2 px-3 py-2.5 bg-primary/10 rounded-lg">
                  <span className="text-sm font-semibold">Total Tasks</span>
                  <Badge className="bg-primary text-primary-foreground font-semibold">
                    {taskStats.total}
                  </Badge>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTasksPage;
