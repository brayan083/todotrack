/**
 * ActivityLogService - Servicio de logs de actividad
 * Registra todas las acciones de usuarios en la aplicación
 */

import { BaseService } from './base.service';
import {
  collection,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  action: string;
  targetId?: string;
  targetName?: string;
  timestamp: any;
}

export interface LogActionInput {
  projectId: string;
  userId: string;
  userDisplayName: string;
  action: string;
  targetId?: string;
  targetName?: string;
}

export class ActivityLogService extends BaseService {
  private static instance: ActivityLogService;

  private constructor(db: any) {
    super(db, 'activityLogs');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: any): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService(db);
    }
    return ActivityLogService.instance;
  }

  /**
   * Registra una acción de usuario
   */
  public async logAction(data: LogActionInput): Promise<string> {
    try {
      const logsRef = collection(this.db, this.collectionName);
      const logData = {
        ...data,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(logsRef, logData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al registrar actividad:', error);
      throw new Error(`Error al registrar actividad: ${error.message}`);
    }
  }

  /**
   * Log específico: Crear tarea
   */
  public async logTaskCreated(
    projectId: string,
    userId: string,
    userDisplayName: string,
    taskId: string,
    taskTitle: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'created_task',
      targetId: taskId,
      targetName: taskTitle,
    });
  }

  /**
   * Log específico: Completar tarea
   */
  public async logTaskCompleted(
    projectId: string,
    userId: string,
    userDisplayName: string,
    taskId: string,
    taskTitle: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'completed_task',
      targetId: taskId,
      targetName: taskTitle,
    });
  }

  /**
   * Log específico: Actualizar tarea
   */
  public async logTaskUpdated(
    projectId: string,
    userId: string,
    userDisplayName: string,
    taskId: string,
    taskTitle: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'updated_task',
      targetId: taskId,
      targetName: taskTitle,
    });
  }

  /**
   * Log específico: Registrar tiempo
   */
  public async logTimeLogged(
    projectId: string,
    userId: string,
    userDisplayName: string,
    duration: number,
    taskTitle?: string
  ): Promise<void> {
    const durationHours = (duration / 3600).toFixed(2);
    const description = taskTitle
      ? `${durationHours}h - ${taskTitle}`
      : `${durationHours}h registradas`;

    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'logged_time',
      targetName: description,
    });
  }

  /**
   * Log específico: Crear proyecto
   */
  public async logProjectCreated(
    projectId: string,
    userId: string,
    userDisplayName: string,
    projectName: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'created_project',
      targetId: projectId,
      targetName: projectName,
    });
  }

  /**
   * Log específico: Archivar proyecto
   */
  public async logProjectArchived(
    projectId: string,
    userId: string,
    userDisplayName: string,
    projectName: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'archived_project',
      targetId: projectId,
      targetName: projectName,
    });
  }

  /**
   * Log especifico: Invitar miembro
   */
  public async logMemberInvited(
    projectId: string,
    userId: string,
    userDisplayName: string,
    invitee: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'member_invited',
      targetName: invitee,
    });
  }

  /**
   * Log especifico: Miembro unido
   */
  public async logMemberJoined(
    projectId: string,
    userId: string,
    userDisplayName: string
  ): Promise<void> {
    await this.logAction({
      projectId,
      userId,
      userDisplayName,
      action: 'member_joined',
      targetId: userId,
      targetName: userDisplayName,
    });
  }
}
