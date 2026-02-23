/**
 * Custom Hooks - Hooks personalizados para facilitar el uso de stores
 */

import { useEffect } from 'react';
import { useAuthStore, useTimerStore, useProjectStore, useTaskStore, useWorkspaceStore } from '@/stores';

/**
 * Hook para inicializar la autenticación
 * Debe llamarse una vez en el componente raíz
 */
export function useAuthInit() {
  useEffect(() => {
    // Suscribirse directamente al auth state
    const unsubscribe = useAuthStore.getState().initAuth();
    return unsubscribe;
  }, []);
}

/**
 * Hook para obtener el estado de autenticación
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
  };
}

/**
 * Hook para obtener el workspace actual
 */
export function useWorkspace() {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const loading = useWorkspaceStore((state) => state.loading);
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);
  const loadWorkspaces = useWorkspaceStore((state) => state.loadWorkspaces);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);

  return {
    workspace,
    workspaceId,
    workspaces,
    loading,
    setWorkspace,
    loadWorkspaces,
    addWorkspace,
  };
}

/**
 * Hook para el temporizador activo
 * Carga automáticamente el temporizador activo del usuario
 */
export function useTimer() {
  const user = useAuthStore((state) => state.user);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const {
    activeEntry,
    elapsedSeconds,
    isRunning,
    isPaused,
    taskId,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    loadActiveTimer,
    clearTimer,
  } = useTimerStore();

  useEffect(() => {
    if (user && workspaceId) {
      loadActiveTimer(user.uid, workspaceId);
    } else {
      clearTimer();
    }
  }, [user, workspaceId, loadActiveTimer, clearTimer]);

  return {
    activeEntry,
    elapsedSeconds,
    isRunning,
    isPaused,
    taskId,
    startTimer: (data: { projectId: string; taskId?: string | null; description?: string; entryType?: string; tags?: string[] }) =>
      user && workspaceId
        ? startTimer(user.uid, { ...data, workspaceId })
        : Promise.reject('No user or workspace'),
    pauseTimer,
    resumeTimer,
    stopTimer,
  };
}

/**
 * Hook para proyectos con suscripción en tiempo real
 * Se suscribe automáticamente a cambios y se desuscribe al desmontar
 */
export function useProjects() {
  const user = useAuthStore((state) => state.user);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const {
    projects,
    selectedProject,
    loading,
    error,
    subscribeToProjects,
    unsubscribe,
    setSelectedProject,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    leaveProject,
    getProjectById,
  } = useProjectStore();

  useEffect(() => {
    if (user && workspaceId) {
      subscribeToProjects(user.uid, workspaceId);
    }

    return () => {
      unsubscribe();
    };
  }, [user, workspaceId, subscribeToProjects, unsubscribe]);

  return {
    projects,
    selectedProject,
    loading,
    error,
    setSelectedProject,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    leaveProject,
    getProjectById,
  };
}

/**
 * Hook para tareas con filtros
 * Carga automáticamente las tareas del usuario
 */
export function useTasks(projectId?: string) {
  const user = useAuthStore((state) => state.user);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const {
    tasks,
    filteredTasks,
    selectedTask,
    filterStatus,
    filterProjectId,
    loading,
    error,
    loadTasks,
    setSelectedTask,
    setFilterStatus,
    setFilterProjectId,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskById,
    getTasksByProject,
    getTasksByStatus,
  } = useTaskStore();

  useEffect(() => {
    if (user && workspaceId) {
      loadTasks(user.uid, workspaceId, projectId);
    }
  }, [user, workspaceId, projectId, loadTasks]);

  return {
    tasks,
    filteredTasks,
    selectedTask,
    filterStatus,
    filterProjectId,
    loading,
    error,
    setSelectedTask,
    setFilterStatus,
    setFilterProjectId,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTaskById,
    getTasksByProject,
    getTasksByStatus,
  };
}

/**
 * Hook para formatear el tiempo transcurrido
 */
export function useFormattedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hook para detectar si el dispositivo es móvil
 */
export { useIsMobile } from './use-mobile';

