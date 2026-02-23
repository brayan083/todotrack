import { ChevronDown, Users } from "lucide-react";
import type { User } from "firebase/auth";
import type { Project } from "@/services/project.service";
import type { UserData } from "@/services/user.service";
import {
  canChangeMemberRole,
  getRoleLabel,
  getUserRole,
  type ProjectRole,
} from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectMembersCardProps = {
  project: Project;
  usersMap: Record<string, UserData>;
  currentUserRole: ProjectRole | null;
  currentUser: User | null;
  canManageMembersActions: boolean;
  memberActionError: string | null;
  memberActionLoadingId: string | null;
  onUpdateMemberRole: (memberId: string, role: ProjectRole) => void;
  workspaceMembers: string[];
};

export const ProjectMembersCard = ({
  project,
  usersMap,
  currentUserRole,
  currentUser,
  canManageMembersActions,
  memberActionError,
  memberActionLoadingId,
  onUpdateMemberRole,
  workspaceMembers,
}: ProjectMembersCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Workspace Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        {memberActionError && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {memberActionError}
          </div>
        )}
        <div className="space-y-3">
          {workspaceMembers.map((memberId) => {
            const memberData = usersMap[memberId];
            const memberRole = (getUserRole(project, memberId, workspaceMembers) || "member") as ProjectRole;
            const availableRoles: ProjectRole[] =
              currentUserRole === "owner" ? ["admin", "member", "viewer"] : ["member", "viewer"];
            const canManageMember =
              canManageMembersActions &&
              canChangeMemberRole(currentUserRole, memberRole) &&
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
