"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useProjects, useTasks } from '@/hooks';
import { TimeService, type TimeEntry } from '@/services/time.service';
import { ClientService, type Client } from '@/services/client.service';
import { UserService, type UserData } from '@/services/user.service';
import { db } from '@/lib/firebase.config';
import { TimesheetHeader } from './_components/timesheet-header';
import { TimesheetFilters } from './_components/timesheet-filters';
import { TimesheetStats } from './_components/timesheet-stats';
import { TimesheetTable } from './_components/timesheet-table';
import { TimesheetEntryDialog } from './_components/timesheet-entry-dialog';
import { useTimesheetStats } from './_hooks/use-timesheet-stats';
import type { EditFormState } from './_types';
import {
  addWeeks,
  differenceInSeconds,
  endOfWeek,
  format,
  subDays,
  startOfWeek,
} from 'date-fns';

const Timesheet: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState('all');
  const [dateFrom, setDateFrom] = useState(() =>
    format(subDays(new Date(), 6), 'yyyy-MM-dd')
  );
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [clients, setClients] = useState<Client[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('edit');
  const [editForm, setEditForm] = useState<EditFormState>({
    projectId: '',
    taskId: 'none',
    description: '',
    entryType: 'normal',
    tags: '',
    entryDate: '',
    startTime: '',
    endTime: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const projectLookup = useMemo(() => {
    const map = new Map(projects.map((project) => [project.id, project] as const));
    return map;
  }, [projects]);

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects]
  );

  const taskLookup = useMemo(() => {
    const map = new Map(tasks.map((task) => [task.id, task] as const));
    return map;
  }, [tasks]);

  const taskOptions = useMemo(() => {
    const filteredTasks =
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((task) => task.projectId === selectedProjectId);
    return filteredTasks.map((task) => ({ value: task.id, label: task.title }));
  }, [tasks, selectedProjectId]);

  useEffect(() => {
    if (selectedTaskId === 'all') return;
    const exists = tasks.some(
      (task) => task.id === selectedTaskId &&
        (selectedProjectId === 'all' || task.projectId === selectedProjectId)
    );
    if (!exists) {
      setSelectedTaskId('all');
    }
  }, [selectedTaskId, selectedProjectId, tasks]);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const timeService = TimeService.getInstance(db);
      const data = await timeService.getTimerEntries(user.uid);
      setEntries(data);
    } catch (loadError: any) {
      setError(loadError?.message || 'Error loading time entries');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleRefresh = () => {
      void loadEntries();
    };

    window.addEventListener('timesheet:refresh', handleRefresh);
    return () => {
      window.removeEventListener('timesheet:refresh', handleRefresh);
    };
  }, [loadEntries]);

  useEffect(() => {
    if (!entries.length) {
      return;
    }

    const loadUsers = async () => {
      const userIds = Array.from(new Set(entries.map((entry) => entry.userId)));
      const missingIds = userIds.filter((id) => !usersById[id]);

      if (missingIds.length === 0) {
        return;
      }

      try {
        const userService = UserService.getInstance(db);
        const results = await Promise.all(
          missingIds.map(async (id) => ({
            id,
            data: await userService.getUser(id),
          }))
        );

        setUsersById((prev) => {
          const next = { ...prev };
          results.forEach((result) => {
            if (result.data) {
              next[result.id] = result.data;
            }
          });
          return next;
        });
      } catch (loadError) {
        console.error('Error loading users for timesheet:', loadError);
      }
    };

    loadUsers();
  }, [entries, usersById]);

  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }

    const clientService = ClientService.getInstance(db);
    const subscription = clientService.getClientsByOwner(user.uid).subscribe({
      next: (clientList) => setClients(clientList),
      error: (loadError) => {
        console.error('Error loading clients:', loadError);
      },
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const clientOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    clients.forEach((client) => {
      if (!seen.has(client.id)) {
        options.push({ value: client.id, label: client.name });
        seen.add(client.id);
      }
    });

    projects.forEach((project) => {
      if (project.clientName && !project.clientId) {
        const value = `name:${project.clientName}`;
        if (!seen.has(value)) {
          options.push({ value, label: project.clientName });
          seen.add(value);
        }
      }
    });

    return options;
  }, [clients, projects]);

  const userOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const ids = new Set<string>();

    if (user?.uid) {
      ids.add(user.uid);
    }

    entries.forEach((entry) => ids.add(entry.userId));

    ids.forEach((id) => {
      const entryUser = usersById[id];
      const label = entryUser?.displayName || entryUser?.email || id.slice(0, 8);
      options.push({ value: id, label });
    });

    return options;
  }, [entries, usersById, user]);

  const parsedDateFrom = useMemo(() => {
    if (!dateFrom) return null;
    const parsed = new Date(`${dateFrom}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [dateFrom]);

  const parsedDateTo = useMemo(() => {
    if (!dateTo) return null;
    const parsed = new Date(`${dateTo}T23:59:59`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [dateTo]);

  const {
    filteredEntries,
    isEntryBillable,
    totalParts,
    avgDailyParts,
    percentBillable,
    percentChange,
    activeProjectCount,
    activeProjectRatio,
  } = useTimesheetStats({
    entries,
    projects,
    selectedProjectId,
    selectedClientId,
    selectedUserId,
    selectedTaskId,
    dateFrom: parsedDateFrom,
    dateTo: parsedDateTo,
    weekStart,
    weekEnd,
    projectLookup,
  });

  const handlePreviousWeek = () => {
    setWeekStart((current) => startOfWeek(addWeeks(current, -1), { weekStartsOn: 1 }));
  };

  const handleNextWeek = () => {
    setWeekStart((current) => startOfWeek(addWeeks(current, 1), { weekStartsOn: 1 }));
  };

  const openEditDialog = (entry: TimeEntry) => {
    setDialogMode('edit');
    setEditingEntry(entry);
    setEditError(null);
    setEditForm({
      projectId: entry.projectId,
      taskId: entry.taskId || 'none',
      description: entry.description || '',
      entryType: entry.entryType || 'normal',
      tags: entry.tags?.join(', ') || '',
      entryDate: format(entry.startTime, 'yyyy-MM-dd'),
      startTime: format(entry.startTime, 'HH:mm'),
      endTime: entry.endTime ? format(entry.endTime, 'HH:mm') : '',
    });
    setEditOpen(true);
  };

  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!user) {
      setDeleteError('Sign in to delete entries.');
      return;
    }

    if (!entry.endTime) {
      setDeleteError('Stop the timer before deleting this entry.');
      return;
    }

    const confirmed = window.confirm('Delete this time entry? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      const timeService = TimeService.getInstance(db);
      await timeService.deleteTimeEntry(entry.id);
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (deleteErr: any) {
      setDeleteError(deleteErr?.message || 'Error deleting entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingEntry(null);
    setEditError(null);
    const now = new Date();
    setEditForm({
      projectId: selectedProjectId !== 'all' ? selectedProjectId : '',
      taskId: 'none',
      description: '',
      entryType: 'normal',
      tags: '',
      entryDate: format(now, 'yyyy-MM-dd'),
      startTime: format(now, 'HH:mm'),
      endTime: '',
    });
    setEditOpen(true);
  };

  const handleEditChange = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (dialogMode === 'edit' && !editingEntry) return;
    if (!user) {
      setEditError('Sign in to save entries.');
      return;
    }

    setEditError(null);
    if (!editForm.entryDate) {
      setEditError('Date is required.');
      return;
    }

    if (!editForm.startTime) {
      setEditError('Start time is required.');
      return;
    }

    if (!editForm.endTime) {
      setEditError('End time is required.');
      return;
    }

    const startTime = new Date(`${editForm.entryDate}T${editForm.startTime}`);
    const endTime = new Date(`${editForm.entryDate}T${editForm.endTime}`);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setEditError('Invalid date or time.');
      return;
    }

    if (endTime < startTime) {
      setEditError('End time must be after start time.');
      return;
    }

    const now = new Date();
    if (startTime > now || endTime > now) {
      setEditError('Entries must be in the past.');
      return;
    }

    const durationSeconds = Math.max(0, differenceInSeconds(endTime, startTime));
    const tags = editForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      const timeService = TimeService.getInstance(db);
      const payload = {
        userId: user.uid,
        projectId: editForm.projectId,
        taskId: editForm.taskId === 'none' ? null : editForm.taskId,
        description: editForm.description.trim(),
        entryType: editForm.entryType,
        tags,
        startTime,
        endTime,
        duration: durationSeconds,
        isEdited: false,
        originalData: null,
      };

      if (dialogMode === 'edit' && editingEntry) {
        await timeService.editTimeEntry(editingEntry.id, payload);

        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === editingEntry.id
              ? {
                ...entry,
                projectId: editForm.projectId,
                taskId: editForm.taskId === 'none' ? null : editForm.taskId,
                description: editForm.description.trim(),
                entryType: editForm.entryType,
                tags,
                startTime,
                endTime,
                duration: durationSeconds,
                isEdited: true,
              }
              : entry
          )
        );
      } else {
        const newId = await timeService.createManualEntry(payload);
        const newEntry: TimeEntry = {
          id: newId,
          userId: user.uid,
          projectId: editForm.projectId,
          taskId: editForm.taskId === 'none' ? null : editForm.taskId,
          description: editForm.description.trim(),
          entryType: editForm.entryType,
          tags,
          startTime,
          endTime,
          duration: durationSeconds,
          isManual: true,
          isEdited: false,
          originalData: null,
        };
        setEntries((prev) => [newEntry, ...prev]);
      }

      setEditOpen(false);
    } catch (saveError: any) {
      setEditError(saveError?.message || 'Error saving entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const entryTasks = useMemo(() => {
    if (!editForm.projectId) return [];
    return tasks.filter((task) => task.projectId === editForm.projectId);
  }, [editForm.projectId, tasks]);

  useEffect(() => {
    if (!editForm.projectId) {
      return;
    }
    const exists = entryTasks.some((task) => task.id === editForm.taskId);
    if (!exists && editForm.taskId !== 'none') {
      setEditForm((prev) => ({ ...prev, taskId: 'none' }));
    }
  }, [editForm.projectId, editForm.taskId, entryTasks]);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <TimesheetHeader
        onCreateEntry={openCreateDialog}
      />

      <TimesheetFilters
        projectOptions={projectOptions}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        clientOptions={clientOptions}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        userOptions={userOptions}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        taskOptions={taskOptions}
        selectedTaskId={selectedTaskId}
        onTaskChange={setSelectedTaskId}
        onClearFilters={() => {
          setDateFrom(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
          setDateTo(format(new Date(), 'yyyy-MM-dd'));
          setSelectedProjectId('all');
          setSelectedClientId('all');
          setSelectedUserId('all');
          setSelectedTaskId('all');
        }}
      />

      <TimesheetStats
        totalParts={totalParts}
        avgDailyParts={avgDailyParts}
        percentBillable={percentBillable}
        percentChange={percentChange}
        activeProjectCount={activeProjectCount}
        projectsLength={projects.length}
        activeProjectRatio={activeProjectRatio}
      />

      <TimesheetTable
        user={user}
        loading={loading}
        error={error}
        entries={filteredEntries}
        projectLookup={projectLookup}
        taskLookup={taskLookup}
        usersById={usersById}
        onEditEntry={openEditDialog}
        onDeleteEntry={handleDeleteEntry}
        isEntryBillable={isEntryBillable}
      />

      {deleteError && (
        <p className="text-sm text-destructive">{deleteError}</p>
      )}

      <TimesheetEntryDialog
        open={editOpen}
        dialogMode={dialogMode}
        editForm={editForm}
        editError={editError}
        isSaving={isSaving || isDeleting}
        projects={projects}
        entryTasks={entryTasks}
        onOpenChange={setEditOpen}
        onChange={handleEditChange}
        onSave={handleSaveEdit}
        onCancel={() => setEditOpen(false)}
      />
    </div>
  );
};

export default Timesheet;
