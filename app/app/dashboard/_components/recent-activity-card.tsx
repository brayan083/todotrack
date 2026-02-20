import React from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDurationShort } from '../_utils/dashboard-utils';
import { type Project, type Task } from '@/services';
import { type RecentEntry } from '../_hooks/use-dashboard-data';

interface RecentActivityCardProps {
  isLoading: boolean;
  recentEntries: RecentEntry[];
  projects: Project[];
  getTaskById: (taskId: string) => Task | undefined;
}

export const RecentActivityCard = ({
  isLoading,
  recentEntries,
  projects,
  getTaskById,
}: RecentActivityCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest tracked sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`activity-skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {recentEntries.length === 0 && (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={3}>
                      No recent activity yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentEntries.map((entry) => {
                  const projectName = projects.find((project) => project.id === entry.projectId)?.name || 'Project';
                  const taskTitle = entry.taskId
                    ? getTaskById(entry.taskId)?.title || 'Task'
                    : entry.description || 'General';
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{projectName}</TableCell>
                      <TableCell className="text-muted-foreground">{taskTitle}</TableCell>
                      <TableCell className="text-right">{formatDurationShort(entry.duration || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
