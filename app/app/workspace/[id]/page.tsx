"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useWorkspace } from "@/hooks";
import { WorkspaceService, type Workspace } from "@/services/workspace.service";
import { InvitationService, type Invitation } from "@/services/invitation.service";
import { UserService, type UserData } from "@/services/user.service";
import { db } from "@/lib/firebase.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getRoleLabel, type InviteRole, type ProjectRole } from "@/lib/roles";

interface WorkspaceSettingsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const WorkspaceSettingsPage: React.FC<WorkspaceSettingsPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { workspace, setWorkspace, loadWorkspaces, workspaces } = useWorkspace();

  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [membersMap, setMembersMap] = useState<Record<string, UserData>>({});
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberSavingId, setMemberSavingId] = useState<string | null>(null);
  const [memberRemovingId, setMemberRemovingId] = useState<string | null>(null);

  const [inviteMode, setInviteMode] = useState<"email" | "uid">("email");
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSending, setInviteSending] = useState(false);

  const [invites, setInvites] = useState<Invitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState<string | null>(null);

  const [nextOwnerId, setNextOwnerId] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSaving, setTransferSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadWorkspace = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const service = WorkspaceService.getInstance(db);
        const data =
          workspace?.id === resolvedParams.id
            ? workspace
            : await service.getWorkspace(resolvedParams.id);

        if (!data) {
          if (!isMounted) return;
          setLoadError("Workspace not found");
          setWorkspaceData(null);
          return;
        }

        if (!isMounted) return;
        setWorkspaceData(data);
        setProfileName(data.name || "");
        setProfileDescription(data.description || "");
      } catch (error: any) {
        if (!isMounted) return;
        setLoadError(error.message || "Unable to load workspace");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, workspace]);

  useEffect(() => {
    if (!workspace || !workspaceData) return;
    if (workspace.id === workspaceData.id) {
      setWorkspaceData(workspace);
    }
  }, [workspace, workspaceData]);

  const memberIds = useMemo(() => {
    const members = workspaceData?.members || [];
    const ownerId = workspaceData?.ownerId;
    if (!ownerId) return members;
    const withoutOwner = members.filter((memberId) => memberId !== ownerId);
    return [ownerId, ...withoutOwner];
  }, [workspaceData?.members, workspaceData?.ownerId]);

  useEffect(() => {
    if (!workspaceData?.id || memberIds.length === 0) {
      setMembersMap({});
      setMembersLoading(false);
      return;
    }

    let isMounted = true;
    setMembersLoading(true);
    setMembersError(null);
    const userService = UserService.getInstance(db);

    Promise.all(memberIds.map((memberId) => userService.getUser(memberId)))
      .then((users) => {
        if (!isMounted) return;
        const nextMap: Record<string, UserData> = {};
        users.forEach((member) => {
          if (member) {
            nextMap[member.uid] = member;
          }
        });
        setMembersMap(nextMap);
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setMembersError(error.message || "Unable to load members");
      })
      .finally(() => {
        if (!isMounted) return;
        setMembersLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceData?.id, memberIds]);

  useEffect(() => {
    if (!workspaceData?.id) {
      setInvites([]);
      return;
    }

    let isMounted = true;
    setInvitesLoading(true);
    setInvitesError(null);

    const invitationService = InvitationService.getInstance(db);
    invitationService
      .getWorkspaceInvitations(workspaceData.id)
      .then((results) => {
        if (!isMounted) return;
        setInvites(results.filter((invite) => invite.status === "pending"));
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setInvitesError(error.message || "Unable to load invitations");
      })
      .finally(() => {
        if (!isMounted) return;
        setInvitesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceData?.id]);

  const getWorkspaceRole = (memberId: string): ProjectRole => {
    if (workspaceData?.ownerId === memberId) return "owner";
    const role = workspaceData?.userRoles?.[memberId] as ProjectRole | undefined;
    if (role === "admin" || role === "member" || role === "viewer" || role === "owner") {
      return role;
    }
    return "member";
  };

  const currentUserRole = user?.uid ? getWorkspaceRole(user.uid) : null;
  const canAccessSettings = currentUserRole === "owner" || currentUserRole === "admin";
  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin";
  const canManageInvites = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";
  const isPersonalWorkspace = Boolean(
    workspaceData &&
      workspaceData.ownerId === user?.uid &&
      (workspaceData.members?.length || 0) === 1
  );

  const updateWorkspaceState = (updates: Partial<Workspace>) => {
    setWorkspaceData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (workspace?.id === prev.id) {
        setWorkspace(next);
      }
      return next;
    });
  };

  const handleSaveProfile = async () => {
    if (!workspaceData || !canManageRoles) return;
    const name = profileName.trim();
    if (!name) {
      setProfileError("Name is required");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      const service = WorkspaceService.getInstance(db);
      await service.updateWorkspace(workspaceData.id, {
        name,
        description: profileDescription.trim(),
      });
      updateWorkspaceState({
        name,
        description: profileDescription.trim(),
      });
    } catch (error: any) {
      setProfileError(error.message || "Unable to update workspace");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleMemberRoleChange = async (memberId: string, role: ProjectRole) => {
    if (!workspaceData || !canManageRoles) return;
    if (memberId === workspaceData.ownerId) return;

    try {
      setMemberSavingId(memberId);
      setMembersError(null);
      const service = WorkspaceService.getInstance(db);
      await service.updateWorkspaceMemberRole(workspaceData.id, memberId, role);
      updateWorkspaceState({
        userRoles: {
          ...(workspaceData.userRoles || {}),
          [memberId]: role,
        },
      });
    } catch (error: any) {
      setMembersError(error.message || "Unable to update role");
    } finally {
      setMemberSavingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceData || !canManageRoles) return;
    if (memberId === workspaceData.ownerId) return;
    if (memberId === user?.uid) return;

    const confirmed = window.confirm("Remove this member from the workspace?");
    if (!confirmed) return;

    try {
      setMemberRemovingId(memberId);
      setMembersError(null);
      const service = WorkspaceService.getInstance(db);
      await service.removeWorkspaceMember(workspaceData.id, memberId);
      const nextMembers = (workspaceData.members || []).filter((id) => id !== memberId);
      const nextRoles = { ...(workspaceData.userRoles || {}) };
      delete nextRoles[memberId];
      updateWorkspaceState({
        members: nextMembers,
        userRoles: nextRoles,
      });
    } catch (error: any) {
      setMembersError(error.message || "Unable to remove member");
    } finally {
      setMemberRemovingId(null);
    }
  };

  const handleSendInvite = async () => {
    if (!user || !workspaceData || !canManageInvites) return;
    const value = inviteValue.trim();
    if (!value) {
      setInviteError(inviteMode === "email" ? "Email is required" : "UID is required");
      return;
    }

    try {
      setInviteSending(true);
      setInviteError(null);
      const userService = UserService.getInstance(db);
      let inviteeId: string | undefined;
      let email = "";

      if (inviteMode === "email") {
        email = value.toLowerCase();
        if (!/.+@.+\..+/.test(email)) {
          setInviteError("Invalid email format");
          return;
        }
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser) {
          inviteeId = existingUser.uid;
        }
      } else {
        const existingUser = await userService.getUser(value);
        if (!existingUser) {
          setInviteError("No user found with that UID");
          return;
        }
        email = (existingUser.email || "").toLowerCase();
        if (!email) {
          setInviteError("User does not have an email configured");
          return;
        }
        inviteeId = existingUser.uid;
      }

      const invitationService = InvitationService.getInstance(db);
      await invitationService.createInvitation({
        workspaceId: workspaceData.id,
        projectId: null,
        email,
        invitedBy: user.uid,
        role: inviteRole,
        inviteeId,
      });

      const nextInvites = await invitationService.getWorkspaceInvitations(workspaceData.id);
      setInvites(nextInvites.filter((invite) => invite.status === "pending"));
      setInviteValue("");
    } catch (error: any) {
      setInviteError(error.message || "Unable to send invitation");
    } finally {
      setInviteSending(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!workspaceData) return;

    try {
      setInvitesLoading(true);
      const invitationService = InvitationService.getInstance(db);
      await invitationService.revokeInvitation(inviteId);
      const nextInvites = await invitationService.getWorkspaceInvitations(workspaceData.id);
      setInvites(nextInvites.filter((invite) => invite.status === "pending"));
    } catch (error: any) {
      setInvitesError(error.message || "Unable to revoke invitation");
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!workspaceData || !isOwner || isPersonalWorkspace) return;
    if (!nextOwnerId || nextOwnerId === workspaceData.ownerId) {
      setTransferError("Select a new owner");
      return;
    }

    try {
      setTransferSaving(true);
      setTransferError(null);
      const service = WorkspaceService.getInstance(db);
      await service.transferWorkspaceOwnership(
        workspaceData.id,
        nextOwnerId,
        workspaceData.ownerId
      );
      updateWorkspaceState({
        ownerId: nextOwnerId,
        userRoles: {
          ...(workspaceData.userRoles || {}),
          [nextOwnerId]: "owner",
          [workspaceData.ownerId]: "admin",
        },
      });
    } catch (error: any) {
      setTransferError(error.message || "Unable to transfer ownership");
    } finally {
      setTransferSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceData || !isOwner || isPersonalWorkspace) return;
    const confirmed = window.confirm(
      "Delete this workspace? This will remove the workspace document but will not delete related data."
    );
    if (!confirmed) return;

    try {
      setDeleteSaving(true);
      setDeleteError(null);
      const service = WorkspaceService.getInstance(db);
      await service.deleteWorkspace(workspaceData.id);
      if (workspace?.id === workspaceData.id) {
        setWorkspace(null);
      }
      if (user) {
        await loadWorkspaces(user.uid);
      }
      router.push("/app/dashboard");
    } catch (error: any) {
      setDeleteError(error.message || "Unable to delete workspace");
    } finally {
      setDeleteSaving(false);
    }
  };

  useEffect(() => {
    if (workspaceData?.id) return;
    if (!user) return;
    if (workspaces.length === 0) return;
    if (!workspace) {
      setWorkspace(workspaces[0]);
    }
  }, [workspaceData?.id, user, workspaces, workspace, setWorkspace]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  if (!workspaceData) {
    return null;
  }

  if (!canAccessSettings) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have access to this workspace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">Manage members, roles, and workspace configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileError && <p className="text-sm text-destructive">{profileError}</p>}
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              disabled={!canManageRoles || profileSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              value={profileDescription}
              onChange={(event) => setProfileDescription(event.target.value)}
              disabled={!canManageRoles || profileSaving}
            />
          </div>
          <div>
            <Button onClick={handleSaveProfile} disabled={!canManageRoles || profileSaving}>
              {profileSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {membersError && <p className="text-sm text-destructive">{membersError}</p>}
          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : memberIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            memberIds.map((memberId) => {
              const memberData = membersMap[memberId];
              const memberRole = getWorkspaceRole(memberId);
              const isMemberOwner = memberId === workspaceData.ownerId;
              const isSelf = memberId === user.uid;
              const isSaving = memberSavingId === memberId;
              const isRemoving = memberRemovingId === memberId;

              return (
                <div key={memberId} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {memberData?.displayName || memberData?.email || memberId}
                    </div>
                    {memberData?.email && (
                      <div className="text-xs text-muted-foreground truncate">{memberData.email}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageRoles && !isMemberOwner ? (
                      <Select
                        value={memberRole}
                        onValueChange={(value) => handleMemberRoleChange(memberId, value as ProjectRole)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{getRoleLabel(memberRole)}</span>
                    )}
                    {canManageRoles && !isMemberOwner && !isSelf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(memberId)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
          <div className="grid gap-3 md:grid-cols-[160px_1fr_140px_auto]">
            <div className="grid gap-2">
              <Label htmlFor="invite-mode">Invite by</Label>
              <Select
                value={inviteMode}
                onValueChange={(value) => setInviteMode(value as "email" | "uid")}
                disabled={!canManageInvites || inviteSending}
              >
                <SelectTrigger id="invite-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="uid">User ID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-value">{inviteMode === "email" ? "Email" : "User ID"}</Label>
              <Input
                id="invite-value"
                value={inviteValue}
                onChange={(event) => setInviteValue(event.target.value)}
                disabled={!canManageInvites || inviteSending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as InviteRole)}
                disabled={!canManageInvites || inviteSending}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSendInvite} disabled={!canManageInvites || inviteSending}>
                {inviteSending ? "Sending..." : "Send invite"}
              </Button>
            </div>
          </div>

          <Separator />

          {invitesError && <p className="text-sm text-destructive">{invitesError}</p>}
          {invitesLoading ? (
            <p className="text-sm text-muted-foreground">Loading invitations...</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{invite.email}</div>
                    <div className="text-xs text-muted-foreground">Role: {invite.role}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={invitesLoading}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transferError && <p className="text-sm text-destructive">{transferError}</p>}
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 grid gap-2">
              <Label htmlFor="transfer-owner">Transfer ownership</Label>
              <Select
                value={nextOwnerId}
                onValueChange={setNextOwnerId}
                disabled={!isOwner || transferSaving || isPersonalWorkspace}
              >
                <SelectTrigger id="transfer-owner">
                  <SelectValue placeholder="Select new owner" />
                </SelectTrigger>
                <SelectContent>
                  {memberIds
                    .filter((memberId) => memberId !== workspaceData.ownerId)
                    .map((memberId) => (
                      <SelectItem key={memberId} value={memberId}>
                        {membersMap[memberId]?.displayName || membersMap[memberId]?.email || memberId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleTransferOwnership}
              disabled={!isOwner || transferSaving || isPersonalWorkspace}
            >
              {transferSaving ? "Transferring..." : "Transfer"}
            </Button>
          </div>

          <Separator />

          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium">Delete workspace</div>
              <div className="text-xs text-muted-foreground">
                {isPersonalWorkspace
                  ? "Personal workspaces cannot be deleted."
                  : "This action removes the workspace document and cannot be undone."}
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={!isOwner || deleteSaving || isPersonalWorkspace}
            >
              {deleteSaving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceSettingsPage;
