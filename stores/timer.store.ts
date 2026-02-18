/**
 * TimerStore - Store del cronómetro activo
 * Maneja el estado del temporizador que se muestra globalmente
 */

import { create } from 'zustand';
import { TimeService, TimeEntry, StartTimerInput, ActivityLogService } from '@/services';
import { db } from '@/lib/firebase.config';
import { differenceInSeconds } from 'date-fns';
import { useAuthStore } from './auth.store';
import { useTaskStore } from './task.store';

interface TimerState {
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  projectId: string | null;
  pauseStartedAt: Date | null;
  pausedSeconds: number;
  intervalId: NodeJS.Timeout | null;
  
  // Actions
  startTimer: (userId: string, data: StartTimerInput) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  updateElapsed: () => void;
  setActiveEntry: (entry: TimeEntry | null) => void;
  loadActiveTimer: (userId: string) => Promise<void>;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeEntry: null,
  elapsedSeconds: 0,
  isRunning: false,
  isPaused: false,
  taskId: null,
  projectId: null,
  pauseStartedAt: null,
  pausedSeconds: 0,
  intervalId: null,

  /**
   * Inicia un nuevo temporizador
   */
  startTimer: async (userId: string, data: StartTimerInput) => {
    try {
      const timeService = TimeService.getInstance(db);
      
      // Detener cualquier temporizador activo
      const currentEntry = get().activeEntry;
      if (currentEntry) {
        const currentElapsed = get().elapsedSeconds;
        await timeService.stopTimer(currentEntry.id, currentElapsed);
      }
      
      // Iniciar nuevo temporizador
      const entryId = await timeService.startTimer(userId, data);
      const newEntry: TimeEntry = {
        id: entryId,
        userId,
        projectId: data.projectId,
        taskId: data.taskId || null,
        description: data.description || '',
        startTime: new Date(),
        endTime: undefined,
        duration: 0,
        entryType: data.entryType || 'normal',
        isManual: false,
        isEdited: false,
        originalData: null,
        tags: data.tags || [],
      };
      
      set({ 
        activeEntry: newEntry, 
        taskId: data.taskId || null,
        projectId: data.projectId,
        isRunning: true,
        isPaused: false,
        pauseStartedAt: null,
        pausedSeconds: 0,
        elapsedSeconds: 0 
      });
      
      // Iniciar el contador
      const intervalId = setInterval(() => {
        get().updateElapsed();
      }, 1000);
      
      set({ intervalId });
    } catch (error) {
      console.error('Error al iniciar temporizador:', error);
      throw error;
    }
  },

  /**
   * Pausa el temporizador activo
   */
  pauseTimer: () => {
    const { intervalId, isRunning, isPaused } = get();
    if (!isRunning || isPaused) {
      return;
    }

    if (intervalId) {
      clearInterval(intervalId);
    }

    set({ isPaused: true, pauseStartedAt: new Date(), intervalId: null });
  },

  /**
   * Reanuda el temporizador activo
   */
  resumeTimer: () => {
    const { isRunning, isPaused, pauseStartedAt, pausedSeconds } = get();
    if (!isRunning || !isPaused) {
      return;
    }

    const now = new Date();
    const extraPaused = pauseStartedAt ? differenceInSeconds(now, pauseStartedAt) : 0;
    const updatedPaused = pausedSeconds + extraPaused;

    const intervalId = setInterval(() => {
      get().updateElapsed();
    }, 1000);

    set({
      isPaused: false,
      pauseStartedAt: null,
      pausedSeconds: updatedPaused,
      intervalId,
    });
  },

  /**
   * Detiene el temporizador activo
   */
  stopTimer: async () => {
    try {
      const { activeEntry, intervalId, isPaused } = get();
      
      if (!activeEntry) {
        throw new Error('No hay temporizador activo');
      }
      
      if (!isPaused) {
        get().updateElapsed();
      }

      const timeService = TimeService.getInstance(db);
      const durationSeconds = get().elapsedSeconds;
      await timeService.stopTimer(activeEntry.id, durationSeconds);
      
      // Registrar actividad
      const user = useAuthStore.getState().user;
      if (user && activeEntry) {
        const activityService = ActivityLogService.getInstance(db);
        const task = activeEntry.taskId
          ? useTaskStore.getState().getTaskById(activeEntry.taskId)
          : undefined;
        
        await activityService.logTimeLogged(
          activeEntry.projectId,
          user.uid,
          user.displayName || user.email || 'Usuario',
          durationSeconds,
          task?.title
        );
      }
      
      // Limpiar el intervalo
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      set({ 
        activeEntry: null, 
        taskId: null, 
        projectId: null,
        isRunning: false,
        isPaused: false,
        pauseStartedAt: null,
        pausedSeconds: 0,
        elapsedSeconds: 0,
        intervalId: null 
      });
    } catch (error) {
      console.error('Error al detener temporizador:', error);
      throw error;
    }
  },

  /**
   * Actualiza el tiempo transcurrido
   */
  updateElapsed: () => {
    const { activeEntry, pausedSeconds, isRunning, isPaused } = get();
    
    if (activeEntry && activeEntry.startTime && isRunning && !isPaused) {
      const now = new Date();
      const elapsed = Math.max(0, differenceInSeconds(now, activeEntry.startTime) - pausedSeconds);
      set({ elapsedSeconds: elapsed });
    }
  },

  /**
   * Establece la entrada activa (útil para recuperar estado)
   */
  setActiveEntry: (entry) => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }

    set({
      activeEntry: entry,
      isRunning: entry !== null,
      isPaused: false,
      pauseStartedAt: null,
      pausedSeconds: 0,
    });
    
    if (entry) {
      // Calcular el tiempo transcurrido inicial
      const elapsed = differenceInSeconds(new Date(), entry.startTime);
      set({
        elapsedSeconds: elapsed,
        taskId: entry.taskId || null,
        projectId: entry.projectId,
      });
      
      // Iniciar el intervalo
      const intervalId = setInterval(() => {
        get().updateElapsed();
      }, 1000);
      
      set({ intervalId });
    }
  },

  /**
   * Carga el temporizador activo del usuario (si existe)
   */
  loadActiveTimer: async (userId: string) => {
    try {
      const timeService = TimeService.getInstance(db);
      const entries = await timeService.getTimerEntries(userId);
      
      // Buscar una entrada sin endTime (temporizador activo)
      const activeEntry = entries.find(entry => !entry.endTime);
      
      if (activeEntry) {
        get().setActiveEntry(activeEntry);
      }
    } catch (error) {
      console.error('Error al cargar temporizador activo:', error);
    }
  },

  /**
   * Limpia el estado del temporizador
   */
  clearTimer: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({ 
      activeEntry: null, 
      taskId: null, 
      projectId: null,
      isRunning: false,
      isPaused: false,
      pauseStartedAt: null,
      pausedSeconds: 0,
      elapsedSeconds: 0,
      intervalId: null 
    });
  },
}));
