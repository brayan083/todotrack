import { Draggable } from "@hello-pangea/dnd";
import { Edit, Pause, Play, Square } from "lucide-react";
import type { Task } from "@/services/task.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KANBAN_PRIORITY_STYLES } from "@/lib/task-constants";

type AssigneeInfo = {
  id: string;
  displayName: string;
  photoURL?: string | null;
};

type KanbanTaskCardProps = {
  task: Task;
  index: number;
  assignees: AssigneeInfo[];
  canEdit: boolean;
  canPlay: boolean;
  isActive: boolean;
  isPaused: boolean;
  onPlay: (task: Task) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEdit: (taskId: string) => void;
};

export const KanbanTaskCard = ({
  task,
  index,
  assignees,
  canEdit,
  canPlay,
  isActive,
  isPaused,
  onPlay,
  onPause,
  onResume,
  onStop,
  onEdit,
}: KanbanTaskCardProps) => {
  const priorityClass = task.priority
    ? KANBAN_PRIORITY_STYLES[task.priority]
    : KANBAN_PRIORITY_STYLES.medium;

  return (
    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <Card
            className={`group ${
              canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            } hover:shadow-md transition-all ${snapshot.isDragging ? "shadow-lg rotate-2" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className={priorityClass}>
                  {task.priority || "medium"}
                </Badge>
                <div className="flex items-center gap-1">
                  {canPlay && !isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(event) => {
                        event.stopPropagation();
                        onPlay(task);
                      }}
                      aria-label="Start task timer"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {canPlay && isActive && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isPaused) {
                            onResume();
                          } else {
                            onPause();
                          }
                        }}
                        aria-label={isPaused ? "Resume task timer" : "Pause task timer"}
                      >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStop();
                        }}
                        aria-label="Stop task timer"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(task.id);
                      }}
                      aria-label="Edit task"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-medium mb-3 leading-snug">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  {assignees.length > 0 ? (
                    <>
                      <div className="flex -space-x-2">
                        {assignees.slice(0, 2).map((assignee) => (
                          <Avatar key={assignee.id} className="w-6 h-6 border-2 border-background">
                            {assignee.photoURL && <AvatarImage src={assignee.photoURL} />}
                            <AvatarFallback className="text-[10px]">
                              {assignee.displayName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {assignees.length > 2 && (
                          <div className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                            +{assignees.length - 2}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {assignees.slice(0, 2).map((assignee) => assignee.displayName).join(", ")}
                        {assignees.length > 2 ? ` +${assignees.length - 2}` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                        UN
                      </div>
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
