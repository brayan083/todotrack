export const WEEKLY_GOAL_HOURS = 40;
export const WEEK_STARTS_ON = 1;

export const formatDurationShort = (seconds: number) => {
  const totalMinutes = Math.round(Math.max(0, seconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

export const formatHoursOnly = (seconds: number) => {
  const hours = Math.round((Math.max(0, seconds) / 3600) * 10) / 10;
  return `${hours}h`;
};

export const parseEstimatedHours = (estimatedTime?: string) => {
  if (!estimatedTime) {
    return null;
  }
  const match = estimatedTime.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};
