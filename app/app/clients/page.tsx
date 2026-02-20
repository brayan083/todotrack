"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, MoreHorizontal, Pencil, Trash2, Mail, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { CreateClientDialog } from '@/components/create-client-dialog';
import { useAuthStore } from '@/stores';
import { ClientService, type Client } from '@/services/client.service';
import { ProjectService, type Project } from '@/services/project.service';
import { db } from '@/lib/firebase.config';

const ClientsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const clientService = ClientService.getInstance(db);
    
    // Suscribirse a los cambios en tiempo real
    const subscription = clientService.getClientsByOwner(user.uid).subscribe({
      next: (clients) => {
        setClients(clients);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        setLoading(false);
      },
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [user]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.contactEmail?.toLowerCase().includes(term)
    );
  }, [clients, searchTerm]);

  useEffect(() => {
    if (!drawerOpen || !selectedClient || !user) return;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError(null);
        const projectService = ProjectService.getInstance(db);
        const allProjects = await projectService.getAllProjects(user.uid);
        const filtered = allProjects.filter(project => project.clientId === selectedClient.id);
        setClientProjects(filtered);
      } catch (error: any) {
        console.error('Error loading client projects:', error);
        setProjectsError('Error loading projects. Please try again.');
        setClientProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [drawerOpen, selectedClient, user]);

  const handleClientSaved = (savedClient: Client) => {
    setClients(prevClients => {
      const existingIndex = prevClients.findIndex(c => c.id === savedClient.id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prevClients];
        updated[existingIndex] = savedClient;
        return updated;
      } else {
        // Add new
        return [...prevClients, savedClient];
      }
    });
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(clientId);
      const clientService = ClientService.getInstance(db);
      await clientService.deleteClient(clientId);
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setDrawerOpen(true);
  };

  const handleProjectClick = (projectId: string) => {
    setDrawerOpen(false);
    router.push(`/app/project/${projectId}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="px-6 py-4 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
            </p>
          </div>
          {user && (
            <CreateClientDialog
              userId={user.uid}
              onClientSaved={handleClientSaved}
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Clients Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first client'}
            </p>
            {!searchTerm && user && (
              <CreateClientDialog
                userId={user.uid}
                onClientSaved={handleClientSaved}
              />
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        {client.contactEmail ? (
                          <a
                            href={`mailto:${client.contactEmail}`}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Mail className="h-3 w-3" />
                            {client.contactEmail}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">No email</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === client.id}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <CreateClientDialog
                              userId={user?.uid || ''}
                              client={client}
                              onClientSaved={handleClientSaved}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </CreateClientDialog>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => handleDeleteClient(client.id)}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="flex h-full flex-col">
          <DrawerHeader className="px-6 pt-6">
            <DrawerTitle>
              {selectedClient ? selectedClient.name : 'Client Projects'}
            </DrawerTitle>
            <DrawerDescription>
              {selectedClient?.contactEmail || 'Projects associated with this client'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-muted-foreground text-sm">Loading projects...</p>
                </div>
              </div>
            ) : projectsError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {projectsError}
              </div>
            ) : clientProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">No projects yet</h3>
                <p className="text-sm text-muted-foreground">
                  This client does not have projects associated yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:border-primary/40 hover:bg-muted/40"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleProjectClick(project.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleProjectClick(project.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-border px-6 py-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ClientsPage;
