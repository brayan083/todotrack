/**
 * ProjectStore - Store de proyectos
 * Maneja el estado de proyectos con caché y sincronización en tiempo real
 */

import { create } from 'zustand';
import { ProjectService, Project } from '@/services';
import { db } from '@/lib/firebase.config';
import { Subscription } from 'rxjs';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadProjects: (userId: string) => Promise<void>;
  subscribeToProjects: (userId: string) => void;
  unsubscribe: () => void;
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  archiveProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectById: (projectId: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,
  error: null,
  subscription: null,

  setProjects: (projects) => set({ projects, error: null }),
  
  setSelectedProject: (project) => set({ selectedProject: project }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  /**
   * Carga los proyectos del usuario (una sola vez)
   */
  loadProjects: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const projectService = ProjectService.getInstance(db);
      const projects = await projectService.getAllProjects(userId);
      set({ projects, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar proyectos', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Se suscribe a cambios en tiempo real de los proyectos
   */
  subscribeToProjects: (userId: string) => {
    // Desuscribirse de cualquier suscripción anterior
    get().unsubscribe();
    
    const projectService = ProjectService.getInstance(db);
    const subscription = projectService.getProjectsByUser(userId).subscribe({
      next: (projects) => {
        set({ projects, loading: false, error: null });
      },
      error: (error) => {
        set({ 
          error: error.message || 'Error al sincronizar proyectos', 
          loading: false 
        });
      }
    });
    
    set({ subscription, loading: true });
  },

  /**
   * Desuscribirse de los cambios en tiempo real
   */
  unsubscribe: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },

  /**
   * Crea un nuevo proyecto
   */
  createProject: async (data: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      set({ loading: true, error: null });
      const projectService = ProjectService.getInstance(db);
      const projectId = await projectService.createProject(data);
      set({ loading: false });
      return projectId;
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear proyecto', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Actualiza un proyecto existente
   */
  updateProject: async (projectId: string, updates: Partial<Project>) => {
    try {
      set({ loading: true, error: null });
      const projectService = ProjectService.getInstance(db);
      await projectService.updateProject(projectId, updates);
      
      // Actualizar en el estado local
      const projects = get().projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      );
      set({ projects, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar proyecto', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Archiva un proyecto
   */
  archiveProject: async (projectId: string) => {
    try {
      set({ loading: true, error: null });
      const projectService = ProjectService.getInstance(db);
      await projectService.archiveProject(projectId);
      
      // Actualizar en el estado local
      const projects = get().projects.map(p => 
        p.id === projectId ? { ...p, isArchived: true } : p
      );
      set({ projects, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al archivar proyecto', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Elimina un proyecto
   */
  deleteProject: async (projectId: string) => {
    try {
      set({ loading: true, error: null });
      const projectService = ProjectService.getInstance(db);
      await projectService.deleteProject(projectId);
      
      // Eliminar del estado local
      const projects = get().projects.filter(p => p.id !== projectId);
      set({ projects, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar proyecto', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Obtiene un proyecto por su ID
   */
  getProjectById: (projectId: string) => {
    return get().projects.find(p => p.id === projectId);
  },
}));
