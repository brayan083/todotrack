import { LayoutGrid, List } from "lucide-react";
import type { Project } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";

type ProjectsHeaderProps = {
  projectCount: number;
  viewMode: "grid" | "table";
  userId?: string;
  onViewModeChange: (mode: "grid" | "table") => void;
  onProjectCreated: (project: Project) => void;
};

export const ProjectsHeader = ({
  projectCount,
  viewMode,
  userId,
  onViewModeChange,
  onProjectCreated,
}: ProjectsHeaderProps) => {
  return (
    <div className="flex justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {projectCount} {projectCount === 1 ? "project" : "projects"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("table")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        {userId && (
          <CreateProjectDialog userId={userId} onProjectCreated={onProjectCreated} />
        )}
      </div>
    </div>
  );
};
