import { Clock, DollarSign, User2 } from "lucide-react";
import type { Project } from "@/services/project.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectEditDialog } from "./project-edit-dialog";

type TaskStats = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
};

type ProjectDetailsCardProps = {
  project: Project;
  taskStats: TaskStats;
  canManageProjectActions: boolean;
  onProjectUpdated: (updates: Partial<Project>) => void;
};

export const ProjectDetailsCard = ({
  project,
  taskStats,
  canManageProjectActions,
  onProjectUpdated,
}: ProjectDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Project Details</CardTitle>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-6">
              {taskStats.total} {taskStats.total === 1 ? "task" : "tasks"}
            </Badge>
            {canManageProjectActions ? (
              <ProjectEditDialog project={project} onProjectUpdated={onProjectUpdated} />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-sm">{project.description}</p>
          </div>
        )}

        <Separator />

        {project.clientName && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Client</h3>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{project.clientName}</span>
            </div>
          </div>
        )}

        {(project.budget !== null || project.hourlyRate !== null) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Financial</h3>
            <div className="grid grid-cols-2 gap-2">
              {project.budget !== null && (
                <div className="bg-green-500/10 rounded-md px-3 py-2">
                  <div className="flex items-center gap-1 text-green-700 dark:text-green-400 mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Budget</span>
                  </div>
                  <span className="text-sm font-bold">${project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.hourlyRate !== null && (
                <div className="bg-blue-500/10 rounded-md px-3 py-2">
                  <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400 mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Rate</span>
                  </div>
                  <span className="text-sm font-bold">${project.hourlyRate}/h</span>
                </div>
              )}
            </div>
          </div>
        )}

        {project.estimatedTime && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Estimated Time</h3>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.estimatedTime}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
