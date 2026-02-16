"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import { ProjectService } from '@/services/project.service';
import { db } from '@/lib/firebase.config';

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

const CreateProjectPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: colors[4], // cyan default
    budget: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in');
      return;
    }

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
        members: [user.uid],
        ownerId: user.uid,
        owner_id: user.uid,
        isArchived: false,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
      };

      const projectId = await projectService.createProject(projectData);
      
      // Redirect to the new project's kanban board
      router.push(`/app/project/${projectId}/kanban`);
    } catch (err: any) {
      setError(err.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Create New Project</h1>
        </div>
      </div>

      {/* Form Container */}
      <div className="p-6 flex items-start justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Create a new project to start managing tasks and tracking time
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
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
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div
                  ref={colorPickerRef}
                  className="grid grid-cols-4 gap-3"
                >
                  {colors.map((color) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProjectPage;
