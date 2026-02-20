"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, notFound } from "next/navigation";
import { TaskService, type Task } from "@/services/task.service";
import { TagService, type Tag } from "@/services/tag.service";
import { db } from "@/lib/firebase.config";
import { PRIORITY_ORDER } from "@/lib/task-constants";
import { useAuthStore } from "@/stores";
import { useTimer } from "@/hooks";
import {
  canCreateTasks,
  canDeleteTasks,
  canEditTasks,
  canInviteMembers,
  canManageMembers,
  canManageProject,
  getUserRole,
} from "@/lib/roles";
import { useTaskFilters } from "@/app/app/_hooks/use-task-filters";
import { ProjectDetailsCard } from "./_components/project-details-card";
import { ProjectMembersCard } from "./_components/project-members-card";
import { ProjectTaskStatsCard } from "./_components/project-task-stats-card";
import { ProjectTasksHeader } from "./_components/project-tasks-header";
import { ProjectTasksFilters } from "./_components/project-tasks-filters";
import { ProjectTaskList } from "./_components/project-task-list";
import { ProjectTaskDrawer } from "./_components/project-task-drawer";
import { useProjectTasksPageData } from "./_hooks/use-project-tasks-page-data";

interface ProjectTasksPageProps {
  params: Promise<{
    id: string;
    taskId?: string;
  }>;
}

const TASKS_PAGE_SIZE = 7;

const ProjectTasksPage: React.FC<ProjectTasksPageProps> = ({ params }) => {
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
  const {
    project,
    projectLoaded,
    setProject,
    tasks,
    setTasks,
    assignees,
    usersMap,
    loading,
    invitations,
    inviteMode,
    inviteValue,
    inviteRole,
    inviteLoading,
    inviteError,
    memberActionError,
    memberActionLoadingId,
    setInviteMode,
    setInviteValue,
    setInviteRole,
    handleSendInvite,
    handleRevokeInvite,
    handleUpdateMemberRole,
    handleRemoveMember,
  } = useProjectTasksPageData({ projectId: resolvedParams.id, user });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(["todo", "in-progress"]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [assigneeFilters, setAssigneeFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "createdAt">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [visibleTaskCount, setVisibleTaskCount] = useState(TASKS_PAGE_SIZE);
  const [tags, setTags] = useState<Tag[]>([]);
  const isEditing = true;

  const filteredTasks = useTaskFilters({
    tasks,
    searchTerm,
    statusFilters,
    priorityFilters,
    assigneeFilters,
    tagFilters,
    dueDateFrom,
    dueDateTo,
  });

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
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
  }, [filteredTasks, sortBy, sortDirection]);

  useEffect(() => {
    setVisibleTaskCount(TASKS_PAGE_SIZE);
  }, [searchTerm, statusFilters, priorityFilters, assigneeFilters, tagFilters, dueDateFrom, dueDateTo, sortBy, sortDirection]);

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

  useEffect(() => {
    if (typeof window === "undefined" || tasks.length === 0) return;

    const url = new URL(window.location.href);
    const pathParts = url.pathname.split("/");
    const taskIndex = pathParts.indexOf("task");

    if (taskIndex !== -1 && pathParts[taskIndex + 1]) {
      const taskId = pathParts[taskIndex + 1];
      const task = tasks.find((item) => item.id === taskId);
      if (task) {
        setSelectedTask(task);
        setEditData(task);
      }
    } else {
      setSelectedTask(null);
    }
  }, [tasks]);

  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split("/");
      const taskIndex = pathParts.indexOf("task");

      if (taskIndex !== -1 && pathParts[taskIndex + 1]) {
        const taskId = pathParts[taskIndex + 1];
        const task = tasks.find((item) => item.id === taskId);
        if (task) {
          setSelectedTask(task);
          setEditData(task);
        }
      } else {
        setSelectedTask(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditData(task);
    const newUrl = `/app/project/${resolvedParams.id}/task/${task.id}`;
    window.history.pushState({}, "", newUrl);
  };

  const handleBackToList = () => {
    setSelectedTask(null);
    const newUrl = `/app/project/${resolvedParams.id}`;
    window.history.pushState({}, "", newUrl);
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

  const currentUserRole = useMemo(() => getUserRole(project, user?.uid), [project, user]);

  const canInvite = useMemo(() => canInviteMembers(currentUserRole), [currentUserRole]);
  const canManageMembersActions = useMemo(
    () => canManageMembers(currentUserRole),
    [currentUserRole]
  );
  const canManageProjectActions = useMemo(
    () => canManageProject(currentUserRole),
    [currentUserRole]
  );
  const canCreateTaskActions = useMemo(() => canCreateTasks(currentUserRole), [currentUserRole]);
  const canEditTaskActions = useMemo(() => canEditTasks(currentUserRole), [currentUserRole]);
  const canDeleteTaskActions = useMemo(() => canDeleteTasks(currentUserRole), [currentUserRole]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const pendingInvites = useMemo(
    () => invitations.filter((invite) => invite.status === "pending"),
    [invitations]
  );

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

  if (authLoading || loading || !projectLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <ProjectTasksHeader
            projectId={resolvedParams.id}
            projectName={project.name}
            selectedTaskTitle={selectedTask?.title}
            totalTasks={tasks.length}
            filteredCount={sortedTasks.length}
            canCreateTaskActions={canCreateTaskActions}
            userId={user?.uid}
            assignees={assignees}
            onTaskCreated={handleTaskCreated}
            onBackToList={handleBackToList}
            onGoKanban={() => router.push(`/app/kanban/${resolvedParams.id}`)}
          >
            <ProjectTasksFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortDirection={sortDirection}
              onSortDirectionChange={setSortDirection}
              statusFilters={statusFilters}
              priorityFilters={priorityFilters}
              assigneeFilters={assigneeFilters}
              tagFilters={tagFilters}
              tags={tags}
              assignees={assignees}
              dueDateFrom={dueDateFrom}
              dueDateTo={dueDateTo}
              filtersOpen={filtersOpen}
              onFiltersOpenChange={setFiltersOpen}
              onToggleFilterValue={toggleFilterValue}
              setStatusFilters={setStatusFilters}
              setPriorityFilters={setPriorityFilters}
              setAssigneeFilters={setAssigneeFilters}
              setTagFilters={setTagFilters}
              onDueDateFromChange={setDueDateFrom}
              onDueDateToChange={setDueDateTo}
              onClearFilters={handleClearFilters}
            />
          </ProjectTasksHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <ProjectTaskList
              filteredTasks={sortedTasks}
              totalTasksCount={tasks.length}
              visibleTaskCount={visibleTaskCount}
              onLoadMore={() =>
                setVisibleTaskCount((prev) =>
                  Math.min(prev + TASKS_PAGE_SIZE, sortedTasks.length)
                )
              }
              canEditTaskActions={canEditTaskActions}
              canDeleteTaskActions={canDeleteTaskActions}
              canPlay={canEditTaskActions}
              isTaskActive={isTaskActive}
              isPaused={isPaused}
              assignees={assignees}
              usersMap={usersMap}
              onTaskClick={handleTaskClick}
              onInlineUpdate={handleInlineUpdate}
              onDeleteTask={handleDeleteTask}
              onPlay={handlePlayTask}
              onPause={pauseTimer}
              onResume={resumeTimer}
              onStop={stopTimer}
            />
          </div>

          <ProjectTaskDrawer
            selectedTask={selectedTask}
            editData={editData}
            setEditData={setEditData}
            canEditTaskActions={canEditTaskActions}
            canDeleteTaskActions={canDeleteTaskActions}
            isEditing={isEditing}
            projectName={project.name}
            assignees={assignees}
            usersMap={usersMap}
            availableTags={tags}
            projectId={resolvedParams.id}
            onTagsUpdated={setTags}
            onBackToList={handleBackToList}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        <div className="w-96 flex flex-col overflow-hidden bg-muted/30">
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-6">
            <ProjectDetailsCard
              project={project}
              taskStats={taskStats}
              canManageProjectActions={canManageProjectActions}
              onProjectUpdated={(updates) =>
                setProject((prev) => (prev ? { ...prev, ...updates } : prev))
              }
            />

            {project.members && project.members.length > 0 ? (
              <ProjectMembersCard
                project={project}
                usersMap={usersMap}
                currentUserRole={currentUserRole}
                currentUser={user}
                canInvite={canInvite}
                canManageMembersActions={canManageMembersActions}
                inviteMode={inviteMode}
                inviteValue={inviteValue}
                inviteRole={inviteRole}
                inviteLoading={inviteLoading}
                inviteError={inviteError}
                pendingInvites={pendingInvites}
                memberActionError={memberActionError}
                memberActionLoadingId={memberActionLoadingId}
                onInviteModeChange={setInviteMode}
                onInviteValueChange={setInviteValue}
                onInviteRoleChange={setInviteRole}
                onSendInvite={handleSendInvite}
                onRevokeInvite={handleRevokeInvite}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
              />
            ) : null}

            <ProjectTaskStatsCard taskStats={taskStats} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTasksPage;
