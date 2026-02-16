/**
 * ProtectedRoute - Componente que protege rutas que requieren autenticación
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // Si ya cargó la autenticación y no hay usuario, redirigir a login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mostrar loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, mostrar el contenido
  if (user) {
    return <>{children}</>;
  }

  // Por seguridad, no mostrar nada si algo sale mal
  return null;
}
