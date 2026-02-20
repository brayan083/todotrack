import { format } from "date-fns";
import type { User } from "firebase/auth";
import type { Project } from "@/services/project.service";
import type { Task } from "@/services/task.service";
import type { TimeEntry } from "@/services/time.service";
import type { UserData } from "@/services/user.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { formatDurationClock, getEntryDurationSeconds } from "../_utils/time-utils";

type TimesheetTableProps = {
  user: User | null;
  loading: boolean;
  error: string | null;
  entries: TimeEntry[];
  projectLookup: Map<string, Project>;
  taskLookup: Map<string, Task>;
  usersById: Record<string, UserData>;
  onEditEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (entry: TimeEntry) => void;
  isEntryBillable: (entry: TimeEntry) => boolean;
};

export const TimesheetTable = ({
  user,
  loading,
  error,
  entries,
  projectLookup,
  taskLookup,
  usersById,
  onEditEntry,
  onDeleteEntry,
  isEntryBillable,
}: TimesheetTableProps) => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32">Date</TableHead>
            <TableHead className="w-48">User</TableHead>
            <TableHead className="w-48">Project</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead className="w-32 text-right">Duration</TableHead>
            <TableHead className="w-28 text-center">Action</TableHead>
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
          {user && !loading && !error && entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No entries for this range.
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry) => {
            const project = projectLookup.get(entry.projectId);
            const task = entry.taskId ? taskLookup.get(entry.taskId) : null;
            const entryUser = usersById[entry.userId];
            const entryUserLabel =
              entryUser?.displayName || entryUser?.email || entry.userId.slice(0, 8);
            const durationSeconds = getEntryDurationSeconds(entry);
            const isBillable = isEntryBillable(entry);

            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {format(entry.startTime, "MMM d, EEE")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entryUser?.photoURL && (
                    <img
                      src={entryUser.photoURL}
                      alt={entryUserLabel}
                      className="w-6 h-6 rounded-full mr-2 inline-block align-middle"
                    />
                  )}
                  {entryUserLabel}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project?.color || "#94a3b8" }}
                    ></div>
                    {project?.name || "Unknown project"}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {task?.title || entry.description || "Untitled entry"}
                  </span>
                  {isBillable && (
                    <Badge variant="outline" className="ml-2 text-xs font-normal">
                      Billable
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatDurationClock(durationSeconds)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEditEntry(entry)}
                  >
                    <span className="sr-only">Edit</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onDeleteEntry(entry)}
                  >
                    <span className="sr-only">Delete</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
