/**
 * CreateTaskDialog - Diálogo para crear nuevas tareas
 */

"use client";

import React, { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagService, TaskService, type Task } from '@/services';
import { db } from '@/lib/firebase.config';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWorkspace } from '@/hooks';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

type TaskStatus = 'todo' | 'in-progress' | 'completed';

interface CreateTaskDialogProps {
  projectId: string;
  userId: string;
  assignees?: { uid: string; label: string; photoURL?: string | null }[];
  onTaskCreated: (task: Task) => void;
  disabled?: boolean;
}

export function CreateTaskDialog({
  projectId,
  userId,
  assignees = [],
  onTaskCreated,
  disabled = false,
}: CreateTaskDialogProps) {
  const { workspaceId } = useWorkspace();
  const assigneeOptions = assignees.length > 0 ? assignees : [{ uid: userId, label: "Me" }];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: string;
    status: TaskStatus;
    assigneeId: string;
    dueDate: string;
    tags: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assigneeId: assigneeOptions.length > 0 ? assigneeOptions[0].uid : userId,
    dueDate: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      const taskService = TaskService.getInstance(db);
      const tagService = TagService.getInstance(db);

      // Obtener todas las tareas del proyecto para calcular la posición
      if (!workspaceId) {
        throw new Error('Workspace is required');
      }

      const existingTasks = await taskService.getAllTasks(userId, workspaceId, projectId);
      const maxPosition = existingTasks.length > 0 
        ? Math.max(...existingTasks.map(t => t.position || 0))
        : 0;

      const tagNames = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const tags = tagNames.length > 0
        ? await tagService.getOrCreateTagsByName(projectId, tagNames)
        : [];

      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        workspaceId,
        projectId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        assigneeId: formData.assigneeId,
        position: maxPosition + 1,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        priority: formData.priority,
        tagIds: tags.map((tag) => tag.id),
        subtasks: [],
        attachments: [],
        isDeleted: false,
        deletedAt: null,
      };

      const taskId = await taskService.createTask(newTask);
      
      // Crear el objeto de tarea completo para el callback
      const createdTask: Task = {
        id: taskId,
        ...newTask,
        createdAt: new Date(),
      };

      onTaskCreated(createdTask);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        assigneeId: assigneeOptions.length > 0 ? assigneeOptions[0].uid : userId,
        dueDate: '',
        tags: '',
      });
      
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={disabled}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Enter task description..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger id="priority" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
            >
              <SelectTrigger id="status" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
              disabled={loading}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {assigneeOptions.map((assignee) => (
                  <SelectItem key={assignee.uid} value={assignee.uid}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        {assignee.photoURL && <AvatarImage src={assignee.photoURL} />}
                        <AvatarFallback className="text-xs">
                          {assignee.label.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignee.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="#meeting, #development"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
