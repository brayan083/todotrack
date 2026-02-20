/**
 * UserService - Gestión de usuarios en Firestore
 * Maneja crear, actualizar y obtener datos de usuarios
 */

import { BaseService } from './base.service';
import { Firestore, setDoc, getDoc, updateDoc, doc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getUserLocationDefaults } from '@/lib/geolocation';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  photoStoragePath?: string;
  timezone: string;
  currency: string;
  locale: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 'monday' | 'sunday';
  createdAt: any;
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
   * Asegura que todos los campos requeridos se creen, aunque estén vacíos
   * Detecta automáticamente timezone y currency del usuario
   */
  public async saveUser(user: User, provider: string = 'email'): Promise<void> {
    try {
      const userDocRef = this.getDocRef('users', user.uid);
      
      // Obtener el usuario existente para verificar si es la primera vez
      const existingUser = await getDoc(userDocRef);
      const existingData = existingUser.exists() ? existingUser.data() : null;
      
      // Obtener ubicación por defecto solo en la primera creación
      const defaults = getUserLocationDefaults();
      const locale = (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
        } catch (error) {
          return 'en-US';
        }
      })();
      const timeFormat = (() => {
        try {
          const hourCycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
          return hourCycle && (hourCycle === 'h23' || hourCycle === 'h24') ? '24h' : '12h';
        } catch (error) {
          return '24h';
        }
      })();
      
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        photoStoragePath: existingData?.photoStoragePath || '',
        timezone: existingData?.timezone || defaults.timezone,
        currency: existingData?.currency || defaults.currency,
        locale: existingData?.locale || locale,
        timeFormat: existingData?.timeFormat || timeFormat,
        weekStartsOn: existingData?.weekStartsOn || 'monday',
        createdAt: existingData?.createdAt || serverTimestamp(),
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
      
      await updateDoc(userDocRef, userData);
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

  /**
   * Busca un usuario por email
   */
  public async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const usersRef = collection(this.db, this.collectionName);
      const usersQuery = query(usersRef, where('email', '==', normalizedEmail));
      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as UserData;
    } catch (error: any) {
      console.error('Error al buscar usuario por email:', error);
      throw new Error(`Error al buscar usuario por email: ${error.message}`);
    }
  }
}
