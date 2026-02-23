export const STATUS_LABELS: Record<string, string> = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "completed": "Completed",
};

export const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;
export const PRIORITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export const UNASSIGNED_FILTER_VALUE = "unassigned";

export const KANBAN_PRIORITY_STYLES: Record<string, string> = {
  low: "text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
  urgent: "text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
};

export const PROJECT_PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const PROJECT_STATUS_STYLES: Record<string, string> = {
  "todo": "bg-slate-100 text-slate-700",
  "in-progress": "bg-orange-100 text-orange-700",
  "completed": "bg-green-100 text-green-700",
};

export const PROJECT_STATUS_ACCENTS: Record<string, string> = {
  "todo": "bg-slate-300",
  "in-progress": "bg-orange-400",
  "completed": "bg-green-500",
};
