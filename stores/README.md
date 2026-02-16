# Stores y Hooks - Guía de Uso

Esta carpeta contiene los stores de Zustand y hooks personalizados para manejar el estado global de la aplicación.

## Estructura

```
stores/
├── auth.store.ts      # Estado de autenticación
├── timer.store.ts     # Cronómetro activo
├── project.store.ts   # Proyectos con sync en tiempo real
├── task.store.ts      # Tareas con filtros
└── index.ts           # Exportaciones centralizadas

hooks/
└── index.ts           # Hooks personalizados
```

## Stores Disponibles

### 1. AuthStore - Estado de Autenticación

Maneja el usuario autenticado y persiste en localStorage.

**Estado:**
- `user`: Usuario actual (User | null)
- `loading`: Estado de carga
- `error`: Mensajes de error

**Acciones:**
- `login(email, password)`: Login con email/password
- `loginWithGoogle()`: Login con Google
- `register(email, password, displayName?)`: Registro
- `logout()`: Cerrar sesión
- `initAuth()`: Inicializa el listener de auth

### 2. TimerStore - Cronómetro Activo

Maneja el temporizador que se muestra globalmente en la app.

**Estado:**
- `activeEntry`: Entrada de tiempo activa
- `elapsedSeconds`: Segundos transcurridos
- `isRunning`: Si está corriendo
- `taskId`: ID de la tarea asociada

**Acciones:**
- `startTimer(userId, taskId)`: Inicia temporizador
- `stopTimer()`: Detiene temporizador
- `loadActiveTimer(userId)`: Carga el temporizador activo
- `clearTimer()`: Limpia el estado

### 3. ProjectStore - Proyectos

Maneja proyectos con suscripción en tiempo real usando RxJS.

**Estado:**
- `projects`: Lista de proyectos
- `selectedProject`: Proyecto seleccionado
- `loading`: Estado de carga
- `error`: Mensajes de error

**Acciones:**
- `subscribeToProjects(userId)`: Se suscribe a cambios en tiempo real
- `unsubscribe()`: Cancela suscripción
- `createProject(data)`: Crea proyecto
- `updateProject(id, updates)`: Actualiza proyecto
- `archiveProject(id)`: Archiva proyecto
- `deleteProject(id)`: Elimina proyecto
- `getProjectById(id)`: Busca proyecto por ID

### 4. TaskStore - Tareas

Maneja tareas con sistema de filtros.

**Estado:**
- `tasks`: Todas las tareas
- `filteredTasks`: Tareas después de aplicar filtros
- `selectedTask`: Tarea seleccionada
- `filterStatus`: Filtro por estado
- `filterProjectId`: Filtro por proyecto

**Acciones:**
- `loadTasks(userId, projectId?)`: Carga tareas
- `createTask(data)`: Crea tarea
- `updateTask(id, updates)`: Actualiza tarea
- `updateTaskStatus(id, status)`: Cambia estado
- `deleteTask(id)`: Elimina tarea
- `setFilterStatus(status)`: Aplica filtro por estado
- `setFilterProjectId(id)`: Aplica filtro por proyecto
- `getTasksByProject(id)`: Obtiene tareas de un proyecto
- `getTasksByStatus(status)`: Obtiene tareas por estado

## Hooks Personalizados

### useAuth()

Hook principal para autenticación. Incluye el estado y todas las acciones.

```typescript
'use client';

import { useAuth } from '@/hooks';

export default function LoginPage() {
  const { user, loading, error, isAuthenticated, login, loginWithGoogle, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Bienvenido, {user?.email}</p>
          <button onClick={logout}>Cerrar Sesión</button>
        </>
      ) : (
        <>
          <button onClick={handleLogin}>Iniciar Sesión</button>
          <button onClick={loginWithGoogle}>Login con Google</button>
        </>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### useAuthInit()

Inicializa el listener de autenticación. **Llamar una vez en el layout raíz**.

```typescript
'use client';

import { useAuthInit } from '@/hooks';

export default function RootLayout({ children }) {
  useAuthInit(); // Inicializa auth listener

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### useTimer()

Hook para el temporizador activo. Carga automáticamente el timer del usuario.

```typescript
'use client';

import { useTimer, useFormattedTime } from '@/hooks';

export default function TimerWidget() {
  const { activeEntry, elapsedSeconds, isRunning, startTimer, stopTimer } = useTimer();
  const formattedTime = useFormattedTime(elapsedSeconds);

  const handleStart = async () => {
    try {
      await startTimer('task-id-123');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded-lg">
      <div className="text-2xl font-mono">{formattedTime}</div>
      {isRunning ? (
        <button onClick={handleStop}>Detener</button>
      ) : (
        <button onClick={handleStart}>Iniciar</button>
      )}
    </div>
  );
}
```

### useProjects()

Hook para proyectos con sincronización en tiempo real. Automáticamente se suscribe/desuscribe.

```typescript
'use client';

import { useProjects } from '@/hooks';

export default function ProjectsList() {
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    archiveProject 
  } = useProjects();

  const handleCreate = async () => {
    try {
      await createProject({
        name: 'Nuevo Proyecto',
        description: 'Descripción',
        color: '#3B82F6',
        members: [],
        isArchived: false,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Cargando proyectos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Crear Proyecto</button>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <span>{project.name}</span>
            <button onClick={() => archiveProject(project.id)}>
              Archivar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useTasks(projectId?)

Hook para tareas con filtros. Opcionalmente filtra por proyecto.

```typescript
'use client';

import { useTasks } from '@/hooks';

export default function TasksKanban() {
  const { 
    filteredTasks, 
    loading, 
    setFilterStatus, 
    updateTaskStatus,
    createTask 
  } = useTasks();

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const handleCreateTask = async () => {
    try {
      await createTask({
        projectId: 'project-id',
        title: 'Nueva Tarea',
        status: 'todo',
        assignedId: 'user-id',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Cargando tareas...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h3>Por Hacer</h3>
        {todoTasks.map(task => (
          <div key={task.id}>{task.title}</div>
        ))}
      </div>
      <div>
        <h3>En Progreso</h3>
        {inProgressTasks.map(task => (
          <div key={task.id}>{task.title}</div>
        ))}
      </div>
      <div>
        <h3>Completadas</h3>
        {doneTasks.map(task => (
          <div key={task.id}>{task.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## Uso Directo de Stores (sin hooks)

Si necesitas acceder a los stores directamente en componentes o funciones:

```typescript
import { useAuthStore, useTimerStore } from '@/stores';

// En un componente
function MyComponent() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  
  // ...
}

// En una función normal (fuera de componentes)
const user = useAuthStore.getState().user;
const projects = useProjectStore.getState().projects;
```

## Características

✅ **Persistencia**: AuthStore se persiste en localStorage  
✅ **Tiempo Real**: ProjectStore usa RxJS para sincronización  
✅ **Filtros**: TaskStore incluye sistema de filtros  
✅ **Timer Global**: TimerStore visible en toda la app  
✅ **TypeScript**: Totalmente tipado  
✅ **Optimizado**: Zustand es muy ligero y rápido  
✅ **Auto-limpieza**: Los hooks se limpian automáticamente  

## Próximos Pasos

1. **Integrar en páginas**: Usar los hooks en tus páginas
2. **Proteger rutas**: Middleware para verificar autenticación
3. **UI Components**: Crear componentes que usen estos hooks
4. **Error Handling**: Implementar manejo de errores global

## Ejemplo Completo: Layout con Auth

```typescript
'use client';

import { useAuthInit, useAuth, useTimer, useFormattedTime } from '@/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }) {
  useAuthInit();
  const { user, isAuthenticated, logout } = useAuth();
  const { elapsedSeconds, isRunning } = useTimer();
  const formattedTime = useFormattedTime(elapsedSeconds);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <Link href="/app/dashboard">Dashboard</Link>
            <Link href="/app/kanban">Kanban</Link>
            <Link href="/app/timesheet">Timesheet</Link>
          </div>
          
          {isRunning && (
            <div className="bg-green-600 px-4 py-2 rounded">
              Timer: {formattedTime}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <button onClick={logout}>Salir</button>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```
