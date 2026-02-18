/**
 * ProjectService - Servicio de gestión de proyectos
 * Maneja todas las operaciones de proyectos
 */

import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { normalizeProjectRole, type ProjectRole } from '@/lib/roles';
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
  arrayRemove,
  deleteField
} from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  members?: string[];
  ownerId: string;
  clientId?: string;
  clientName?: string;
  hourlyRate?: number | null;
  estimatedTime?: string;
  isArchived: boolean;
  budget?: number | null;
  userRoles?: Record<string, ProjectRole>;
  createdAt: Date;
  updatedAt?: Date;
}

export class ProjectService extends BaseService {
  private static instance: ProjectService;

  private constructor(db: any) {
    super(db, 'projects');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: any): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService(db);
    }
    return ProjectService.instance;
  }

  /**
   * Obtiene todos los proyectos de un usuario
   * @param userId - ID del usuario
   */
  public async getAllProjects(userId: string): Promise<Project[]> {
    try {
      const projectsRef = collection(this.db, this.collectionName);
      const queries = [
        query(projectsRef, where('members', 'array-contains', userId)),
        query(projectsRef, where('ownerId', '==', userId)),
      ];

      const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
      const projectMap = new Map<string, Project>();

      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          projectMap.set(doc.id, {
            id: doc.id,
            name: data.name,
            description: data.description || '',
            color: data.color,
            members: data.members || [],
            ownerId: data.ownerId,
            clientId: data.clientId || undefined,
            clientName: data.clientName || undefined,
            hourlyRate: data.hourlyRate ?? null,
            estimatedTime: data.estimatedTime || '',
            isArchived: data.isArchived || false,
            budget: data.budget ?? null,
            userRoles: data.userRoles,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
          });
        });
      });

      return Array.from(projectMap.values());
    } catch (error: any) {
      console.error('Error al obtener proyectos:', error);
      throw new Error(`Error al obtener proyectos: ${error.message}`);
    }
  }

/**
 * Crea un nuevo proyecto
 * @param data - Datos del proyecto
 */
  public async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const projectsRef = collection(this.db, this.collectionName);
      const projectData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isArchived: data.isArchived || false,
      };
      
      const docRef = await addDoc(projectsRef, projectData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear proyecto:', error);
      throw new Error(`Error al crear proyecto: ${error.message}`);
    }
  }

  /**
   * Obtiene un proyecto por su ID
   * @param projectId - ID del proyecto
   */
  public async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      const snapshot = await getDoc(projectRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return {
        id: snapshot.id,
        name: data.name,
        description: data.description || '',
        color: data.color,
        members: data.members || [],
        ownerId: data.ownerId,
        clientId: data.clientId || undefined,
        clientName: data.clientName || undefined,
        hourlyRate: data.hourlyRate ?? null,
        estimatedTime: data.estimatedTime || '',
        isArchived: data.isArchived || false,
        budget: data.budget ?? null,
        userRoles: data.userRoles,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      };
    } catch (error: any) {
      console.error('Error al obtener proyecto:', error);
      throw new Error(`Error al obtener proyecto: ${error.message}`);
    }
  }

  /**
   * Archiva un proyecto
   * @param projectId - ID del proyecto
   */
  public async archiveProject(projectId: string): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      await updateDoc(projectRef, {
        isArchived: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al archivar proyecto:', error);
      throw new Error(`Error al archivar proyecto: ${error.message}`);
    }
  }

  /**
   * Obtiene los proyectos de un usuario como Observable
   * @param userId - ID del usuario
   */
  public getProjectsByUser(userId: string): Observable<Project[]> {
    return new Observable((observer) => {
      const projectsRef = collection(this.db, this.collectionName);
      const queries = [
        query(projectsRef, where('members', 'array-contains', userId)),
        query(projectsRef, where('ownerId', '==', userId)),
      ];

      const sources: Project[][] = [[], []];
      const emit = () => {
        const projectMap = new Map<string, Project>();
        sources.flat().forEach((project) => {
          projectMap.set(project.id, project);
        });
        observer.next(Array.from(projectMap.values()));
      };

      const unsubscribes = queries.map((q, index) =>
        onSnapshot(
          q,
          (querySnapshot) => {
            const projects: Project[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              projects.push({
                id: doc.id,
                name: data.name,
                description: data.description || '',
                color: data.color,
                members: data.members || [],
                ownerId: data.ownerId,
                clientId: data.clientId || undefined,
                clientName: data.clientName || undefined,
                hourlyRate: data.hourlyRate ?? null,
                estimatedTime: data.estimatedTime || '',
                isArchived: data.isArchived || false,
                budget: data.budget ?? null,
                userRoles: data.userRoles,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate(),
              });
            });
            sources[index] = projects;
            emit();
          },
          (error) => {
            console.error('Error en Observable de proyectos:', error);
            observer.error(error);
          }
        )
      );

      return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    });
  }

  /**
   * Actualiza un proyecto existente
   * @param projectId - ID del proyecto
   * @param updates - Datos a actualizar
   */
  public async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      
      // Eliminar campos que no deben actualizarse
      const { id, createdAt, updatedAt, ...updateData } = updates as any;
      
      await updateDoc(projectRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al actualizar proyecto:', error);
      throw new Error(`Error al actualizar proyecto: ${error.message}`);
    }
  }

  /**
   * Elimina un proyecto
   * @param projectId - ID del proyecto
   */
  public async deleteProject(projectId: string): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      await deleteDoc(projectRef);
    } catch (error: any) {
      console.error('Error al eliminar proyecto:', error);
      throw new Error(`Error al eliminar proyecto: ${error.message}`);
    }
  }

  /**
   * Permite a un usuario salir de un proyecto
   */
  public async leaveProject(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      await updateDoc(projectRef, {
        members: arrayRemove(userId),
        [`userRoles.${userId}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al salir del proyecto:', error);
      throw new Error(`Error al salir del proyecto: ${error.message}`);
    }
  }

  /**
   * Actualiza el rol de un miembro
   */
  public async updateMemberRole(
    projectId: string,
    memberId: string,
    role: ProjectRole
  ): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      const normalizedRole = normalizeProjectRole(role, { allowOwner: false });
      await updateDoc(projectRef, {
        [`userRoles.${memberId}`]: normalizedRole,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al actualizar rol de miembro:', error);
      throw new Error(`Error al actualizar rol de miembro: ${error.message}`);
    }
  }

  /**
   * Elimina a un miembro del proyecto
   */
  public async removeMember(projectId: string, memberId: string): Promise<void> {
    try {
      const projectRef = doc(this.db, this.collectionName, projectId);
      await updateDoc(projectRef, {
        members: arrayRemove(memberId),
        [`userRoles.${memberId}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al eliminar miembro:', error);
      throw new Error(`Error al eliminar miembro: ${error.message}`);
    }
  }
}
