import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = {
  value: string;
  label: string;
};

type TimesheetFiltersProps = {
  projectOptions: FilterOption[];
  selectedProjectId: string;
  onProjectChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  userOptions: FilterOption[];
  selectedUserId: string;
  onUserChange: (value: string) => void;
  taskOptions: FilterOption[];
  selectedTaskId: string;
  onTaskChange: (value: string) => void;
  onClearFilters: () => void;
};

export const TimesheetFilters = ({
  projectOptions,
  selectedProjectId,
  onProjectChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  userOptions,
  selectedUserId,
  onUserChange,
  taskOptions,
  selectedTaskId,
  onTaskChange,
  onClearFilters,
}: TimesheetFiltersProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="grid gap-2">
          <Label>Project</Label>
          <Select value={selectedProjectId} onValueChange={onProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timesheet-date-from">Date from</Label>
          <Input
            id="timesheet-date-from"
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timesheet-date-to">Date to</Label>
          <Input
            id="timesheet-date-to"
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Assigned user</Label>
          <Select value={selectedUserId} onValueChange={onUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {userOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Task</Label>
          <Select value={selectedTaskId} onValueChange={onTaskChange}>
            <SelectTrigger>
              <SelectValue placeholder="All tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              {taskOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    </div>
  );
};
