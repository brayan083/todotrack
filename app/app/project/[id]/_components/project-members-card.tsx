import { ChevronDown, Trash2, UserPlus, Users } from "lucide-react";
import type { User } from "firebase/auth";
import type { Project } from "@/services/project.service";
import type { UserData } from "@/services/user.service";
import type { Invitation } from "@/services/invitation.service";
import {
  canChangeMemberRole,
  canRemoveMember,
  getRoleLabel,
  getUserRole,
  type InviteRole,
  type ProjectRole,
} from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectMembersCardProps = {
  project: Project;
  usersMap: Record<string, UserData>;
  currentUserRole: ProjectRole | null;
  currentUser: User | null;
  canInvite: boolean;
  canManageMembersActions: boolean;
  inviteMode: "email" | "uid";
  inviteValue: string;
  inviteRole: InviteRole;
  inviteLoading: boolean;
  inviteError: string | null;
  pendingInvites: Invitation[];
  memberActionError: string | null;
  memberActionLoadingId: string | null;
  onInviteModeChange: (value: "email" | "uid") => void;
  onInviteValueChange: (value: string) => void;
  onInviteRoleChange: (value: InviteRole) => void;
  onSendInvite: (event: React.FormEvent) => void;
  onRevokeInvite: (inviteId: string) => void;
  onUpdateMemberRole: (memberId: string, role: ProjectRole) => void;
  onRemoveMember: (memberId: string) => void;
};

export const ProjectMembersCard = ({
  project,
  usersMap,
  currentUserRole,
  currentUser,
  canInvite,
  canManageMembersActions,
  inviteMode,
  inviteValue,
  inviteRole,
  inviteLoading,
  inviteError,
  pendingInvites,
  memberActionError,
  memberActionLoadingId,
  onInviteModeChange,
  onInviteValueChange,
  onInviteRoleChange,
  onSendInvite,
  onRevokeInvite,
  onUpdateMemberRole,
  onRemoveMember,
}: ProjectMembersCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members
        </CardTitle>
        {canInvite && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite Members
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {inviteError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {inviteError}
                  </div>
                )}
                <form onSubmit={onSendInvite} className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={inviteMode} onValueChange={onInviteModeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="uid">UID</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-2"
                      placeholder={inviteMode === "email" ? "user@example.com" : "Firebase UID"}
                      value={inviteValue}
                      onChange={(event) => onInviteValueChange(event.target.value)}
                      disabled={inviteLoading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={inviteRole} onValueChange={onInviteRoleChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" disabled={inviteLoading} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite
                    </Button>
                  </div>
                </form>

                {pendingInvites.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Pending invitations</p>
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">Role: {invite.role}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={inviteLoading}
                          onClick={() => onRevokeInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {memberActionError && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {memberActionError}
          </div>
        )}
        <div className="space-y-3">
          {project.members?.map((memberId) => {
            const memberData = usersMap[memberId];
            const memberRole = (getUserRole(project, memberId) || "member") as ProjectRole;
            const availableRoles: ProjectRole[] =
              currentUserRole === "owner" ? ["admin", "member", "viewer"] : ["member", "viewer"];
            const canManageMember =
              canManageMembersActions &&
              canChangeMemberRole(currentUserRole, memberRole) &&
              memberId !== currentUser?.uid;
            const canRemove =
              canManageMembersActions &&
              canRemoveMember(currentUserRole, memberRole) &&
              memberId !== currentUser?.uid;
            const isMemberLoading = memberActionLoadingId === memberId;

            return (
              <div key={memberId} className="flex items-center gap-3 py-2">
                <Avatar className="h-9 w-9">
                  {memberData?.photoURL && (
                    <AvatarImage
                      src={memberData.photoURL}
                      alt={memberData.displayName || memberData.email || "User"}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {memberData?.displayName?.[0]?.toUpperCase() ||
                      memberData?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {memberData?.displayName || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {memberData?.email || ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getRoleLabel(memberRole)}
                  </Badge>
                  {canManageMember && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={isMemberLoading}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change role</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={memberRole}
                          onValueChange={(value) => onUpdateMemberRole(memberId, value as ProjectRole)}
                        >
                          {availableRoles.map((role) => (
                            <DropdownMenuRadioItem key={role} value={role}>
                              {getRoleLabel(role as ProjectRole)}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        {canRemove && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onRemoveMember(memberId)}
                            >
                              Remove member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
