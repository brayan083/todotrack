"use client";
import React from 'react';
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  Timer, 
  ArrowUp, 
  Flag, 
  Plus 
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const productivityData = [
  { name: 'M', value: 4 },
  { name: 'T', value: 6 },
  { name: 'W', value: 3 },
  { name: 'T', value: 8 },
  { name: 'F', value: 5 },
  { name: 'S', value: 0 },
  { name: 'S', value: 0 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 lg:p-10 space-y-8 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Good morning, Alex. You're on track for your weekly goals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Download Report
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Today's Hours */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Timer className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">4<span className="text-2xl text-muted-foreground">h</span> 12<span className="text-2xl text-muted-foreground">m</span></span>
              <span className="mb-1 text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" /> 12%
              </span>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Target: 8h 00m</p>
          </CardContent>
        </Card>

        {/* Card 2: Weekly Goal */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
             <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Goal</CardTitle>
             <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">80% Complete</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mt-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                  <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="80, 100" strokeLinecap="round" strokeWidth="4"></path>
                </svg>
                <Flag className="absolute h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">32h <span className="text-lg text-muted-foreground">/ 40h</span></div>
                <p className="text-xs text-muted-foreground mt-1">8 hours remaining this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Productivity Score */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productivity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityData}>
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '4px', fontSize: '12px', color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {productivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value === 8 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1 uppercase tracking-wider font-semibold">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Overview of your active projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* Project 1 */}
             <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-semibold">Backend API v2</div>
                <div className="text-sm text-muted-foreground">12h / 20h</div>
              </div>
              <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '60%' }}></div>
              </div>
            </div>
             {/* Project 2 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-semibold">Frontend Dashboard</div>
                <div className="text-sm text-muted-foreground">8h / 24h</div>
              </div>
              <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '33%' }}></div>
              </div>
            </div>
             {/* Project 3 */}
             <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-semibold">Mobile App</div>
                <div className="text-sm text-muted-foreground">42h / 40h</div>
              </div>
              <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-red-500" style={{ width: '100%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
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
                <TableRow>
                  <TableCell className="font-medium">Backend API</TableCell>
                  <TableCell className="text-muted-foreground">Auth Middleware</TableCell>
                  <TableCell className="text-right">2h 30m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dashboard</TableCell>
                  <TableCell className="text-muted-foreground">Chart Components</TableCell>
                  <TableCell className="text-right">1h 45m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Internal</TableCell>
                  <TableCell className="text-muted-foreground">Team Meeting</TableCell>
                  <TableCell className="text-right">1h 00m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Backend API</TableCell>
                  <TableCell className="text-muted-foreground">Database Schema</TableCell>
                  <TableCell className="text-right">3h 15m</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
