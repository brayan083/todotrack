/**
 * CreateProjectDialog - Diálogo para crear nuevos proyectos
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, UserPlus } from 'lucide-react';
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
import { ProjectService, type Project } from '@/services';
import { ClientService, type Client } from '@/services/client.service';
import { CreateClientDialog } from '@/components/create-client-dialog';
import { db } from '@/lib/firebase.config';
import type { ProjectRole } from '@/lib/roles';

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
  children?: React.ReactNode;
}

export function CreateProjectDialog({
  userId,
  onProjectCreated,
  children,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[4], // cyan default
    clientId: 'none',
    budget: '',
    hourlyRate: '',
    estimatedTime: '',
  });

  // Cargar clientes cuando el diálogo se abre
  useEffect(() => {
    if (open && userId) {
      loadClients();
    }
  }, [open, userId]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientService = ClientService.getInstance(db);
      const userClients = await clientService.getAllClients();
      // Filtrar solo los clientes del usuario actual
      const filteredClients = userClients.filter(client => client.ownerId === userId);
      setClients(filteredClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
    setFormData({ ...formData, clientId: newClient.id });
  };

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

      // Obtener el cliente seleccionado si existe
      const selectedClient = formData.clientId && formData.clientId !== 'none'
        ? clients.find(c => c.id === formData.clientId)
        : undefined;

      // Construir objeto con todos los campos
      const ownerRole: ProjectRole = 'owner';
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        color: formData.color,
        clientId: (formData.clientId && formData.clientId !== 'none') ? formData.clientId : undefined,
        clientName: selectedClient?.name || undefined,
        members: [userId],
        ownerId: userId,
        isArchived: false,
        budget: formData.budget && !isNaN(parseFloat(formData.budget)) ? parseFloat(formData.budget) : null,
        hourlyRate: formData.hourlyRate && !isNaN(parseFloat(formData.hourlyRate)) ? parseFloat(formData.hourlyRate) : null,
        estimatedTime: formData.estimatedTime.trim() || '',
        userRoles: { [userId]: ownerRole },
      };

      const projectId = await projectService.createProject(projectData);

      // Crear el objeto de proyecto completo para el callback
      const createdProject: Project = {
        id: projectId,
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        clientId: projectData.clientId || undefined,
        clientName: projectData.clientName || undefined,
        members: projectData.members,
        ownerId: projectData.ownerId,
        isArchived: projectData.isArchived,
        budget: projectData.budget,
        hourlyRate: projectData.hourlyRate,
        estimatedTime: projectData.estimatedTime,
        userRoles: projectData.userRoles,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onProjectCreated(createdProject);

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: COLORS[4],
        clientId: 'none',
        budget: '',
        hourlyRate: '',
        estimatedTime: '',
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
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Client Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientId">Client (Optional)</Label>
              <CreateClientDialog
                userId={userId}
                onClientSaved={handleClientCreated}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  disabled={loading}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  New Client
                </Button>
              </CreateClientDialog>
            </div>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              disabled={loading || loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No client</span>
                </SelectItem>
                {clients.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No clients yet. Create one to get started.
                  </div>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$/h</span>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-10"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Time (Optional)</Label>
            <Input
              id="estimatedTime"
              placeholder="e.g. 40h, 2 weeks, 3 months"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              disabled={loading}
            />
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
