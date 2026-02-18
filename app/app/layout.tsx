"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarAdvanced } from "@/components/app-sidebar-advanced";
import GlobalSearchModal from "@/components/global-search-modal";
import TimerHeader from '@/components/timer-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvitationService, type Invitation } from '@/services/invitation.service';
import { ProjectService } from '@/services/project.service';
import { ActivityLogService } from '@/services/activity-log.service';
import { db } from '@/lib/firebase.config';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadInvites = async () => {
      if (!user) {
        setInvites([]);
        setProjectNames({});
        return;
      }

      try {
        setInviteLoading(true);
        setInviteError(null);
        const invitationService = InvitationService.getInstance(db);
        const results = await invitationService.getInvitationsForUser({
          email: user.email || undefined,
          userId: user.uid,
        });

        const pending = results.filter((invite) => invite.status === 'pending');
        setInvites(pending);

        const projectService = ProjectService.getInstance(db);
        const uniqueProjectIds = Array.from(new Set(pending.map((invite) => invite.projectId)));
        const projectEntries = await Promise.all(
          uniqueProjectIds.map(async (projectId) => {
            const project = await projectService.getProject(projectId);
            return [projectId, project?.name || 'Unknown project'] as const;
          })
        );

        const nameMap: Record<string, string> = {};
        projectEntries.forEach(([id, name]) => {
          nameMap[id] = name;
        });
        setProjectNames(nameMap);
      } catch (error: any) {
        console.error('Error loading invitations:', error);
        setInviteError(error.message || 'Unable to load invitations');
      } finally {
        setInviteLoading(false);
      }
    };

    loadInvites();
  }, [user]);

  const pendingCount = invites.length;

  const handleAcceptInvite = async (invite: Invitation) => {
    if (!user) return;

    try {
      setInviteLoading(true);
      const invitationService = InvitationService.getInstance(db);
      await invitationService.acceptInvitation(invite.id, user.uid);

      const activityLogService = ActivityLogService.getInstance(db);
      await activityLogService.logMemberJoined(
        invite.projectId,
        user.uid,
        user.displayName || user.email || 'User'
      );

      const nextInvites = invites.filter((item) => item.id !== invite.id);
      setInvites(nextInvites);
    } catch (error: any) {
      setInviteError(error.message || 'Unable to accept invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeclineInvite = async (invite: Invitation) => {
    try {
      setInviteLoading(true);
      const invitationService = InvitationService.getInstance(db);
      await invitationService.declineInvitation(invite.id);
      const nextInvites = invites.filter((item) => item.id !== invite.id);
      setInvites(nextInvites);
    } catch (error: any) {
      setInviteError(error.message || 'Unable to decline invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarAdvanced />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6">
          <div className="flex flex-1 items-center">
            <SidebarTrigger className="-ml-1" />
          </div>

          <div className="flex flex-1 justify-center">
            <TimerHeader />
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <GlobalSearchModal />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center px-1">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-3">
                <DropdownMenuLabel className="px-0">Invitations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {inviteLoading ? (
                  <div className="px-1 py-2 text-sm text-muted-foreground">Loading...</div>
                ) : inviteError ? (
                  <div className="px-1 py-2 text-sm text-destructive">{inviteError}</div>
                ) : pendingCount === 0 ? (
                  <div className="px-1 py-2 text-sm text-muted-foreground">No pending invitations.</div>
                ) : (
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div key={invite.id} className="rounded-md border border-border bg-background px-3 py-2">
                        <div className="text-sm font-semibold truncate">
                          {projectNames[invite.projectId] || 'Project'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {invite.email} • Role: {invite.role}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvite(invite)}
                            disabled={inviteLoading}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineInvite(invite)}
                            disabled={inviteLoading}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/20 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
