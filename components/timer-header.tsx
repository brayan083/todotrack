"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormattedTime, useProjects, useTasks, useTimer } from '@/hooks';

export default function TimerHeader() {
  const {
    activeEntry,
    elapsedSeconds,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();
  const { projects } = useProjects();
  const { tasks, getTaskById } = useTasks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('none');
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const formattedTime = useFormattedTime(elapsedSeconds);

  const projectTasks = useMemo(() => {
    if (!projectId) {
      return [];
    }
    return tasks.filter((task) => task.projectId === projectId);
  }, [projectId, tasks]);

  const activeProjectName = useMemo(() => {
    const id = activeEntry?.projectId;
    if (!id) {
      return null;
    }
    return projects.find((project) => project.id === id)?.name || null;
  }, [activeEntry, projects]);

  const activeTaskName = useMemo(() => {
    const id = activeEntry?.taskId;
    if (!id) {
      return null;
    }
    return getTaskById(id)?.title || null;
  }, [activeEntry, getTaskById]);

  useEffect(() => {
    setTaskId('none');
  }, [projectId]);

  const handleStart = async () => {
    if (!projectId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await startTimer({
        projectId,
        taskId: taskId === 'none' ? null : taskId,
        description: description.trim() || undefined,
        entryType,
      });
      setDialogOpen(false);
      setDescription('');
      setTaskId('none');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopTimer();
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="hidden md:flex items-center gap-3 bg-muted/50 rounded-full px-4 py-1.5 border border-border">
      <div
        className={`w-2 h-2 rounded-full ${isRunning && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
          }`}
      ></div>
      <span className="font-mono font-medium text-lg tracking-wider">{formattedTime}</span>
      <div className="h-5 w-px bg-border" />
      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
        {activeProjectName || 'Sin proyecto'}
        {activeTaskName ? ` / ${activeTaskName}` : ''}
      </span>

      {!isRunning && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-full hover:bg-background ml-1"
          onClick={() => setDialogOpen(true)}
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}

      {isRunning && !isPaused && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-background ml-1"
            onClick={pauseTimer}
          >
            <Pause className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-background"
            onClick={handleStop}
            disabled={isStopping}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      {isRunning && isPaused && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-background ml-1"
            onClick={resumeTimer}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-background"
            onClick={handleStop}
            disabled={isStopping}
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start stopwatch</DialogTitle>
            <DialogDescription>
              Select a project and task before starting the timer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="timer-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="timer-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timer-task">Task (optional)</Label>
              <Select value={taskId} onValueChange={setTaskId} disabled={!projectId}>
                <SelectTrigger id="timer-task">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timer-description">Description (optional)</Label>
              <Input
                id="timer-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What are you working on?"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timer-entry-type">Entry Type</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger id="timer-entry-type">
                  <SelectValue placeholder="Entry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="pomodoro">Pomodoro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={!projectId || isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
