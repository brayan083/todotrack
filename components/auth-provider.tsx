/**
 * AuthProvider - Inicializa la autenticación de Firebase en la app
 * Se ejecuta en el cliente para escuchar cambios en el estado de autenticación
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // Inicializar el listener de autenticación
    const unsubscribe = initAuth();

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      unsubscribe?.();
    };
  }, [initAuth]);

  return children;
}
