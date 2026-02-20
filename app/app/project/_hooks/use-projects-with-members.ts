"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/services/project.service";
import type { UserData } from "@/services/user.service";
import { ProjectService } from "@/services/project.service";
import { UserService } from "@/services/user.service";
import { db } from "@/lib/firebase.config";

type UseProjectsWithMembersArgs = {
  userId?: string | null;
};

export const useProjectsWithMembers = ({ userId }: UseProjectsWithMembersArgs) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const userProjects = await projectService.getAllProjects(userId);
        setProjects(userProjects);

        const uniqueUserIds = new Set<string>();
        userProjects.forEach((project) => {
          project.members?.forEach((memberId) => uniqueUserIds.add(memberId));
        });

        const userService = UserService.getInstance(db);
        const usersData: Record<string, UserData> = {};

        await Promise.all(
          Array.from(uniqueUserIds).map(async (memberId) => {
            try {
              const userData = await userService.getUser(memberId);
              if (userData) {
                usersData[memberId] = userData;
              }
            } catch (error) {
              console.error(`Error loading user ${memberId}:`, error);
            }
          })
        );

        setUsersMap(usersData);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [userId]);

  return { projects, setProjects, usersMap, loading };
};
