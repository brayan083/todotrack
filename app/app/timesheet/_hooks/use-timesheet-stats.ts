"use client";

import { useMemo } from "react";
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { Project } from "@/services/project.service";
import type { TimeEntry } from "@/services/time.service";
import { getDurationParts, getEntryDurationSeconds } from "../_utils/time-utils";

type UseTimesheetStatsArgs = {
  entries: TimeEntry[];
  projects: Project[];
  selectedProjectId: string;
  selectedClientId: string;
  selectedUserId: string;
  selectedTaskId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  weekStart: Date;
  weekEnd: Date;
  projectLookup: Map<string, Project>;
};

export const useTimesheetStats = ({
  entries,
  projects,
  selectedProjectId,
  selectedClientId,
  selectedUserId,
  selectedTaskId,
  dateFrom,
  dateTo,
  weekStart,
  weekEnd,
  projectLookup,
}: UseTimesheetStatsArgs) => {
  const filteredEntries = useMemo(() => {
    const rangeStart = dateFrom ? startOfDay(dateFrom) : startOfDay(weekStart);
    const rangeEnd = dateTo ? endOfDay(dateTo) : endOfDay(weekEnd);
    const range = {
      start: rangeStart,
      end: rangeEnd,
    };
    const normalizedClientName = selectedClientId.startsWith("name:")
      ? selectedClientId.replace("name:", "")
      : "";

    const matchesFilters = (entry: TimeEntry) => {
      if (selectedProjectId !== "all" && entry.projectId !== selectedProjectId) {
        return false;
      }
      if (selectedUserId !== "all" && entry.userId !== selectedUserId) {
        return false;
      }
      if (selectedTaskId !== "all") {
        if (!entry.taskId || entry.taskId !== selectedTaskId) {
          return false;
        }
      }
      if (selectedClientId !== "all") {
        const project = projectLookup.get(entry.projectId);
        if (!project) {
          return false;
        }
        if (normalizedClientName) {
          if (project.clientName !== normalizedClientName) {
            return false;
          }
        } else if (project.clientId !== selectedClientId) {
          return false;
        }
      }
      return isWithinInterval(entry.startTime, range);
    };

    return entries
      .filter(matchesFilters)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [entries, selectedProjectId, selectedClientId, selectedUserId, selectedTaskId, dateFrom, dateTo, weekStart, weekEnd, projectLookup]);

  const previousPeriodTotals = useMemo(() => {
    const currentStart = dateFrom ? startOfDay(dateFrom) : startOfDay(weekStart);
    const currentEnd = dateTo ? endOfDay(dateTo) : endOfDay(weekEnd);
    const rangeLength = Math.max(1, differenceInCalendarDays(currentEnd, currentStart) + 1);
    const prevStart = addDays(currentStart, -rangeLength);
    const prevEnd = addDays(currentEnd, -rangeLength);
    const range = { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
    const normalizedClientName = selectedClientId.startsWith("name:")
      ? selectedClientId.replace("name:", "")
      : "";

    return entries
      .filter((entry) => {
        if (selectedProjectId !== "all" && entry.projectId !== selectedProjectId) {
          return false;
        }
        if (selectedUserId !== "all" && entry.userId !== selectedUserId) {
          return false;
        }
        if (selectedTaskId !== "all") {
          if (!entry.taskId || entry.taskId !== selectedTaskId) {
            return false;
          }
        }
        if (selectedClientId !== "all") {
          const project = projectLookup.get(entry.projectId);
          if (!project) {
            return false;
          }
          if (normalizedClientName) {
            if (project.clientName !== normalizedClientName) {
              return false;
            }
          } else if (project.clientId !== selectedClientId) {
            return false;
          }
        }
        return isWithinInterval(entry.startTime, range);
      })
      .reduce((total, entry) => total + getEntryDurationSeconds(entry), 0);
  }, [entries, selectedProjectId, selectedClientId, selectedUserId, selectedTaskId, dateFrom, dateTo, weekStart, weekEnd, projectLookup]);

  const isEntryBillable = (entry: TimeEntry) => {
    if (entry.tags?.includes("non-billable") || entry.entryType === "non-billable") {
      return false;
    }
    if (!entry.taskId) {
      return false;
    }
    const project = projectLookup.get(entry.projectId);
    return Boolean(project?.clientId || project?.clientName || project?.hourlyRate);
  };

  const totalSeconds = filteredEntries.reduce(
    (total, entry) => total + getEntryDurationSeconds(entry),
    0
  );
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

  const totalParts = getDurationParts(totalSeconds);
  const billableParts = getDurationParts(billableSeconds);
  const nonBillableParts = getDurationParts(nonBillableSeconds);
  const avgDailyParts = getDurationParts(avgDailySeconds);

  const billableRatio = totalSeconds > 0 ? (billableSeconds / totalSeconds) * 100 : 0;
  const nonBillableRatio = totalSeconds > 0 ? (nonBillableSeconds / totalSeconds) * 100 : 0;
  const percentChange =
    previousPeriodTotals > 0
      ? ((totalSeconds - previousPeriodTotals) / previousPeriodTotals) * 100
      : null;

  return {
    filteredEntries,
    isEntryBillable,
    totalSeconds,
    billableSeconds,
    nonBillableSeconds,
    avgDailySeconds,
    percentBillable,
    activeProjectCount,
    activeProjectRatio,
    totalParts,
    billableParts,
    nonBillableParts,
    avgDailyParts,
    billableRatio,
    nonBillableRatio,
    percentChange,
  };
};
