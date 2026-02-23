import type { Project } from "@/services/project.service";

export type ProjectRole = "owner" | "admin" | "member" | "viewer";
export type InviteRole = Exclude<ProjectRole, "owner">;

const PROJECT_ROLES: ProjectRole[] = ["owner", "admin", "member", "viewer"];
const INVITE_ROLES: InviteRole[] = ["admin", "member", "viewer"];

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export function normalizeProjectRole(
  role: string | undefined,
  options?: { allowOwner?: boolean }
): ProjectRole {
  const normalized = role?.toLowerCase();
  const allowOwner = options?.allowOwner ?? false;

  if (normalized === "owner" && !allowOwner) {
    return "member";
  }

  if (PROJECT_ROLES.includes(normalized as ProjectRole)) {
    return normalized as ProjectRole;
  }

  return "member";
}

export function normalizeInviteRole(role: string | undefined): InviteRole {
  const normalized = role?.toLowerCase();

  if (INVITE_ROLES.includes(normalized as InviteRole)) {
    return normalized as InviteRole;
  }

  return "member";
}

export function getUserRole(
  project: Project | null,
  userId?: string,
  workspaceMembers?: string[]
): ProjectRole | null {
  if (!project || !userId) return null;

  if (project.ownerId === userId) {
    return "owner";
  }

  const isProjectMember = project.members?.includes(userId) ?? false;
  const isWorkspaceMember = workspaceMembers?.includes(userId) ?? false;

  if (!isProjectMember && !isWorkspaceMember) {
    return null;
  }

  const role = project.userRoles?.[userId];
  if (!role) {
    return "member";
  }

  return normalizeProjectRole(role, { allowOwner: false });
}

export function getRoleLabel(role: ProjectRole): string {
  return ROLE_LABELS[role];
}

export function canManageProject(role: ProjectRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canInviteMembers(role: ProjectRole | null): boolean {
  return canManageProject(role);
}

export function canManageMembers(role: ProjectRole | null): boolean {
  return canManageProject(role);
}

export function canEditTasks(role: ProjectRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canCreateTasks(role: ProjectRole | null): boolean {
  return canEditTasks(role);
}

export function canDeleteTasks(role: ProjectRole | null): boolean {
  return canEditTasks(role);
}

export function canChangeMemberRole(
  actorRole: ProjectRole | null,
  targetRole: ProjectRole
): boolean {
  if (actorRole === "owner") {
    return targetRole !== "owner";
  }

  if (actorRole === "admin") {
    return targetRole === "member" || targetRole === "viewer";
  }

  return false;
}

export function canRemoveMember(
  actorRole: ProjectRole | null,
  targetRole: ProjectRole
): boolean {
  return canChangeMemberRole(actorRole, targetRole);
}
