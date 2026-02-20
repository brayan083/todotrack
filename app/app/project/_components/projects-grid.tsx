import { Archive, Clock, DollarSign, User2 } from "lucide-react";
import type { Project } from "@/services/project.service";
import type { UserData } from "@/services/user.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ProjectsGridProps = {
  projects: Project[];
  usersMap: Record<string, UserData>;
  onProjectClick: (projectId: string) => void;
  isSharedProject: (project: Project) => boolean;
};

export const ProjectsGrid = ({
  projects,
  usersMap,
  onProjectClick,
  isSharedProject,
}: ProjectsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const sharedProject = isSharedProject(project);
        return (
          <Card
            key={project.id}
            className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50 ${sharedProject ? "bg-amber-50/40 border-amber-200/60" : ""}`}
            onClick={() => onProjectClick(project.id)}
          >
            <div
              className="h-2 w-full"
              style={{
                backgroundColor: sharedProject ? "#f59e0b" : project.color || "#3b82f6",
              }}
            />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate group-hover:text-primary transition-colors text-lg">
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
                {sharedProject && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 border-amber-500/20"
                  >
                    Shared
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {project.clientName && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                    <User2 className="h-3.5 w-3.5" />
                    <span className="font-medium">{project.clientName}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {project.budget !== null && project.budget !== undefined && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md px-2 py-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="font-semibold">${project.budget.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {project.hourlyRate !== null && project.hourlyRate !== undefined && (
                  <div className="flex items-center gap-1 text-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md px-2 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-semibold">${project.hourlyRate}/h</span>
                  </div>
                )}
              </div>

              {project.estimatedTime && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Est: {project.estimatedTime}</span>
                </div>
              )}

              {project.members && project.members.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 4).map((memberId, idx) => {
                      const memberData = usersMap[memberId];
                      return (
                        <Avatar
                          key={idx}
                          className="w-7 h-7 border-2 border-background"
                          title={
                            memberData?.displayName || memberData?.email || "Unknown"
                          }
                        >
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {memberData?.displayName?.[0]?.toUpperCase() ||
                              memberData?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                  {project.members.length > 4 && (
                    <span className="text-xs text-muted-foreground font-medium">
                      +{project.members.length - 4} more
                    </span>
                  )}
                  {project.isArchived && (
                    <Badge variant="outline" className="gap-1 ml-auto">
                      <Archive className="h-3 w-3" />
                      Archived
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
