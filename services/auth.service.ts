/**
 * AuthService - Servicio de autenticación
 * Maneja la autenticación de usuarios con Firebase Auth
 */

import { BaseService } from './base.service';
import { UserService } from './user.service';
import { 
  Auth, 
  User, 
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile
} from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.config';

export class AuthService extends BaseService {
  private static instance: AuthService;
  private userService: UserService;

  private constructor(db: Firestore) {
    super(db, 'users');
    this.userService = UserService.getInstance(db);
  }

  /**
   * Obtiene la instancia única del servicio (Singleton)
   */
  public static getInstance(db: Firestore): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(db);
    }
    return AuthService.instance;
  }

  /**
   * Obtiene la instancia de Firebase Auth
   */
  public getFirebaseAuth(): Auth {
    return auth;
  }

  /**
   * Inicia sesión con Google
   */
  public async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Guardar usuario en Firestore
      await this.userService.saveUser(result.user, 'google');
      
      return result.user;
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      throw new Error(`Error al iniciar sesión con Google: ${error.message}`);
    }
  }

  /**
   * Inicia sesión con correo y contraseña
   */
  public async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Guardar usuario en Firestore (en caso de que sea la primera vez)
      await this.userService.saveUser(userCredential.user, 'email');
      
      return userCredential;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
  }

  /**
   * Registra un nuevo usuario
   */
  public async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Si se proporciona un nombre, actualizar el perfil
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        // Refrescar el usuario para obtener los nuevos datos
        await userCredential.user.reload();
      }
      
      // Guardar usuario en Firestore
      await this.userService.saveUser(userCredential.user, 'email');
      
      return userCredential;
    } catch (error: any) {
      console.error('Error en registro:', error);
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  }

  /**
   * Cierra la sesión del usuario actual
   */
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Error en logout:', error);
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  /**
   * Obtiene el usuario actualmente autenticado
   */
  public getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Obtiene el servicio de usuarios
   */
  public getUserService(): UserService {
    return this.userService;
  }
}
