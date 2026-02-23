import { useEffect, useMemo, useState } from 'react';
import {
  differenceInCalendarDays,
  differenceInSeconds,
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { useAuth, useProjects, useTasks, useTimer, useWorkspace } from '@/hooks';
import { type Project, TimeEntry, TimeService } from '@/services';
import { db } from '@/lib/firebase.config';
import {
  WEEK_STARTS_ON,
  WEEKLY_GOAL_HOURS,
} from '../_utils/dashboard-utils';

export type ProductivityPoint = { name: string; value: number };
export type ProjectSummary = {
  project: Project;
  totalSeconds: number;
  estimatedSeconds: number | null;
  progress: number;
};
export type RecentEntry = TimeEntry & { duration: number };

export const useDashboardData = () => {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const { projects, loading: projectsLoading } = useProjects();
  const { getTaskById, loading: tasksLoading } = useTasks();
  const { activeEntry, elapsedSeconds } = useTimer();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const effectiveTimeEntries = useMemo(
    () => (user && workspaceId ? timeEntries : []),
    [user, workspaceId, timeEntries]
  );
  const effectiveLoadingEntries = useMemo(
    () => (user && workspaceId ? loadingEntries : false),
    [user, workspaceId, loadingEntries]
  );
  const isLoading = effectiveLoadingEntries || projectsLoading || tasksLoading;

  useEffect(() => {
    if (!user || !workspaceId) {
      return;
    }

    let isMounted = true;
    queueMicrotask(() => setLoadingEntries(true));
    const service = TimeService.getInstance(db);
    service
      .getTimerEntries(user.uid, workspaceId)
      .then((entries) => {
        if (isMounted) {
          setTimeEntries(entries);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingEntries(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, workspaceId]);

  const mergedEntries = useMemo(() => {
    const byId = new Map<string, TimeEntry>();
    effectiveTimeEntries.forEach((entry) => byId.set(entry.id, entry));
    if (activeEntry) {
      byId.set(activeEntry.id, { ...activeEntry, duration: elapsedSeconds });
    }
    return Array.from(byId.values());
  }, [effectiveTimeEntries, activeEntry, elapsedSeconds]);

  const entriesWithDuration = useMemo(() => {
    return mergedEntries.map((entry) => {
      if (activeEntry && entry.id === activeEntry.id) {
        return { ...entry, duration: elapsedSeconds };
      }
      if (typeof entry.duration === 'number' && entry.duration > 0) {
        return entry as RecentEntry;
      }
      if (entry.endTime) {
        return {
          ...entry,
          duration: Math.max(0, differenceInSeconds(entry.endTime, entry.startTime)),
        } as RecentEntry;
      }
      return { ...entry, duration: 0 } as RecentEntry;
    });
  }, [mergedEntries, activeEntry, elapsedSeconds]);

  const now = useMemo(() => new Date(), []);
  const todayRange = useMemo(() => {
    const start = startOfDay(now);
    return { start, end: endOfDay(now) };
  }, [now]);
  const weekRange = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
    return { start, end: endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }) };
  }, [now]);

  const { todaySeconds, yesterdaySeconds, weeklySeconds } = useMemo(() => {
    const todaySeconds = entriesWithDuration
      .filter((entry) => isWithinInterval(entry.startTime, todayRange))
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const yesterdayStart = startOfDay(new Date(todayRange.start.getTime() - 24 * 60 * 60 * 1000));
    const yesterdayEnd = endOfDay(yesterdayStart);
    const yesterdaySeconds = entriesWithDuration
      .filter((entry) => isWithinInterval(entry.startTime, { start: yesterdayStart, end: yesterdayEnd }))
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const weeklySeconds = entriesWithDuration
      .filter((entry) => isWithinInterval(entry.startTime, weekRange))
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return { todaySeconds, yesterdaySeconds, weeklySeconds };
  }, [entriesWithDuration, todayRange, weekRange]);

  const todayDeltaPercent = useMemo(() => {
    if (yesterdaySeconds <= 0) {
      return 0;
    }
    return Math.round(((todaySeconds - yesterdaySeconds) / yesterdaySeconds) * 100);
  }, [todaySeconds, yesterdaySeconds]);

  const productivityData = useMemo(() => {
    const totals = Array.from({ length: 7 }).map(() => 0);
    entriesWithDuration.forEach((entry) => {
      if (!isWithinInterval(entry.startTime, weekRange)) {
        return;
      }
      const dayIndex = differenceInCalendarDays(startOfDay(entry.startTime), weekRange.start);
      if (dayIndex < 0 || dayIndex > 6) {
        return;
      }
      totals[dayIndex] += entry.duration || 0;
    });

    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return labels.map((label, index) => ({
      name: label,
      value: Math.round((totals[index] / 3600) * 10) / 10,
    }));
  }, [entriesWithDuration, weekRange]);

  const maxProductivity = useMemo(() => {
    return productivityData.reduce((max, item) => Math.max(max, item.value), 0);
  }, [productivityData]);

  const projectSummaries: ProjectSummary[] = useMemo(() => {
    const totalsByProject = new Map<string, number>();
    entriesWithDuration.forEach((entry) => {
      totalsByProject.set(
        entry.projectId,
        (totalsByProject.get(entry.projectId) || 0) + (entry.duration || 0)
      );
    });

    return projects
      .filter((project) => !project.isArchived)
      .map((project) => {
        const totalSeconds = totalsByProject.get(project.id) || 0;
        const estimatedSeconds = null;
        const progress = 100;

        return {
          project,
          totalSeconds,
          estimatedSeconds,
          progress,
        };
      })
      .slice(0, 5);
  }, [entriesWithDuration, projects]);

  const recentEntries: RecentEntry[] = useMemo(() => {
    return entriesWithDuration
      .filter((entry) => entry.duration && entry.duration > 0)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 5);
  }, [entriesWithDuration]);

  const greetingName = user?.displayName || user?.email || 'Usuario';
  const weeklyHours = Math.round((weeklySeconds / 3600) * 10) / 10;
  const weeklyRemaining = Math.max(0, WEEKLY_GOAL_HOURS - weeklyHours);
  const weeklyProgress = Math.min(100, Math.round((weeklyHours / WEEKLY_GOAL_HOURS) * 100));

  return {
    greetingName,
    isLoading,
    todaySeconds,
    todayDeltaPercent,
    weeklyProgress,
    weeklyHours,
    weeklyRemaining,
    productivityData,
    maxProductivity,
    projectSummaries,
    recentEntries,
    projects,
    getTaskById,
  };
};
