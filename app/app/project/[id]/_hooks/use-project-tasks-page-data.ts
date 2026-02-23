"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { ProjectService, type Project } from "@/services/project.service";
import { UserService, type UserData } from "@/services/user.service";
import { TaskService, type Task } from "@/services/task.service";
import { db } from "@/lib/firebase.config";
import type { ProjectRole } from "@/lib/roles";
import { useWorkspaceStore } from "@/stores";

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
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const workspace = useWorkspaceStore((state) => state.workspace);
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProject: (() => void) | null = null;
    let unsubscribeTasks: (() => void) | null = null;
    let isMounted = true;

    const loadData = async () => {
      if (!user || !projectId || !workspaceId) {
        if (isMounted) {
          setProject(null);
          setProjectLoaded(false);
          setTasks([]);
          setAssignees([]);
          setUsersMap({});
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
          workspaceId,
          (projectTasks) => {
            if (isMounted) {
              setTasks(projectTasks);
            }
          },
          (error) => {
            console.error("Error loading project tasks:", error);
          }
        );
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
  }, [user, workspaceId, projectId]);

  const memberIds = useMemo(
    () => (workspace?.members || project?.members || []).filter(Boolean),
    [workspace?.members, project?.members]
  );

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
  }, [project, memberIds]);


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

  return {
    project,
    projectLoaded,
    setProject,
    tasks,
    setTasks,
    assignees,
    usersMap,
    loading,
    memberActionError,
    memberActionLoadingId,
    handleUpdateMemberRole,
  };
};
