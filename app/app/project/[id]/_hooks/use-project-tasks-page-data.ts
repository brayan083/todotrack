"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ProjectService, type Project } from "@/services/project.service";
import { UserService, type UserData } from "@/services/user.service";
import { TaskService, type Task } from "@/services/task.service";
import { InvitationService, type Invitation } from "@/services/invitation.service";
import { ActivityLogService } from "@/services/activity-log.service";
import { db } from "@/lib/firebase.config";
import type { InviteRole, ProjectRole } from "@/lib/roles";

export type AssigneeOption = {
  uid: string;
  label: string;
  photoURL?: string | null;
};

type UseProjectTasksPageDataArgs = {
  projectId?: string;
  user: User | null;
};

export const useProjectTasksPageData = ({
  projectId,
  user,
}: UseProjectTasksPageDataArgs) => {
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteMode, setInviteMode] = useState<"email" | "uid">("email");
  const [inviteValue, setInviteValue] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProject: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;
    let isMounted = true;

    const loadData = async () => {
      if (!user || !projectId) {
        if (isMounted) {
          setProject(null);
          setProjectLoaded(false);
          setTasks([]);
          setAssignees([]);
          setUsersMap({});
          setInvitations([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setProjectLoaded(false);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);

        unsubscribeProject = projectService.subscribeToProject(
          projectId,
          (nextProject) => {
            if (!isMounted) return;
            setProjectLoaded(true);
            if (!nextProject) {
              setProject(null);
              setTasks([]);
              setAssignees([]);
              setUsersMap({});
              setLoading(false);
              return;
            }

            setProject(nextProject);
            setLoading(false);
          },
          (error) => {
            console.error("Error loading project:", error);
            if (isMounted) {
              setProjectLoaded(true);
              setProject(null);
              setLoading(false);
            }
          }
        );

        unsubscribeTasks = taskService.subscribeToProjectTasks(
          projectId,
          (projectTasks) => {
            if (isMounted) {
              setTasks(projectTasks);
            }
          },
          (error) => {
            console.error("Error loading project tasks:", error);
          }
        );

        try {
          const invitationService = InvitationService.getInstance(db);
          const projectInvitations = await invitationService.getProjectInvitations(projectId);
          if (isMounted) {
            setInvitations(projectInvitations);
          }
        } catch (inviteLoadError) {
          console.error("Error loading invitations:", inviteLoadError);
          if (isMounted) {
            setInvitations([]);
            setInviteError("Unable to load invitations");
          }
        }
      } catch (error) {
        console.error("Error loading project tasks:", error);
        if (isMounted) {
          setProject(null);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      unsubscribeProject?.();
      unsubscribeTasks?.();
    };
  }, [user, projectId]);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (!project) {
        if (isMounted) {
          setAssignees([]);
          setUsersMap({});
        }
        return;
      }

      const memberIds = (project.members || []).filter(Boolean);
      if (memberIds.length === 0) {
        if (isMounted) {
          setAssignees([]);
          setUsersMap({});
        }
        return;
      }

      try {
        const userService = UserService.getInstance(db);
        const users = await Promise.all(memberIds.map((memberId) => userService.getUser(memberId)));
        if (!isMounted) return;

        const mapped = users
          .filter((userData): userData is UserData => Boolean(userData))
          .map((userData) => ({
            uid: userData.uid,
            label: userData.displayName || userData.email || userData.uid.slice(0, 8),
            photoURL: userData.photoURL,
          }));
        setAssignees(mapped);

        const usersData: Record<string, UserData> = {};
        users.forEach((userData) => {
          if (userData) {
            usersData[userData.uid] = userData;
          }
        });
        setUsersMap(usersData);
      } catch (error) {
        console.error("Error loading project members:", error);
      }
    };

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [project?.id, project?.members?.join("|")]);

  const handleSendInvite = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user || !project) return;

    setInviteError(null);
    const value = inviteValue.trim();
    if (!value) {
      setInviteError(inviteMode === "email" ? "Email is required" : "UID is required");
      return;
    }

    try {
      setInviteLoading(true);
      const userService = UserService.getInstance(db);
      const invitationService = InvitationService.getInstance(db);
      const activityLogService = ActivityLogService.getInstance(db);

      let email = "";
      let inviteeId: string | undefined;

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

      if (inviteeId && project.members?.includes(inviteeId)) {
        setInviteError("User is already a member of this project");
        return;
      }

      await invitationService.createInvitation({
        projectId: project.id,
        email,
        invitedBy: user.uid,
        role: inviteRole,
        inviteeId,
      });

      await activityLogService.logMemberInvited(
        project.id,
        user.uid,
        user.displayName || user.email || "User",
        email
      );

      const refreshedInvites = await invitationService.getProjectInvitations(project.id);
      setInvitations(refreshedInvites);
      setInviteValue("");
    } catch (error: any) {
      setInviteError(error.message || "Error sending invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!projectId) return;

    try {
      setInviteLoading(true);
      const invitationService = InvitationService.getInstance(db);
      await invitationService.revokeInvitation(inviteId);
      const refreshedInvites = await invitationService.getProjectInvitations(projectId);
      setInvitations(refreshedInvites);
    } catch (error: any) {
      setInviteError(error.message || "Error revoking invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: ProjectRole) => {
    if (!project) return;
    setMemberActionError(null);

    try {
      setMemberActionLoadingId(memberId);
      const projectService = ProjectService.getInstance(db);
      await projectService.updateMemberRole(project.id, memberId, role);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              userRoles: {
                ...(prev.userRoles || {}),
                [memberId]: role,
              },
            }
          : prev
      );
    } catch (error: any) {
      setMemberActionError(error.message || "Unable to update member role");
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    const confirmed = window.confirm("Remove this member from the project?");
    if (!confirmed) return;

    setMemberActionError(null);

    try {
      setMemberActionLoadingId(memberId);
      const projectService = ProjectService.getInstance(db);
      await projectService.removeMember(project.id, memberId);
      setProject((prev) => {
        if (!prev) return prev;
        const nextRoles = { ...(prev.userRoles || {}) };
        delete nextRoles[memberId];
        return {
          ...prev,
          members: (prev.members || []).filter((id) => id !== memberId),
          userRoles: nextRoles,
        };
      });
      setAssignees((prev) => prev.filter((assignee) => assignee.uid !== memberId));
      setUsersMap((prev) => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } catch (error: any) {
      setMemberActionError(error.message || "Unable to remove member");
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  return {
    project,
    projectLoaded,
    setProject,
    tasks,
    setTasks,
    assignees,
    usersMap,
    loading,
    invitations,
    inviteMode,
    inviteValue,
    inviteRole,
    inviteLoading,
    inviteError,
    memberActionError,
    memberActionLoadingId,
    setInviteMode,
    setInviteValue,
    setInviteRole,
    handleSendInvite,
    handleRevokeInvite,
    handleUpdateMemberRole,
    handleRemoveMember,
  };
};
