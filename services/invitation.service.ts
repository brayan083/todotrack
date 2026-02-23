/**
 * InvitationService - Gestion de invitaciones de proyecto
 */

import { BaseService } from './base.service';
import { normalizeInviteRole, normalizeProjectRole, type InviteRole } from '@/lib/roles';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';

export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Invitation {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  email: string;
  invitedBy: string;
  role: InviteRole;
  status: InvitationStatus;
  sentAt: Date;
  inviteeId?: string;
}

export interface CreateInvitationInput {
  workspaceId: string;
  projectId?: string | null;
  email: string;
  invitedBy: string;
  role: InviteRole;
  inviteeId?: string;
}

export interface InvitationLookup {
  email?: string;
  userId?: string;
}

interface InvitationDoc {
  workspaceId?: string;
  projectId?: string;
  email?: string;
  invitedBy?: string;
  role?: string;
  status?: InvitationStatus;
  sentAt?: { toDate: () => Date } | null;
  inviteeId?: string | null;
}

export class InvitationService extends BaseService {
  private static instance: InvitationService;

  private constructor(db: any) {
    super(db, 'invitations');
  }

  /**
   * Obtiene la instancia unica del servicio (Singleton)
   */
  public static getInstance(db: any): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService(db);
    }
    return InvitationService.instance;
  }

  /**
   * Crea una invitacion para un proyecto
   */
  public async createInvitation(data: CreateInvitationInput): Promise<string> {
    try {
      const invitationsRef = collection(this.db, this.collectionName);
      const normalizedEmail = data.email.trim().toLowerCase();

      const existingQuery = query(
        invitationsRef,
        where('workspaceId', '==', data.workspaceId),
        where('projectId', '==', data.projectId || null),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending')
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        throw new Error('There is already a pending invitation for this email');
      }

      const invitationData = {
        workspaceId: data.workspaceId,
        projectId: data.projectId || null,
        email: normalizedEmail,
        invitedBy: data.invitedBy,
        role: normalizeInviteRole(data.role),
        status: 'pending' as InvitationStatus,
        sentAt: serverTimestamp(),
        inviteeId: data.inviteeId || null,
      };

      const docRef = await addDoc(invitationsRef, invitationData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear invitacion:', error);
      throw new Error(`Error al crear invitacion: ${error.message}`);
    }
  }

  /**
   * Obtiene invitaciones de un proyecto
   */
  public async getProjectInvitations(workspaceId: string, projectId: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(this.db, this.collectionName);
      const invitationsQuery = query(
        invitationsRef,
        where('workspaceId', '==', workspaceId),
        where('projectId', '==', projectId)
      );

      const snapshot = await getDocs(invitationsQuery);
      const invitations = snapshot.docs.map((inviteDoc) => {
        const data = inviteDoc.data() as InvitationDoc;
        return {
          id: inviteDoc.id,
          workspaceId: data.workspaceId || '',
          projectId: data.projectId || null,
          email: data.email || '',
          invitedBy: data.invitedBy || '',
          role: normalizeInviteRole(data.role),
          status: (data.status as InvitationStatus) || 'pending',
          sentAt: data.sentAt?.toDate() || new Date(0),
          inviteeId: data.inviteeId || undefined,
        };
      });

      invitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      return invitations;
    } catch (error: any) {
      console.error('Error al obtener invitaciones:', error);
      throw new Error(`Error al obtener invitaciones: ${error.message}`);
    }
  }

  /**
   * Obtiene invitaciones de un workspace
   */
  public async getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(this.db, this.collectionName);
      const invitationsQuery = query(
        invitationsRef,
        where('workspaceId', '==', workspaceId),
        where('projectId', '==', null)
      );

      const snapshot = await getDocs(invitationsQuery);
      const invitations = snapshot.docs.map((inviteDoc) => {
        const data = inviteDoc.data() as InvitationDoc;
        return {
          id: inviteDoc.id,
          workspaceId: data.workspaceId || '',
          projectId: data.projectId || null,
          email: data.email || '',
          invitedBy: data.invitedBy || '',
          role: normalizeInviteRole(data.role),
          status: (data.status as InvitationStatus) || 'pending',
          sentAt: data.sentAt?.toDate() || new Date(0),
          inviteeId: data.inviteeId || undefined,
        };
      });

      invitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      return invitations;
    } catch (error: any) {
      console.error('Error al obtener invitaciones de workspace:', error);
      throw new Error(`Error al obtener invitaciones de workspace: ${error.message}`);
    }
  }

  /**
   * Obtiene invitaciones para un usuario por email o UID
   */
  public async getInvitationsForUser({ email, userId }: InvitationLookup): Promise<Invitation[]> {
    try {
      const invitationsRef = collection(this.db, this.collectionName);
      const snapshots = [] as Array<Awaited<ReturnType<typeof getDocs>>>;

      const normalizedEmail = email?.trim().toLowerCase();
      if (normalizedEmail) {
        const emailQuery = query(invitationsRef, where('email', '==', normalizedEmail));
        snapshots.push(await getDocs(emailQuery));
      }

      if (userId) {
        const uidQuery = query(invitationsRef, where('inviteeId', '==', userId));
        snapshots.push(await getDocs(uidQuery));
      }

      const inviteMap = new Map<string, Invitation>();
      snapshots.forEach((snapshot) => {
        snapshot.forEach((inviteDoc) => {
          const data = inviteDoc.data() as InvitationDoc;
          inviteMap.set(inviteDoc.id, {
            id: inviteDoc.id,
            workspaceId: data.workspaceId || '',
            projectId: data.projectId || null,
            email: data.email || '',
            invitedBy: data.invitedBy || '',
            role: normalizeInviteRole(data.role),
            status: (data.status as InvitationStatus) || 'pending',
            sentAt: data.sentAt?.toDate() || new Date(0),
            inviteeId: data.inviteeId || undefined,
          });
        });
      });

      const invitations = Array.from(inviteMap.values());
      invitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      return invitations;
    } catch (error: any) {
      console.error('Error al obtener invitaciones de usuario:', error);
      throw new Error(`Error al obtener invitaciones de usuario: ${error.message}`);
    }
  }

  /**
   * Se suscribe a invitaciones para un usuario por email o UID
   */
  public subscribeToInvitationsForUser(
    { email, userId }: InvitationLookup,
    onNext: (invitations: Invitation[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const invitationsRef = collection(this.db, this.collectionName);
    const unsubscribes: Array<() => void> = [];
    const snapshots: Array<Map<string, Invitation>> = [];

    const normalizedEmail = email?.trim().toLowerCase();

    const emit = () => {
      const inviteMap = new Map<string, Invitation>();
      snapshots.forEach((snapshot) => {
        snapshot.forEach((invite, id) => {
          inviteMap.set(id, invite);
        });
      });

      const invitations = Array.from(inviteMap.values());
      invitations.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      onNext(invitations);
    };

    const attachSnapshot = (q: ReturnType<typeof query>, index: number) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const inviteMap = new Map<string, Invitation>();
          snapshot.forEach((inviteDoc) => {
            const data = inviteDoc.data() as InvitationDoc;
            inviteMap.set(inviteDoc.id, {
              id: inviteDoc.id,
              workspaceId: data.workspaceId || '',
              projectId: data.projectId || null,
              email: data.email || '',
              invitedBy: data.invitedBy || '',
              role: normalizeInviteRole(data.role),
              status: (data.status as InvitationStatus) || 'pending',
              sentAt: data.sentAt?.toDate() || new Date(0),
              inviteeId: data.inviteeId || undefined,
            });
          });

          snapshots[index] = inviteMap;
          emit();
        },
        (error) => {
          console.error('Error en suscripcion de invitaciones:', error);
          onError?.(error as Error);
        }
      );

      unsubscribes.push(unsubscribe);
    };

    if (normalizedEmail) {
      const emailQuery = query(invitationsRef, where('email', '==', normalizedEmail));
      attachSnapshot(emailQuery, snapshots.length);
    }

    if (userId) {
      const uidQuery = query(invitationsRef, where('inviteeId', '==', userId));
      attachSnapshot(uidQuery, snapshots.length);
    }

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }

  /**
   * Acepta una invitacion y agrega el miembro al proyecto
   */
  public async acceptInvitation(inviteId: string, userId: string): Promise<void> {
    try {
      const inviteRef = doc(this.db, this.collectionName, inviteId);
      const inviteSnapshot = await getDoc(inviteRef);

      if (!inviteSnapshot.exists()) {
        throw new Error('Invitation not found');
      }

      const inviteData = inviteSnapshot.data();
      if (inviteData.status !== 'pending') {
        throw new Error('Invitation is no longer pending');
      }

      const normalizedRole = normalizeProjectRole(inviteData.role, { allowOwner: false });

      if (inviteData.projectId) {
        const projectRef = doc(this.db, 'projects', inviteData.projectId);
        await updateDoc(projectRef, {
          members: arrayUnion(userId),
          [`userRoles.${userId}`]: normalizedRole,
        });
      } else if (inviteData.workspaceId) {
        const workspaceRef = doc(this.db, 'workspaces', inviteData.workspaceId);
        await updateDoc(workspaceRef, {
          members: arrayUnion(userId),
          [`userRoles.${userId}`]: normalizedRole,
        });
      }

      await updateDoc(inviteRef, {
        status: 'accepted',
        inviteeId: userId,
      });
    } catch (error: any) {
      console.error('Error al aceptar invitacion:', error);
      throw new Error(`Error al aceptar invitacion: ${error.message}`);
    }
  }

  /**
   * Rechaza una invitacion
   */
  public async declineInvitation(inviteId: string): Promise<void> {
    try {
      const inviteRef = doc(this.db, this.collectionName, inviteId);
      await updateDoc(inviteRef, {
        status: 'declined',
      });
    } catch (error: any) {
      console.error('Error al rechazar invitacion:', error);
      throw new Error(`Error al rechazar invitacion: ${error.message}`);
    }
  }

  /**
   * Revoca una invitacion pendiente
   */
  public async revokeInvitation(inviteId: string): Promise<void> {
    try {
      const inviteRef = doc(this.db, this.collectionName, inviteId);
      await deleteDoc(inviteRef);
    } catch (error: any) {
      console.error('Error al revocar invitacion:', error);
      throw new Error(`Error al revocar invitacion: ${error.message}`);
    }
  }
}
