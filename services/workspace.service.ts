/**
 * WorkspaceService - Servicio de gestion de workspaces
 * Maneja la creacion y lectura de workspaces
 */

import { BaseService } from './base.service';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  deleteField,
} from 'firebase/firestore';
import type { ProjectRole } from '@/lib/roles';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  userRoles: Record<string, string>;
  settings?: Record<string, any>;
  createdAt: Date;
}

interface WorkspaceDoc {
  name?: string;
  description?: string;
  ownerId?: string;
  members?: string[];
  userRoles?: Record<string, string>;
  settings?: Record<string, any>;
  createdAt?: { toDate: () => Date } | null;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  userRoles: Record<string, string>;
  settings?: Record<string, any>;
}

export class WorkspaceService extends BaseService {
  private static instance: WorkspaceService;

  private constructor(db: any) {
    super(db, 'workspaces');
  }

  /**
   * Obtiene la instancia unica del servicio (Singleton)
   */
  public static getInstance(db: any): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService(db);
    }
    return WorkspaceService.instance;
  }

  /**
   * Obtiene el workspace del owner
   */
  public async getWorkspaceByOwner(ownerId: string): Promise<Workspace | null> {
    const workspacesRef = collection(this.db, this.collectionName);
    const q = query(workspacesRef, where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as WorkspaceDoc;
    return {
      id: docSnap.id,
      name: data.name || 'Workspace',
      description: data.description || '',
      ownerId: data.ownerId,
      members: data.members || [],
      userRoles: data.userRoles || {},
      settings: data.settings || {},
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }

  /**
   * Obtiene workspaces donde el usuario es owner o miembro
   */
  public async getWorkspacesForUser(userId: string): Promise<Workspace[]> {
    const workspacesRef = collection(this.db, this.collectionName);
    const ownerQuery = query(workspacesRef, where('ownerId', '==', userId));
    const memberQuery = query(workspacesRef, where('members', 'array-contains', userId));

    const [ownerSnapshot, memberSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(memberQuery),
    ]);

    const workspaceMap = new Map<string, Workspace>();
    const mapSnapshot = (snapshot: Awaited<ReturnType<typeof getDocs>>) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as WorkspaceDoc;
        workspaceMap.set(docSnap.id, {
          id: docSnap.id,
          name: data.name || 'Workspace',
          description: data.description || '',
          ownerId: data.ownerId,
          members: data.members || [],
          userRoles: data.userRoles || {},
          settings: data.settings || {},
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
    };

    mapSnapshot(ownerSnapshot);
    mapSnapshot(memberSnapshot);

    return Array.from(workspaceMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Obtiene un workspace por ID
   */
  public async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    const snapshot = await getDoc(workspaceRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data() as WorkspaceDoc;
    return {
      id: snapshot.id,
      name: data.name || 'Workspace',
      description: data.description || '',
      ownerId: data.ownerId,
      members: data.members || [],
      userRoles: data.userRoles || {},
      settings: data.settings || {},
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }

  /**
   * Crea un workspace personal si no existe
   */
  public async ensurePersonalWorkspace(userId: string, displayName?: string): Promise<Workspace> {
    const existing = await this.getWorkspaceByOwner(userId);
    if (existing) {
      return existing;
    }

    const name = displayName ? `${displayName}'s Workspace` : 'My Workspace';
    const workspaceData = {
      name,
      description: '',
      ownerId: userId,
      members: [userId],
      userRoles: { [userId]: 'admin' },
      settings: {},
      createdAt: serverTimestamp(),
    };

    const workspacesRef = collection(this.db, this.collectionName);
    const docRef = await addDoc(workspacesRef, workspaceData);

    return {
      id: docRef.id,
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: workspaceData.ownerId,
      members: workspaceData.members,
      userRoles: workspaceData.userRoles,
      settings: workspaceData.settings,
      createdAt: new Date(),
    };
  }

  /**
   * Crea un workspace
   */
  public async createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
    const workspacesRef = collection(this.db, this.collectionName);
    const payload = {
      name: data.name,
      description: data.description || '',
      ownerId: data.ownerId,
      members: data.members,
      userRoles: data.userRoles,
      settings: data.settings || {},
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(workspacesRef, payload);
    return {
      id: docRef.id,
      name: payload.name,
      description: payload.description,
      ownerId: payload.ownerId,
      members: payload.members,
      userRoles: payload.userRoles,
      settings: payload.settings,
      createdAt: new Date(),
    };
  }

  /**
   * Actualiza un workspace existente
   */
  public async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    const { id, createdAt, ...payload } = updates as any;
    await updateDoc(workspaceRef, payload);
  }

  /**
   * Actualiza el rol de un miembro en el workspace
   */
  public async updateWorkspaceMemberRole(
    workspaceId: string,
    memberId: string,
    role: ProjectRole
  ): Promise<void> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    const normalizedRole = (() => {
      const normalized = role?.toLowerCase();
      if (normalized === 'owner') return 'owner';
      if (normalized === 'admin') return 'admin';
      if (normalized === 'viewer') return 'viewer';
      return 'member';
    })();
    await updateDoc(workspaceRef, {
      [`userRoles.${memberId}`]: normalizedRole,
    });
  }

  /**
   * Elimina un miembro del workspace
   */
  public async removeWorkspaceMember(workspaceId: string, memberId: string): Promise<void> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    await updateDoc(workspaceRef, {
      members: arrayRemove(memberId),
      [`userRoles.${memberId}`]: deleteField(),
    });
  }

  /**
   * Transfiere la propiedad del workspace a otro miembro
   */
  public async transferWorkspaceOwnership(
    workspaceId: string,
    nextOwnerId: string,
    previousOwnerId: string
  ): Promise<void> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    await updateDoc(workspaceRef, {
      ownerId: nextOwnerId,
      members: arrayUnion(nextOwnerId),
      [`userRoles.${nextOwnerId}`]: 'owner',
      [`userRoles.${previousOwnerId}`]: 'admin',
    });
  }

  /**
   * Elimina un workspace
   */
  public async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspaceRef = doc(this.db, this.collectionName, workspaceId);
    await deleteDoc(workspaceRef);
  }
}
