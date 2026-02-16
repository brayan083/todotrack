/**
 * CreateProjectDialog - Diálogo para crear nuevos proyectos
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
import { ProjectService, type Project } from '@/services';
import { db } from '@/lib/firebase.config';

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

interface CreateProjectDialogProps {
  userId: string;
  onProjectCreated: (project: Project) => void;
}

export function CreateProjectDialog({
  userId,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[4], // cyan default
    budget: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      const projectService = ProjectService.getInstance(db);

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        members: [userId],
        ownerId: userId,
        owner_id: userId,
        isArchived: false,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
      };

      const projectId = await projectService.createProject(projectData);

      // Crear el objeto de proyecto completo para el callback
      const createdProject: Project = {
        id: projectId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        members: [userId],
        ownerId: userId,
        owner_id: userId,
        isArchived: false,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        createdAt: new Date(),
      };

      onProjectCreated(createdProject);

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: COLORS[4],
        budget: '',
      });

      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g. API Migration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              placeholder="Brief description of the project..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Project Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full aspect-square rounded-lg transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                placeholder="0.00"
                className="pl-7"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
