# Ejemplo de Integración del Sidebar con el Layout Existente

Este archivo muestra cómo integrar el nuevo sidebar con tu layout actual.

## Opción 1: Sidebar Completo (Recomendado)

Reemplaza el contenido de `app/app/layout.tsx` con:

```tsx
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [timer, setTimer] = React.useState("00:14:32");
  const [isTimerRunning, setIsTimerRunning] = React.useState(true);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simulate timer ticking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && user) {
      interval = setInterval(() => {
        setTimer(prev => {
          const parts = prev.split(':').map(Number);
          let [h, m, s] = parts;
          s++;
          if (s >= 60) { s = 0; m++; }
          if (m >= 60) { m = 0; h++; }
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6">
          <SidebarTrigger />
          
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              </div>
              <Input 
                placeholder="Search tasks, projects..." 
                className="pl-10 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-ring transition-all hover:bg-muted/80"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{timer}</span>
                <Button
                  variant={isTimerRunning ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? 'Pause' : 'Start'}
                </Button>
              </div>
            )}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

## Opción 2: Sidebar con Variante Inset (Más Moderno)

Si prefieres un sidebar con bordes redondeados y separación:

```tsx
// Mismo código que arriba, pero cambia la línea de SidebarProvider a:
<SidebarProvider defaultOpen={true}>
  <AppSidebar variant="inset" />
  <SidebarInset>
    {/* ... resto del código */}
  </SidebarInset>
</SidebarProvider>
```

## Opción 3: Sidebar que Colapsa a Iconos

Para un sidebar que se colapsa mostrando solo iconos:

```tsx
<SidebarProvider defaultOpen={true}>
  <AppSidebar collapsible="icon" />
  <SidebarInset>
    {/* ... resto del código */}
  </SidebarInset>
</SidebarProvider>
```

## Notas Importantes

1. **SidebarTrigger**: El botón `<SidebarTrigger />` ya incluye el icono y la funcionalidad para abrir/cerrar el sidebar. Reemplaza cualquier botón de menú existente.

2. **SidebarInset**: Envuelve todo tu contenido principal (header + children) dentro de `<SidebarInset>` para que se ajuste correctamente con el sidebar.

3. **Responsive**: El sidebar automáticamente se convierte en un drawer (Sheet) en móviles.

4. **Keyboard Shortcut**: Los usuarios pueden usar `Cmd+B` (Mac) o `Ctrl+B` (Windows/Linux) para abrir/cerrar el sidebar.

## Personalizar el AppSidebar

Edita `components/app-sidebar.tsx` para:

- Cambiar los items del menú
- Agregar más grupos de navegación
- Personalizar el footer con información real del usuario
- Agregar acciones personalizadas

Ejemplo para mostrar el usuario actual:

```tsx
// En components/app-sidebar.tsx
import { useAuth } from '@/hooks';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ... */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName || 'User'}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* ... menu items */}
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

## Integrar con el Store del Timer

Para integrar el timer del store de Zustand con el sidebar:

```tsx
import { useTimer } from '@/hooks';

// En el header:
const { activeTimer, elapsedTime } = useTimer();
const { user } = useAuth();

// Luego en el JSX:
{user && activeTimer && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">
      {useFormattedTime(elapsedTime)}
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={() => /* toggle timer */}
    >
      {/* ... */}
    </Button>
  </div>
)}
```
