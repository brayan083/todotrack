/**
 * TaskService - Servicio de gestión de tareas
 * Maneja todas las operaciones CRUD de tareas
 */

import { BaseService } from './base.service';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  assigneeIds: string[];
  assigneeId?: string;
  position: number;
  dueDate?: Date;
  priority?: string;
  attachments?: Attachment[];
  tagIds?: string[];
  createdAt: Date;
}

export interface Attachment {
  // TODO: Definir estructura de adjuntos
  name: string;
  url: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export class TaskService extends BaseService {
  private static instance: TaskService;

  private constructor(db: any) {
    super(db, 'tasks');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: any): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService(db);
    }
    return TaskService.instance;
  }

  /**
   * Obtiene una tarea por ID
   * @param taskId - ID de la tarea
   */
  public async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskRef = doc(this.db, this.collectionName, taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        return null;
      }
      
      const data = taskDoc.data();
      const assigneeIds = Array.isArray(data.assigneeIds)
        ? data.assigneeIds.filter(Boolean)
        : data.assigneeId
          ? [data.assigneeId]
          : [];
      return {
        id: taskDoc.id,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        assigneeIds,
        assigneeId: assigneeIds[0],
        position: data.position || 0,
        dueDate: data.dueDate?.toDate(),
        priority: data.priority,
        attachments: data.attachments || [],
        tagIds: data.tagIds || [],
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } catch (error: any) {
      console.error('Error al obtener tarea:', error);
      throw new Error(`Error al obtener tarea: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las tareas de un usuario
   * @param userId - ID del usuario
   * @param projectId - ID opcional del proyecto para filtrar
   */
  public async getAllTasks(userId: string, projectId?: string): Promise<Task[]> {
    try {
      const tasksRef = collection(this.db, this.collectionName);
      // Si se proporciona un projectId, traer todas las tareas del proyecto
      if (projectId) {
        const q = query(tasksRef, where('projectId', '==', projectId));
        const querySnapshot = await getDocs(q);
        const tasks: Task[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const assigneeIds = Array.isArray(data.assigneeIds)
            ? data.assigneeIds.filter(Boolean)
            : data.assigneeId
              ? [data.assigneeId]
              : [];
          tasks.push({
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            status: data.status,
            assigneeIds,
            assigneeId: assigneeIds[0],
            position: data.position || 0,
            dueDate: data.dueDate?.toDate(),
            priority: data.priority,
            attachments: data.attachments || [],
            tagIds: data.tagIds || [],
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        return tasks;
      }

      const queries = [
        query(tasksRef, where('assigneeIds', 'array-contains', userId)),
        query(tasksRef, where('assigneeId', '==', userId)),
      ];

      const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
      const taskMap = new Map<string, Task>();

      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const assigneeIds = Array.isArray(data.assigneeIds)
            ? data.assigneeIds.filter(Boolean)
            : data.assigneeId
              ? [data.assigneeId]
              : [];
          taskMap.set(doc.id, {
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            status: data.status,
            assigneeIds,
            assigneeId: assigneeIds[0],
            position: data.position || 0,
            dueDate: data.dueDate?.toDate(),
            priority: data.priority,
            attachments: data.attachments || [],
            tagIds: data.tagIds || [],
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
      });

      return Array.from(taskMap.values());
    } catch (error: any) {
      console.error('Error al obtener tareas:', error);
      throw new Error(`Error al obtener tareas: ${error.message}`);
    }
  }

  /**
   * Suscribe a tareas de un proyecto en tiempo real
   * @param projectId - ID del proyecto
   * @param onChange - Callback con la lista de tareas
   * @param onError - Callback de error opcional
   */
  public subscribeToProjectTasks(
    projectId: string,
    onChange: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const tasksRef = collection(this.db, this.collectionName);
    const q = query(tasksRef, where('projectId', '==', projectId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const assigneeIds = Array.isArray(data.assigneeIds)
            ? data.assigneeIds.filter(Boolean)
            : data.assigneeId
              ? [data.assigneeId]
              : [];
          tasks.push({
            id: doc.id,
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            status: data.status,
            assigneeIds,
            assigneeId: assigneeIds[0],
            position: data.position || 0,
            dueDate: data.dueDate?.toDate(),
            priority: data.priority,
            attachments: data.attachments || [],
            tagIds: data.tagIds || [],
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        onChange(tasks);
      },
      (error) => {
        console.error('Error en suscripcion de tareas:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );

    return () => unsubscribe();
  }

  /**
   * Crea una nueva tarea
   * @param data - Datos de la tarea
   * @param taskId - ID opcional de la tarea
   */
  public async createTask(data: Omit<Task, 'id' | 'createdAt'>, taskId?: string): Promise<string> {
    try {
      const tasksRef = collection(this.db, this.collectionName);
      const taskData = {
        ...data,
        createdAt: serverTimestamp(),
      };
      
      if (taskId) {
        // Si se proporciona un ID, usar ese documento específico
        const taskDocRef = doc(this.db, this.collectionName, taskId);
        await updateDoc(taskDocRef, taskData);
        return taskId;
      } else {
        // Si no, crear un nuevo documento con ID automático
        const docRef = await addDoc(tasksRef, taskData);
        return docRef.id;
      }
    } catch (error: any) {
      console.error('Error al crear tarea:', error);
      throw new Error(`Error al crear tarea: ${error.message}`);
    }
  }

  /**
   * Actualiza una tarea existente
   * @param taskId - ID de la tarea
   * @param updates - Datos a actualizar
   */
  public async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(this.db, this.collectionName, taskId);
      
      // Eliminar campos que no deben actualizarse
      const { id, createdAt, ...updateData } = updates as any;
      
      await updateDoc(taskRef, updateData);
    } catch (error: any) {
      console.error('Error al actualizar tarea:', error);
      throw new Error(`Error al actualizar tarea: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de una tarea
   * @param taskId - ID de la tarea
   * @param status - Nuevo estado
   */
  public async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      const taskRef = doc(this.db, this.collectionName, taskId);
      await updateDoc(taskRef, { status });
    } catch (error: any) {
      console.error('Error al actualizar estado de tarea:', error);
      throw new Error(`Error al actualizar estado: ${error.message}`);
    }
  }

  /**
   * Elimina una tarea
   * @param taskId - ID de la tarea
   */
  public async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(this.db, this.collectionName, taskId);
      await deleteDoc(taskRef);
    } catch (error: any) {
      console.error('Error al eliminar tarea:', error);
      throw new Error(`Error al eliminar tarea: ${error.message}`);
    }
  }

  /**
   * Agrega un comentario a una tarea
   * @param taskId - ID de la tarea
   * @param comment - Datos del comentario
   */
  public async addComment(taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void> {
    try {
      const commentsRef = collection(this.db, this.collectionName, taskId, 'comments');
      await addDoc(commentsRef, {
        ...comment,
        taskId,
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al agregar comentario:', error);
      throw new Error(`Error al agregar comentario: ${error.message}`);
    }
  }
}
