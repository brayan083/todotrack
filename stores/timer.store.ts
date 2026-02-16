/**
 * TimerStore - Store del cronómetro activo
 * Maneja el estado del temporizador que se muestra globalmente
 */

import { create } from 'zustand';
import { TimeService, TimeEntry } from '@/services';
import { db } from '@/lib/firebase.config';
import { differenceInSeconds } from 'date-fns';

interface TimerState {
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  isRunning: boolean;
  taskId: string | null;
  intervalId: NodeJS.Timeout | null;
  
  // Actions
  startTimer: (userId: string, taskId: string) => Promise<void>;
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
  taskId: null,
  intervalId: null,

  /**
   * Inicia un nuevo temporizador
   */
  startTimer: async (userId: string, taskId: string) => {
    try {
      const timeService = TimeService.getInstance(db);
      
      // Detener cualquier temporizador activo
      const currentEntry = get().activeEntry;
      if (currentEntry) {
        await timeService.stopTimer(currentEntry.id);
      }
      
      // Iniciar nuevo temporizador
      const entryId = await timeService.startTimer(userId, taskId);
      const newEntry: TimeEntry = {
        id: entryId,
        userId,
        taskId,
        startTime: new Date(),
        endTime: undefined,
        isManual: false,
        isEdited: false,
      };
      
      set({ 
        activeEntry: newEntry, 
        taskId, 
        isRunning: true,
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
   * Detiene el temporizador activo
   */
  stopTimer: async () => {
    try {
      const { activeEntry, intervalId } = get();
      
      if (!activeEntry) {
        throw new Error('No hay temporizador activo');
      }
      
      const timeService = TimeService.getInstance(db);
      await timeService.stopTimer(activeEntry.id);
      
      // Limpiar el intervalo
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      set({ 
        activeEntry: null, 
        taskId: null, 
        isRunning: false,
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
    const { activeEntry } = get();
    
    if (activeEntry && activeEntry.startTime) {
      const now = new Date();
      const elapsed = differenceInSeconds(now, activeEntry.startTime);
      set({ elapsedSeconds: elapsed });
    }
  },

  /**
   * Establece la entrada activa (útil para recuperar estado)
   */
  setActiveEntry: (entry) => {
    set({ activeEntry: entry, isRunning: entry !== null });
    
    if (entry) {
      // Calcular el tiempo transcurrido inicial
      const elapsed = differenceInSeconds(new Date(), entry.startTime);
      set({ elapsedSeconds: elapsed, taskId: entry.taskId });
      
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
      isRunning: false,
      elapsedSeconds: 0,
      intervalId: null 
    });
  },
}));
