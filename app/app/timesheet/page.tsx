"use client";
import React from 'react';
import { 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Coffee 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const Timesheet: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Timesheet History</h1>
          <p className="text-muted-foreground text-sm">Review your tracked hours and manage entries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="backend">Backend API</SelectItem>
              <SelectItem value="frontend">Frontend Dashboard</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <div className="flex items-center bg-card border border-input rounded-md p-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1 cursor-pointer">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Oct 21 - Oct 27, 2023</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button className="hidden md:flex gap-2">
            <Plus className="h-4 w-4" />
            <span>New Entry</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Hours */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between relative overflow-hidden group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Hours</p>
            <h3 className="text-3xl font-bold">34<span className="text-lg text-muted-foreground font-normal">h</span> 15<span className="text-lg text-muted-foreground font-normal">m</span></h3>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% vs last week
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10">
            <Clock className="h-6 w-6" />
          </div>
        </div>
         {/* Billable */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Billable</p>
            <h3 className="text-3xl font-bold">30<span className="text-lg text-muted-foreground font-normal">h</span> 00<span className="text-lg text-muted-foreground font-normal">m</span></h3>
            <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-green-500" style={{ width: '88%' }}></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
         {/* Non-Billable */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Non-Billable</p>
            <h3 className="text-3xl font-bold">4<span className="text-lg text-muted-foreground font-normal">h</span> 15<span className="text-lg text-muted-foreground font-normal">m</span></h3>
            <div className="w-32 h-1 bg-secondary rounded-full mt-3 overflow-hidden">
               <div className="h-full bg-orange-500" style={{ width: '12%' }}></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Coffee className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32">Date</TableHead>
              <TableHead className="w-48">Project</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-32 text-right">Duration</TableHead>
              <TableHead className="w-24 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Row 1 */}
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">Oct 26, Mon</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  Backend API
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">Database Schema Design</span>
                <Badge variant="outline" className="ml-2 text-xs font-normal">Billable</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">04:30</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Edit</span>
                  <div className="h-4 w-4 border rounded border-muted-foreground/50"></div>
                </Button>
              </TableCell>
            </TableRow>
             {/* Row 2 */}
             <TableRow>
              <TableCell className="font-medium text-muted-foreground">Oct 26, Mon</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Internal
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">Weekly Team Sync</span>
              </TableCell>
              <TableCell className="text-right font-mono">01:00</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Edit</span>
                   <div className="h-4 w-4 border rounded border-muted-foreground/50"></div>
                </Button>
              </TableCell>
            </TableRow>
             {/* Row 3 */}
             <TableRow>
              <TableCell className="font-medium text-muted-foreground">Oct 27, Tue</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                  Dashboard
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">Component Library Implementation</span>
                <Badge variant="outline" className="ml-2 text-xs font-normal">Billable</Badge>
              </TableCell>
               <TableCell className="text-right font-mono">06:15</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                   <div className="h-4 w-4 border rounded border-muted-foreground/50"></div>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Timesheet;
