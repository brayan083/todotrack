import type { Project } from "@/services/project.service";
import type { Task } from "@/services/task.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EditFormState } from "../_types";

type TimesheetEntryDialogProps = {
  open: boolean;
  dialogMode: "create" | "edit";
  editForm: EditFormState;
  editError: string | null;
  isSaving: boolean;
  projects: Project[];
  entryTasks: Task[];
  onOpenChange: (open: boolean) => void;
  onChange: (field: keyof EditFormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const TimesheetEntryDialog = ({
  open,
  dialogMode,
  editForm,
  editError,
  isSaving,
  projects,
  entryTasks,
  onOpenChange,
  onChange,
  onSave,
  onCancel,
}: TimesheetEntryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogMode === "edit" ? "Edit entry" : "New entry"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-project">Project</Label>
            <Select value={editForm.projectId} onValueChange={(value) => onChange("projectId", value)}>
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
              onValueChange={(value) => onChange("taskId", value)}
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
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Describe the work"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-entry-type">Entry type</Label>
            <Select value={editForm.entryType} onValueChange={(value) => onChange("entryType", value)}>
              <SelectTrigger id="edit-entry-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="pomodoro">Pomodoro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={editForm.tags}
              onChange={(event) => onChange("tags", event.target.value)}
              placeholder="frontend, meeting, review"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={editForm.entryDate}
              onChange={(event) => onChange("entryDate", event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-start">Start time</Label>
            <Input
              id="edit-start"
              type="time"
              value={editForm.startTime}
              onChange={(event) => onChange("startTime", event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-end">End time</Label>
            <Input
              id="edit-end"
              type="time"
              value={editForm.endTime}
              onChange={(event) => onChange("endTime", event.target.value)}
            />
          </div>

          {editError && <p className="text-sm text-destructive">{editError}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || !editForm.projectId}>
            {isSaving ? "Saving..." : dialogMode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
