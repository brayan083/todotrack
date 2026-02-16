/**
 * TaskStore - Store de tareas
 * Maneja el estado de tareas con caché y filtros
 */

import { create } from 'zustand';
import { TaskService, Task } from '@/services';
import { db } from '@/lib/firebase.config';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  selectedTask: Task | null;
  filterStatus: string | null;
  filterProjectId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterProjectId: (projectId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadTasks: (userId: string, projectId?: string) => Promise<void>;
  createTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  applyFilters: () => void;
  getTaskById: (taskId: string) => Task | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: string) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  selectedTask: null,
  filterStatus: null,
  filterProjectId: null,
  loading: false,
  error: null,

  setTasks: (tasks) => {
    set({ tasks, error: null });
    get().applyFilters();
  },
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  setFilterStatus: (status) => {
    set({ filterStatus: status });
    get().applyFilters();
  },
  
  setFilterProjectId: (projectId) => {
    set({ filterProjectId: projectId });
    get().applyFilters();
  },
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  /**
   * Carga las tareas del usuario
   */
  loadTasks: async (userId: string, projectId?: string) => {
    try {
      set({ loading: true, error: null });
      const taskService = TaskService.getInstance(db);
      const tasks = await taskService.getAllTasks(userId, projectId);
      set({ tasks, loading: false });
      get().applyFilters();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al cargar tareas', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Crea una nueva tarea
   */
  createTask: async (data: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      set({ loading: true, error: null });
      const taskService = TaskService.getInstance(db);
      const taskId = await taskService.createTask(data);
      
      // Agregar al estado local
      const newTask: Task = {
        ...data,
        id: taskId,
        createdAt: new Date(),
      };
      const tasks = [...get().tasks, newTask];
      set({ tasks, loading: false });
      get().applyFilters();
      
      return taskId;
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al crear tarea', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Actualiza una tarea existente
   */
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ loading: true, error: null });
      const taskService = TaskService.getInstance(db);
      await taskService.updateTask(taskId, updates);
      
      // Actualizar en el estado local
      const tasks = get().tasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      );
      set({ tasks, loading: false });
      get().applyFilters();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar tarea', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Actualiza el estado de una tarea
   */
  updateTaskStatus: async (taskId: string, status: string) => {
    try {
      set({ loading: true, error: null });
      const taskService = TaskService.getInstance(db);
      await taskService.updateTaskStatus(taskId, status);
      
      // Actualizar en el estado local
      const tasks = get().tasks.map(t => 
        t.id === taskId ? { ...t, status } : t
      );
      set({ tasks, loading: false });
      get().applyFilters();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al actualizar estado', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Elimina una tarea
   */
  deleteTask: async (taskId: string) => {
    try {
      set({ loading: true, error: null });
      const taskService = TaskService.getInstance(db);
      await taskService.deleteTask(taskId);
      
      // Eliminar del estado local
      const tasks = get().tasks.filter(t => t.id !== taskId);
      set({ tasks, loading: false });
      get().applyFilters();
    } catch (error: any) {
      set({ 
        error: error.message || 'Error al eliminar tarea', 
        loading: false 
      });
      throw error;
    }
  },

  /**
   * Aplica los filtros actuales a las tareas
   */
  applyFilters: () => {
    const { tasks, filterStatus, filterProjectId } = get();
    let filtered = [...tasks];
    
    // Filtrar por estado
    if (filterStatus) {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    // Filtrar por proyecto
    if (filterProjectId) {
      filtered = filtered.filter(t => t.projectId === filterProjectId);
    }
    
    set({ filteredTasks: filtered });
  },

  /**
   * Obtiene una tarea por su ID
   */
  getTaskById: (taskId: string) => {
    return get().tasks.find(t => t.id === taskId);
  },

  /**
   * Obtiene las tareas de un proyecto específico
   */
  getTasksByProject: (projectId: string) => {
    return get().tasks.filter(t => t.projectId === projectId);
  },

  /**
   * Obtiene las tareas por estado
   */
  getTasksByStatus: (status: string) => {
    return get().tasks.filter(t => t.status === status);
  },
}));
