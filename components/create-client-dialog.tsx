/**
 * CreateClientDialog - Diálogo para crear y editar clientes
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Pencil } from 'lucide-react';
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
import { ClientService, type Client } from '@/services/client.service';
import { db } from '@/lib/firebase.config';

interface CreateClientDialogProps {
  userId: string;
  client?: Client; // Si se pasa, es modo edición
  onClientSaved: (client: Client) => void;
  children?: React.ReactNode;
}

export function CreateClientDialog({
  userId,
  client,
  onClientSaved,
  children,
}: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
  });

  const isEditMode = !!client;

  // Cargar datos del cliente si estamos en modo edición
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        contactEmail: client.contactEmail || '',
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Client name is required');
      return;
    }

    // Validar email si se proporciona
    if (formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    }

    try {
      setLoading(true);
      const clientService = ClientService.getInstance(db);

      if (isEditMode && client) {
        // Modo edición
        await clientService.updateClient(client.id, {
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
        });

        // Crear el objeto actualizado para el callback
        const updatedClient: Client = {
          ...client,
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
        };

        onClientSaved(updatedClient);
      } else {
        // Modo creación
        const clientData = {
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
          ownerId: userId,
        };

        const clientId = await clientService.createClient(clientData);

        // Crear el objeto de cliente completo para el callback
        const createdClient: Client = {
          id: clientId,
          name: formData.name.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
          ownerId: userId,
        };

        onClientSaved(createdClient);
      }

      // Reset form
      setFormData({
        name: '',
        contactEmail: '',
      });

      setOpen(false);
    } catch (err: any) {
      setError(err.message || `Error ${isEditMode ? 'updating' : 'creating'} client`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form cuando el diálogo se cierra
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      if (!isEditMode) {
        setFormData({
          name: '',
          contactEmail: '',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Client' : 'Create New Client'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2 items-start">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="Enter client name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="client@example.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Client' : 'Create Client'}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
