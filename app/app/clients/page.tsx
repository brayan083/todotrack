"use client";

import React, { useEffect, useState } from 'react';
import { Search, Users, MoreHorizontal, Pencil, Trash2, Mail } from 'lucide-react';
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
import { CreateClientDialog } from '@/components/create-client-dialog';
import { useAuthStore } from '@/stores';
import { ClientService, type Client } from '@/services/client.service';
import { db } from '@/lib/firebase.config';

const ClientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    <TableRow key={client.id}>
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
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </CreateClientDialog>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => handleDeleteClient(client.id)}
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
    </div>
  );
};

export default ClientsPage;
