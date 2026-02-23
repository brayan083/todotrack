import { Archive } from "lucide-react";
import type { Project } from "@/services/project.service";
import type { UserData } from "@/services/user.service";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectsTableProps = {
  projects: Project[];
  usersMap: Record<string, UserData>;
  onProjectClick: (projectId: string) => void;
  isSharedProject: (project: Project) => boolean;
};

export const ProjectsTable = ({
  projects,
  usersMap,
  onProjectClick,
  isSharedProject,
}: ProjectsTableProps) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="w-[180px]">Members</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const sharedProject = isSharedProject(project);
            return (
              <TableRow
                key={project.id}
                className={`cursor-pointer hover:bg-muted/50 ${sharedProject ? "bg-amber-50/40" : ""}`}
                onClick={() => onProjectClick(project.id)}
              >
                <TableCell>
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{
                      backgroundColor: sharedProject
                        ? "#f59e0b"
                        : project.color || "#3b82f6",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      {sharedProject && (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 border-amber-500/20"
                        >
                          Shared
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {project.budget !== null && project.budget !== undefined ? (
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      ${project.budget.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.hourlyRate !== null && project.hourlyRate !== undefined ? (
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      ${project.hourlyRate}/h
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.members && project.members.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {project.members.slice(0, 2).map((memberId, idx) => {
                        const memberData = usersMap[memberId];
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border-2 border-background">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {memberData?.displayName?.[0]?.toUpperCase() ||
                                  memberData?.email?.[0]?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">
                              {memberData?.displayName ||
                                memberData?.email?.split("@")[0] ||
                                "Unknown"}
                            </span>
                          </div>
                        );
                      })}
                      {project.members.length > 2 && (
                        <span className="text-xs text-muted-foreground pl-8">
                          +{project.members.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.isArchived ? (
                    <Badge variant="outline" className="gap-1">
                      <Archive className="h-3 w-3" />
                      Archived
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                    >
                      Active
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};
