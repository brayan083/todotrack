import React from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatHoursOnly } from '../_utils/dashboard-utils';
import { type ProjectSummary } from '../_hooks/use-dashboard-data';

interface ProjectStatusCardProps {
  isLoading: boolean;
  projectSummaries: ProjectSummary[];
}

export const ProjectStatusCard = ({ isLoading, projectSummaries }: ProjectStatusCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
        <CardDescription>Overview of your active projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`project-skeleton-${index}`} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : (
          <>
            {projectSummaries.length === 0 && (
              <p className="text-sm text-muted-foreground">No project activity yet.</p>
            )}
            {projectSummaries.map(({ project, totalSeconds, estimatedSeconds, progress }) => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {estimatedSeconds
                      ? `${formatHoursOnly(totalSeconds)} / ${formatHoursOnly(estimatedSeconds)}`
                      : `${formatHoursOnly(totalSeconds)}`}
                  </div>
                </div>
                <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full ${progress >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
