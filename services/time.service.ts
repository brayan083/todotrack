/**
 * TimeService - Servicio de gestión de tiempo
 * Maneja el registro de tiempos y temporizadores
 */

import { BaseService } from './base.service';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId?: string | null;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  entryType: string;
  isManual: boolean;
  isEdited: boolean;
  originalData?: Record<string, any> | null;
  tags?: string[];
}

export interface StartTimerInput {
  projectId: string;
  taskId?: string | null;
  description?: string;
  entryType?: string;
  tags?: string[];
}

export class TimeService extends BaseService {
  private static instance: TimeService;

  private constructor(db: any) {
    super(db, 'timeEntries');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: any): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService(db);
    }
    return TimeService.instance;
  }

  /**
   * Inicia un temporizador para una tarea
   * @param userId - ID del usuario
   * @param taskId - ID de la tarea
   */
  public async startTimer(userId: string, data: StartTimerInput): Promise<string> {
    try {
      const timeEntriesRef = collection(this.db, this.collectionName);
      const entryData = {
        userId,
        projectId: data.projectId,
        taskId: data.taskId || null,
        description: data.description || '',
        startTime: serverTimestamp(),
        endTime: null,
        duration: 0,
        entryType: data.entryType || 'normal',
        isManual: false,
        isEdited: false,
        originalData: null,
        tags: data.tags || [],
      };
      
      const docRef = await addDoc(timeEntriesRef, entryData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al iniciar temporizador:', error);
      throw new Error(`Error al iniciar temporizador: ${error.message}`);
    }
  }

  /**
   * Detiene un temporizador
   * @param entryId - ID de la entrada de tiempo
   */
  public async stopTimer(entryId: string, durationSeconds: number): Promise<void> {
    try {
      const entryRef = doc(this.db, this.collectionName, entryId);
      await updateDoc(entryRef, {
        endTime: serverTimestamp(),
        duration: durationSeconds,
      });
    } catch (error: any) {
      console.error('Error al detener temporizador:', error);
      throw new Error(`Error al detener temporizador: ${error.message}`);
    }
  }

  /**
   * Obtiene las entradas de tiempo de un usuario
   * @param userId - ID del usuario
   * @param projectId - ID opcional del proyecto para filtrar
   */
  public async getTimerEntries(userId: string, projectId?: string): Promise<TimeEntry[]> {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      let q = query(entriesRef, where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      const entries: TimeEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          userId: data.userId,
          projectId: data.projectId,
          taskId: data.taskId || null,
          description: data.description || '',
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || undefined,
          duration: data.duration || 0,
          entryType: data.entryType || 'normal',
          isManual: data.isManual || false,
          isEdited: data.isEdited || false,
          originalData: data.originalData || null,
          tags: data.tags || [],
        });
      });
      
      // Si se proporciona projectId, necesitamos filtrar por tareas de ese proyecto
      // Esto requeriría una consulta adicional a las tareas
      // Por ahora devolvemos todas las entradas del usuario
      
      return entries;
    } catch (error: any) {
      console.error('Error al obtener entradas de tiempo:', error);
      throw new Error(`Error al obtener entradas: ${error.message}`);
    }
  }

  /**
   * Calcula la duración total de un proyecto
   * @param projectId - ID del proyecto
   */
  public calculateTotalDuration(projectId: string): number {
    // TODO: Este método requiere primero obtener todas las tareas del proyecto
    // y luego sumar las duraciones de todas sus entradas de tiempo
    // Por ahora devolvemos 0
    console.warn('calculateTotalDuration no implementado completamente');
    return 0;
  }

  /**
   * Crea una entrada de tiempo manual
   * @param data - Datos de la entrada de tiempo
   */
  public async createManualEntry(data: Omit<TimeEntry, 'id' | 'isManual'>): Promise<string> {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      const entryData = {
        ...data,
        startTime: data.startTime,
        endTime: data.endTime || null,
        isManual: true,
        isEdited: data.isEdited || false,
      };
      
      const docRef = await addDoc(entriesRef, entryData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear entrada manual:', error);
      throw new Error(`Error al crear entrada manual: ${error.message}`);
    }
  }

  /**
   * Edita una entrada de tiempo existente
   * @param entryId - ID de la entrada
   * @param updates - Datos a actualizar
   */
  public async editTimeEntry(entryId: string, updates: Partial<TimeEntry>): Promise<void> {
    try {
      const entryRef = doc(this.db, this.collectionName, entryId);
      
      // Eliminar campos que no deben actualizarse directamente
      const { id, ...updateData } = updates as any;
      
      await updateDoc(entryRef, {
        ...updateData,
        isEdited: true,
      });
    } catch (error: any) {
      console.error('Error al editar entrada de tiempo:', error);
      throw new Error(`Error al editar entrada: ${error.message}`);
    }
  }
}
