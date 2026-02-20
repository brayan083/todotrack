"use client";

import React from "react";

type ProjectTasksEmptyStateProps = {
  hasTasks: boolean;
};

export const ProjectTasksEmptyState: React.FC<ProjectTasksEmptyStateProps> = ({
  hasTasks,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {hasTasks ? (
        <>
          <div className="mb-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            No tasks match your filters
          </div>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            No tasks yet
          </div>
          <p className="text-sm text-muted-foreground">
            Create your first task to get started.
          </p>
        </>
      )}
    </div>
  );
};
