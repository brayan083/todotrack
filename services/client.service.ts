/**
 * ClientService - Servicio de gestión de clientes
 * Maneja todas las operaciones de clientes
 */

import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';

export interface Client {
  id: string;
  name: string;
  contactEmail?: string;
  ownerId: string;
}

export class ClientService extends BaseService {
  private static instance: ClientService;

  private constructor(db: any) {
    super(db, 'clients');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: any): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService(db);
    }
    return ClientService.instance;
  }

  /**
   * Obtiene todos los clientes
   */
  public async getAllClients(): Promise<Client[]> {
    try {
      const clientsRef = collection(this.db, this.collectionName);
      const querySnapshot = await getDocs(clientsRef);
      const clients: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clients.push({
          id: doc.id,
          name: data.name,
          contactEmail: data.contactEmail,
          ownerId: data.ownerId,
        });
      });
      
      return clients;
    } catch (error: any) {
      console.error('Error al obtener clientes:', error);
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }

  /**
   * Crea un nuevo cliente
   * @param data - Datos del cliente
   */
  public async createClient(data: Omit<Client, 'id'>): Promise<string> {
    try {
      const clientsRef = collection(this.db, this.collectionName);
      const docRef = await addDoc(clientsRef, data);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear cliente:', error);
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  }

  /**
   * Obtiene los clientes de un usuario como Observable
   * @param userId - ID del usuario propietario
   */
  public getClientsByOwner(userId: string): Observable<Client[]> {
    return new Observable((observer) => {
      const clientsRef = collection(this.db, this.collectionName);
      const q = query(clientsRef, where('ownerId', '==', userId));
      
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const clients: Client[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            clients.push({
              id: doc.id,
              name: data.name,
              contactEmail: data.contactEmail,
              ownerId: data.ownerId,
            });
          });
          observer.next(clients);
        },
        (error) => {
          console.error('Error en Observable de clientes:', error);
          observer.error(error);
        }
      );
      
      // Retorna la función de limpieza
      return () => unsubscribe();
    });
  }

  /**
   * Actualiza un cliente existente
   * @param clientId - ID del cliente
   * @param updates - Datos a actualizar
   */
  public async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    try {
      const clientRef = doc(this.db, this.collectionName, clientId);
      
      // Eliminar el ID si viene en los updates
      const { id, ...updateData } = updates as any;
      
      await updateDoc(clientRef, updateData);
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error);
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

  /**
   * Elimina un cliente
   * @param clientId - ID del cliente
   */
  public async deleteClient(clientId: string): Promise<void> {
    try {
      const clientRef = doc(this.db, this.collectionName, clientId);
      await deleteDoc(clientRef);
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error);
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }
  }
}
