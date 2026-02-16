/**
 * AuthStore - Store de autenticación global
 * Maneja el estado del usuario autenticado en toda la aplicación
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { AuthService } from '@/services';
import { db, auth } from '@/lib/firebase.config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user, error: null }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      /**
       * Inicializa el listener de autenticación
       */
      initAuth: () => {
        set({ loading: true });
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
          set({ user, loading: false });
        });

        // Retorna la función de limpieza
        return unsubscribe;
      },

      /**
       * Inicia sesión con email y contraseña
       */
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          const authService = AuthService.getInstance(db);
          const userCredential = await authService.login(email, password);
          set({ user: userCredential.user, loading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al iniciar sesión', 
            loading: false 
          });
          throw error;
        }
      },

      /**
       * Inicia sesión con Google
       */
      loginWithGoogle: async () => {
        try {
          set({ loading: true, error: null });
          const authService = AuthService.getInstance(db);
          const user = await authService.loginWithGoogle();
          set({ user, loading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al iniciar sesión con Google', 
            loading: false 
          });
          throw error;
        }
      },

      /**
       * Registra un nuevo usuario
       */
      register: async (email: string, password: string, displayName?: string) => {
        try {
          set({ loading: true, error: null });
          const authService = AuthService.getInstance(db);
          const userCredential = await authService.register(email, password, displayName);
          set({ user: userCredential.user, loading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al registrar usuario', 
            loading: false 
          });
          throw error;
        }
      },

      /**
       * Cierra sesión
       */
      logout: async () => {
        try {
          set({ loading: true, error: null });
          const authService = AuthService.getInstance(db);
          await authService.logout();
          set({ user: null, loading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al cerrar sesión', 
            loading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistir el estado del usuario, no las funciones
      partialize: (state) => ({ 
        user: state.user ? {
          uid: state.user.uid,
          email: state.user.email,
          displayName: state.user.displayName,
          photoURL: state.user.photoURL,
        } : null 
      }),
    }
  )
);
