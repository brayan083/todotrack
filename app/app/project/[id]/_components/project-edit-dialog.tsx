"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, Pencil, Trash2, AlertCircle } from "lucide-react";
import type { Project } from "@/services/project.service";
import { ProjectService } from "@/services/project.service";
import { db } from "@/lib/firebase.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

type ProjectVisibility = 'public' | 'private';

type ProjectEditDialogProps = {
  project: Project;
  onProjectUpdated: (updates: Partial<Project>) => void;
};

export const ProjectEditDialog = ({ project, onProjectUpdated }: ProjectEditDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"archive" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    color: string;
    budget: string;
    hourlyRate: string;
    visibility: ProjectVisibility;
  }>({
    name: project.name || "",
    description: project.description || "",
    color: project.color || COLORS[4],
    budget: project.budget?.toString() || "",
    hourlyRate: project.hourlyRate?.toString() || "",
    visibility: project.visibility || "private",
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: project.name || "",
      description: project.description || "",
      color: project.color || COLORS[4],
      budget: project.budget?.toString() || "",
      hourlyRate: project.hourlyRate?.toString() || "",
      visibility: project.visibility || "private",
    });
    setError(null);
  }, [open, project]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);
      const projectService = ProjectService.getInstance(db);
      const updates: Partial<Project> = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        color: formData.color,
        budget:
          formData.budget && !isNaN(Number(formData.budget)) ? Number(formData.budget) : null,
        hourlyRate:
          formData.hourlyRate && !isNaN(Number(formData.hourlyRate))
            ? Number(formData.hourlyRate)
            : null,
        visibility: formData.visibility === "public" ? "public" : "private",
      };

      await projectService.updateProject(project.id, updates);
      onProjectUpdated(updates);
      setOpen(false);
    } catch (submitError: any) {
      setError(submitError?.message || "Error updating project");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    const confirmed = window.confirm("Archive this project? You can restore it later.");
    if (!confirmed) return;

    try {
      setActionLoading("archive");
      const projectService = ProjectService.getInstance(db);
      await projectService.archiveProject(project.id);
      setOpen(false);
      router.push("/app/project");
    } catch (archiveError: any) {
      setError(archiveError?.message || "Error archiving project");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this project? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setActionLoading("delete");
      const projectService = ProjectService.getInstance(db);
      await projectService.deleteProject(project.id);
      setOpen(false);
      router.push("/app/project");
    } catch (deleteError: any) {
      setError(deleteError?.message || "Error deleting project");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              rows={3}
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full aspect-square rounded-lg transition-transform ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-foreground scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  visibility: value === "public" ? "public" : "private",
                })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="project-budget">Budget</Label>
              <Input
                id="project-budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(event) => setFormData({ ...formData, budget: event.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-rate">Hourly Rate</Label>
              <Input
                id="project-rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(event) =>
                  setFormData({ ...formData, hourlyRate: event.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleArchive}
            disabled={actionLoading !== null}
            className="gap-2"
          >
            {actionLoading === "archive" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Archive project
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading !== null}
            className="gap-2"
          >
            {actionLoading === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
