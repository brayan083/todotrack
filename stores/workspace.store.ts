/**
 * WorkspaceStore - Store de workspace actual
 */

import { create } from 'zustand';
import { WorkspaceService, type Workspace } from '@/services/workspace.service';
import { db } from '@/lib/firebase.config';

interface WorkspaceState {
  workspace: Workspace | null;
  workspaceId: string | null;
  workspaces: Workspace[];
  loading: boolean;
  setWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  setLoading: (loading: boolean) => void;
  clearWorkspace: () => void;
  loadWorkspaces: (userId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  workspaceId: null,
  workspaces: [],
  loading: false,

  setWorkspace: (workspace) => {
    if (typeof window !== 'undefined') {
      if (workspace?.id) {
        window.localStorage.setItem('activeWorkspaceId', workspace.id);
      } else {
        window.localStorage.removeItem('activeWorkspaceId');
      }
    }
    set({ workspace, workspaceId: workspace?.id || null, loading: false });
  },

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [workspace, ...state.workspaces] })),

  setLoading: (loading) => set({ loading }),

  clearWorkspace: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('activeWorkspaceId');
    }
    set({ workspace: null, workspaceId: null, loading: false });
  },

  loadWorkspaces: async (userId: string) => {
    try {
      set({ loading: true });
      const service = WorkspaceService.getInstance(db);
      const workspaces = await service.getWorkspacesForUser(userId);
      set({ workspaces, loading: false });
    } catch (error) {
      console.error('Error loading workspaces:', error);
      set({ loading: false });
    }
  },
}));
