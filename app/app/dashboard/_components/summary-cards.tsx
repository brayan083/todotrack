import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Timer, ArrowUp, Flag } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatDurationShort,
  WEEKLY_GOAL_HOURS,
} from '../_utils/dashboard-utils';
import { type ProductivityPoint } from '../_hooks/use-dashboard-data';

interface SummaryCardsProps {
  isLoading: boolean;
  todaySeconds: number;
  todayDeltaPercent: number;
  weeklyProgress: number;
  weeklyHours: number;
  weeklyRemaining: number;
  productivityData: ProductivityPoint[];
  maxProductivity: number;
}

export const SummaryCards = ({
  isLoading,
  todaySeconds,
  todayDeltaPercent,
  weeklyProgress,
  weeklyHours,
  weeklyRemaining,
  productivityData,
  maxProductivity,
}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Timer className="h-16 w-16 text-primary" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold">
                  {formatDurationShort(todaySeconds)}
                </span>
                <span className="mb-1 text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" /> {todayDeltaPercent}%
                </span>
              </div>
              <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((todaySeconds / (8 * 3600)) * 100))}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Target: 8h 00m</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Goal</CardTitle>
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
            {weeklyProgress}% Complete
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-4 mt-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${weeklyProgress}, 100`}
                    strokeLinecap="round"
                    strokeWidth="4"
                  ></path>
                </svg>
                <Flag className="absolute h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {weeklyHours}h <span className="text-lg text-muted-foreground">/ {WEEKLY_GOAL_HOURS}h</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {weeklyRemaining} hours remaining this week
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Productivity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : (
            <>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivityData}>
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '4px', fontSize: '12px', color: 'hsl(var(--popover-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {productivityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value === maxProductivity && entry.value > 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1 uppercase tracking-wider font-semibold">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
