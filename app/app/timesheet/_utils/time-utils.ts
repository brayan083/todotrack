import { differenceInSeconds, format } from "date-fns";
import type { TimeEntry } from "@/services/time.service";

export const getDurationParts = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return { hours, minutes, seconds: secs };
};

export const formatDurationLabel = (seconds: number) => {
  const parts = getDurationParts(seconds);
  return `${parts.hours}h ${parts.minutes}m ${parts.seconds}s`;
};

export const formatDurationClock = (seconds: number) => {
  const parts = getDurationParts(seconds);
  return `${parts.hours.toString().padStart(2, "0")}:${parts.minutes
    .toString()
    .padStart(2, "0")}:${parts.seconds.toString().padStart(2, "0")}`;
};

export const toDateTimeLocalValue = (value?: Date) => {
  if (!value) return "";
  return format(value, "yyyy-MM-dd'T'HH:mm");
};

export const getEntryDurationSeconds = (entry: TimeEntry) => {
  if (entry.duration && entry.duration > 0) {
    return entry.duration;
  }
  if (entry.endTime) {
    return Math.max(0, differenceInSeconds(entry.endTime, entry.startTime));
  }
  return 0;
};
