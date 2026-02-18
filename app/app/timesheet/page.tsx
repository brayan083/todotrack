"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Coffee,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useProjects, useTasks } from '@/hooks';
import { TimeService, type TimeEntry } from '@/services/time.service';
import { UserService, type UserData } from '@/services/user.service';
import { db } from '@/lib/firebase.config';
import {
  addWeeks,
  differenceInCalendarDays,
  differenceInSeconds,
  endOfDay,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from 'date-fns';

type EditFormState = {
  projectId: string;
  taskId: string;
  description: string;
  entryType: string;
  tags: string;
  startTime: string;
  endTime: string;
};

const getDurationParts = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return { hours, minutes, seconds: secs };
};

const formatDurationLabel = (seconds: number) => {
  const parts = getDurationParts(seconds);
  return `${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
};

const formatDurationClock = (seconds: number) => {
  const parts = getDurationParts(seconds);
  return `${parts.hours.toString().padStart(2, '0')}:${parts.minutes
    .toString()
    .padStart(2, '0')}:${parts.seconds.toString().padStart(2, '0')}`;
};

const toDateTimeLocalValue = (value?: Date) => {
  if (!value) return '';
  return format(value, "yyyy-MM-dd'T'HH:mm");
};

const Timesheet: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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
    startTime: '',
    endTime: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const projectLookup = useMemo(() => {
    const map = new Map(projects.map((project) => [project.id, project] as const));
    return map;
  }, [projects]);

  const taskLookup = useMemo(() => {
    const map = new Map(tasks.map((task) => [task.id, task] as const));
    return map;
  }, [tasks]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const loadEntries = async () => {
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
    };

    loadEntries();
  }, [user]);

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

  const filteredEntries = useMemo(() => {
    const range = {
      start: startOfDay(weekStart),
      end: endOfDay(weekEnd),
    };

    return entries
      .filter((entry) =>
        selectedProjectId === 'all' ? true : entry.projectId === selectedProjectId
      )
      .filter((entry) => isWithinInterval(entry.startTime, range))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [entries, selectedProjectId, weekStart, weekEnd]);

  const previousWeekTotals = useMemo(() => {
    const prevStart = startOfWeek(addWeeks(weekStart, -1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(prevStart, { weekStartsOn: 1 });
    const range = { start: startOfDay(prevStart), end: endOfDay(prevEnd) };

    return entries
      .filter((entry) => isWithinInterval(entry.startTime, range))
      .reduce((total, entry) => total + getEntryDurationSeconds(entry), 0);
  }, [entries, weekStart]);

  const isEntryBillable = (entry: TimeEntry) => {
    if (entry.tags?.includes('non-billable') || entry.entryType === 'non-billable') {
      return false;
    }
    if (!entry.taskId) {
      return false;
    }
    const project = projectLookup.get(entry.projectId);
    return Boolean(project?.clientId || project?.clientName || project?.hourlyRate);
  };

  const totalSeconds = filteredEntries.reduce((total, entry) => total + getEntryDurationSeconds(entry), 0);
  const billableSeconds = filteredEntries.reduce(
    (total, entry) => total + (isEntryBillable(entry) ? getEntryDurationSeconds(entry) : 0),
    0
  );
  const nonBillableSeconds = Math.max(0, totalSeconds - billableSeconds);

  const dayCount = Math.max(1, differenceInCalendarDays(weekEnd, weekStart) + 1);
  const avgDailySeconds = Math.round(totalSeconds / dayCount);
  const percentBillable = totalSeconds > 0 ? (billableSeconds / totalSeconds) * 100 : 0;
  const activeProjectCount = new Set(filteredEntries.map((entry) => entry.projectId)).size;
  const activeProjectRatio = projects.length > 0 ? (activeProjectCount / projects.length) * 100 : 0;

  const totalLabel = formatDurationLabel(totalSeconds);
  const billableLabel = formatDurationLabel(billableSeconds);
  const nonBillableLabel = formatDurationLabel(nonBillableSeconds);

  const totalParts = getDurationParts(totalSeconds);
  const billableParts = getDurationParts(billableSeconds);
  const nonBillableParts = getDurationParts(nonBillableSeconds);
  const avgDailyParts = getDurationParts(avgDailySeconds);

  const billableRatio = totalSeconds > 0 ? (billableSeconds / totalSeconds) * 100 : 0;
  const nonBillableRatio = totalSeconds > 0 ? (nonBillableSeconds / totalSeconds) * 100 : 0;
  const percentChange = previousWeekTotals > 0
    ? ((totalSeconds - previousWeekTotals) / previousWeekTotals) * 100
    : null;

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
      startTime: toDateTimeLocalValue(entry.startTime),
      endTime: toDateTimeLocalValue(entry.endTime),
    });
    setEditOpen(true);
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
      startTime: toDateTimeLocalValue(now),
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
    const startTime = editForm.startTime ? new Date(editForm.startTime) : null;
    const endTime = editForm.endTime ? new Date(editForm.endTime) : null;

    if (!startTime) {
      setEditError('Start time is required.');
      return;
    }

    if (endTime && endTime < startTime) {
      setEditError('End time must be after start time.');
      return;
    }

    const durationSeconds = endTime ? Math.max(0, differenceInSeconds(endTime, startTime)) : 0;
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
        endTime: endTime || undefined,
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
                endTime: endTime || undefined,
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
          endTime: endTime || undefined,
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Timesheet History</h1>
          <p className="text-muted-foreground text-sm">Review your tracked hours and manage entries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center bg-card border border-input rounded-md p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button className="hidden md:flex gap-2" onClick={openCreateDialog}>
            <span>New Entry</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between relative overflow-hidden group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Hours</p>
            <h3 className="text-3xl font-bold">
              {totalParts.hours}
              <span className="text-lg text-muted-foreground font-normal">h</span>{' '}
              {totalParts.minutes}
              <span className="text-lg text-muted-foreground font-normal">m</span>
              {' '}
              {totalParts.seconds}
              <span className="text-lg text-muted-foreground font-normal">s</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {percentChange === null ? (
                'No data last week'
              ) : (
                <>
                  <TrendingUp className="h-3 w-3" />
                  {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}% vs last week
                </>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Daily Average</p>
            <h3 className="text-3xl font-bold">
              {avgDailyParts.hours}
              <span className="text-lg text-muted-foreground font-normal">h</span>{' '}
              {avgDailyParts.minutes}
              <span className="text-lg text-muted-foreground font-normal">m</span>
              {' '}
              {avgDailyParts.seconds}
              <span className="text-lg text-muted-foreground font-normal">s</span>
            </h3>
            <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${percentBillable}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {percentBillable.toFixed(1)}% billable
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Active Projects</p>
            <h3 className="text-3xl font-bold">
              {activeProjectCount}
              <span className="text-lg text-muted-foreground font-normal"> / {projects.length}</span>
            </h3>
            <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${activeProjectRatio}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In this range
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Coffee className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32">Date</TableHead>
              <TableHead className="w-48">User</TableHead>
              <TableHead className="w-48">Project</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-32 text-right">Duration</TableHead>
              <TableHead className="w-24 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!user && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sign in to view timesheets.
                </TableCell>
              </TableRow>
            )}
            {user && !loading && error && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {user && loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading entries...
                </TableCell>
              </TableRow>
            )}
            {user && !loading && !error && filteredEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No entries for this range.
                </TableCell>
              </TableRow>
            )}
            {filteredEntries.map((entry) => {
              const project = projectLookup.get(entry.projectId);
              const task = entry.taskId ? taskLookup.get(entry.taskId) : null;
              const entryUser = usersById[entry.userId];
              const entryUserLabel = entryUser?.displayName || entryUser?.email || entry.userId.slice(0, 8);
              const durationSeconds = getEntryDurationSeconds(entry);
              const isBillable = isEntryBillable(entry);

              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {format(entry.startTime, 'MMM d, EEE')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entryUser?.photoURL && (
                      <img src={entryUser.photoURL} alt={entryUserLabel} className="w-6 h-6 rounded-full mr-2 inline-block align-middle" />
                    )}
                    {entryUserLabel}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project?.color || '#94a3b8' }}
                      ></div>
                      {project?.name || 'Unknown project'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {task?.title || entry.description || 'Untitled entry'}
                    </span>
                    {isBillable && (
                      <Badge variant="outline" className="ml-2 text-xs font-normal">Billable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatDurationClock(durationSeconds)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(entry)}
                    >
                      <span className="sr-only">Edit</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'edit' ? 'Edit entry' : 'New entry'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project">Project</Label>
              <Select value={editForm.projectId} onValueChange={(value) => handleEditChange('projectId', value)}>
                <SelectTrigger id="edit-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-task">Task</Label>
              <Select
                value={editForm.taskId}
                onValueChange={(value) => handleEditChange('taskId', value)}
                disabled={!editForm.projectId}
              >
                <SelectTrigger id="edit-task">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {entryTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) => handleEditChange('description', event.target.value)}
                placeholder="Describe the work"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-entry-type">Entry type</Label>
              <Select value={editForm.entryType} onValueChange={(value) => handleEditChange('entryType', value)}>
                <SelectTrigger id="edit-entry-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                  <SelectItem value="non-billable">Non-billable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(event) => handleEditChange('tags', event.target.value)}
                placeholder="frontend, meeting, review"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-start">Start time</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={editForm.startTime}
                onChange={(event) => handleEditChange('startTime', event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-end">End time</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={editForm.endTime}
                onChange={(event) => handleEditChange('endTime', event.target.value)}
              />
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editForm.projectId}>
              {isSaving ? 'Saving...' : dialogMode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const getEntryDurationSeconds = (entry: TimeEntry) => {
  if (entry.duration && entry.duration > 0) {
    return entry.duration;
  }
  if (entry.endTime) {
    return Math.max(0, differenceInSeconds(entry.endTime, entry.startTime));
  }
  return 0;
};

export default Timesheet;
