"use client";
import React, { useState } from 'react';

import { SummaryCards } from './_components/summary-cards';
import { ProjectStatusCard } from './_components/project-status-card';
import { RecentActivityCard } from './_components/recent-activity-card';
import { useDashboardData } from './_hooks/use-dashboard-data';
import { DateRangeFilter } from './_components/date-range-filter';
import { startOfDay, endOfDay } from 'date-fns';

const Dashboard: React.FC = () => {
  // Filtro de rango de fechas
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6); // últimos 7 días (incluyendo hoy)
    return {
      startDate: startOfDay(start),
      endDate: endOfDay(today),
    };
  });
  const {
    greetingName,
    isLoading,
    todaySeconds,
    todayDeltaPercent,
    weeklyProgress,
    weeklyHours,
    weeklyRemaining,
    productivityData,
    maxProductivity,
    projectSummaries,
    recentEntries,
    projects,
    getTaskById,
  } = useDashboardData(dateRange);

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-20">
      {/* Welcome Section + Filtro de fechas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Good morning, {greetingName}. You&apos;re on track for your weekly goals.
          </p>
        </div>
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards
        isLoading={isLoading}
        todaySeconds={todaySeconds}
        todayDeltaPercent={todayDeltaPercent}
        weeklyProgress={weeklyProgress}
        weeklyHours={weeklyHours}
        weeklyRemaining={weeklyRemaining}
        productivityData={productivityData}
        maxProductivity={maxProductivity}
      />

      {/* Main Grid: Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Status */}
        <ProjectStatusCard
          isLoading={isLoading}
          projectSummaries={projectSummaries}
        />

        <RecentActivityCard
          isLoading={isLoading}
          recentEntries={recentEntries}
          projects={projects}
          getTaskById={getTaskById}
        />
      </div>
    </div>
  );
};

export default Dashboard;
