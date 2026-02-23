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
  loadActiveTimer: (userId: string, workspaceId: string) => Promise<void>;
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
      const calculateDurationSeconds = (endTime: Date) => {
        const { activeEntry, pausedSeconds, pauseStartedAt, isPaused } = get();
        if (!activeEntry?.startTime) {
          return 0;
        }
        let totalPaused = pausedSeconds;
        if (isPaused && pauseStartedAt) {
          totalPaused += differenceInSeconds(endTime, pauseStartedAt);
        }
        return Math.max(0, differenceInSeconds(endTime, activeEntry.startTime) - totalPaused);
      };
      
      // Detener cualquier temporizador activo
      const currentEntry = get().activeEntry;
      if (currentEntry) {
        const endTime = new Date();
        const durationSeconds = calculateDurationSeconds(endTime);
        await timeService.stopTimer(currentEntry.id, durationSeconds, endTime);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('timesheet:refresh'));
        }
      }
      
      // Iniciar nuevo temporizador
      const entryId = await timeService.startTimer(userId, data);
      const newEntry: TimeEntry = {
        id: entryId,
        workspaceId: data.workspaceId,
        userId,
        projectId: data.projectId,
        taskId: data.taskId || null,
        description: data.description || '',
        startTime: new Date(),
        endTime: undefined,
        duration: 0,
        isPaused: false,
        pauseStartedAt: null,
        pausedSeconds: 0,
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
    const { activeEntry, intervalId, isRunning, isPaused } = get();
    if (!isRunning || isPaused) {
      return;
    }

    if (intervalId) {
      clearInterval(intervalId);
    }

    if (activeEntry) {
      const timeService = TimeService.getInstance(db);
      const pauseStartedAt = new Date();
      void timeService.updateTimerPauseState(activeEntry.id, {
        isPaused: true,
        pauseStartedAt,
      });
      set({
        isPaused: true,
        pauseStartedAt,
        intervalId: null,
        activeEntry: { ...activeEntry, isPaused: true, pauseStartedAt },
      });
      return;
    }

    set({ isPaused: true, pauseStartedAt: new Date(), intervalId: null });
  },

  /**
   * Reanuda el temporizador activo
   */
  resumeTimer: () => {
    const { activeEntry, isRunning, isPaused, pauseStartedAt, pausedSeconds } = get();
    if (!isRunning || !isPaused) {
      return;
    }

    const now = new Date();
    const extraPaused = pauseStartedAt ? differenceInSeconds(now, pauseStartedAt) : 0;
    const updatedPaused = pausedSeconds + extraPaused;

    const intervalId = setInterval(() => {
      get().updateElapsed();
    }, 1000);

    if (activeEntry) {
      const timeService = TimeService.getInstance(db);
      void timeService.updateTimerPauseState(activeEntry.id, {
        isPaused: false,
        pauseStartedAt: null,
        pausedSeconds: updatedPaused,
      });
    }

    set({
      isPaused: false,
      pauseStartedAt: null,
      pausedSeconds: updatedPaused,
      intervalId,
      activeEntry: activeEntry
        ? { ...activeEntry, isPaused: false, pauseStartedAt: null, pausedSeconds: updatedPaused }
        : null,
    });
  },

  /**
   * Detiene el temporizador activo
   */
  stopTimer: async () => {
    try {
      const { activeEntry, intervalId, isPaused, pauseStartedAt, pausedSeconds } = get();
      
      if (!activeEntry) {
        return;
      }

      const endTime = new Date();
      let totalPaused = pausedSeconds;
      if (isPaused && pauseStartedAt) {
        totalPaused += differenceInSeconds(endTime, pauseStartedAt);
      }

      const timeService = TimeService.getInstance(db);
      const durationSeconds = Math.max(
        0,
        differenceInSeconds(endTime, activeEntry.startTime) - totalPaused
      );
      await timeService.stopTimer(activeEntry.id, durationSeconds, endTime);
      
      // Registrar actividad
      const user = useAuthStore.getState().user;
      if (user && activeEntry) {
        const activityService = ActivityLogService.getInstance(db);
        const task = activeEntry.taskId
          ? useTaskStore.getState().getTaskById(activeEntry.taskId)
          : undefined;
        
        await activityService.logTimeLogged(
          activeEntry.workspaceId,
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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('timesheet:refresh'));
      }
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

    const isPaused = entry?.isPaused || false;
    const pauseStartedAt = entry?.pauseStartedAt || null;
    const pausedSeconds = entry?.pausedSeconds || 0;

    set({
      activeEntry: entry,
      isRunning: entry !== null,
      isPaused,
      pauseStartedAt,
      pausedSeconds,
    });
    
    if (entry) {
      // Calcular el tiempo transcurrido inicial
      const now = new Date();
      const totalPaused = isPaused && pauseStartedAt
        ? pausedSeconds + differenceInSeconds(now, pauseStartedAt)
        : pausedSeconds;
      const elapsed = Math.max(0, differenceInSeconds(now, entry.startTime) - totalPaused);
      set({
        elapsedSeconds: elapsed,
        taskId: entry.taskId || null,
        projectId: entry.projectId,
      });
      
      if (!isPaused) {
        // Iniciar el intervalo
        const intervalId = setInterval(() => {
          get().updateElapsed();
        }, 1000);

        set({ intervalId });
      }
    }
  },

  /**
   * Carga el temporizador activo del usuario (si existe)
   */
  loadActiveTimer: async (userId: string, workspaceId: string) => {
    try {
      const timeService = TimeService.getInstance(db);
      const entries = await timeService.getTimerEntries(userId, workspaceId);
      
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
