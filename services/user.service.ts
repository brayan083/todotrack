/**
 * UserService - Gestión de usuarios en Firestore
 * Maneja crear, actualizar y obtener datos de usuarios
 */

import { BaseService } from './base.service';
import { Firestore, setDoc, getDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
  provider?: string; // 'email', 'google', etc
}

export class UserService extends BaseService {
  private static instance: UserService;

  private constructor(db: Firestore) {
    super(db, 'users');
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: Firestore): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(db);
    }
    return UserService.instance;
  }

  /**
   * Guarda o actualiza un usuario en Firestore
   */
  public async saveUser(user: User, provider: string = 'email'): Promise<void> {
    try {
      const userDocRef = this.getDocRef('users', user.uid);
      
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: provider,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      // Usar setDoc con merge para no sobrescribir si ya existe
      await setDoc(userDocRef, userData, { merge: true });
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      throw new Error(`Error al guardar usuario: ${error.message}`);
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  public async getUser(uid: string): Promise<UserData | null> {
    try {
      const userDocRef = this.getDocRef('users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  /**
   * Actualiza los datos de un usuario
   */
  public async updateUser(uid: string, userData: Partial<UserData>): Promise<void> {
    try {
      const userDocRef = this.getDocRef('users', uid);
      
      await updateDoc(userDocRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  /**
   * Verifica si un usuario existe en la BD
   */
  public async userExists(uid: string): Promise<boolean> {
    try {
      const user = await this.getUser(uid);
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}
