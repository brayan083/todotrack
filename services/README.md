# Servicios - Guía de Uso

Esta carpeta contiene todos los servicios de la aplicación que interactúan con Firebase Auth y Firestore.

## Estructura de Servicios

```
services/
├── base.service.ts       # Clase base con métodos comunes
├── auth.service.ts       # Autenticación de usuarios
├── task.service.ts       # Gestión de tareas
├── time.service.ts       # Temporizadores y registro de tiempo
├── project.service.ts    # Gestión de proyectos
├── client.service.ts     # Gestión de clientes
└── index.ts             # Exportaciones centralizadas
```

## Patrón de Diseño

Todos los servicios siguen el **patrón Singleton** para garantizar una única instancia en toda la aplicación.

## Uso de los Servicios

### 1. AuthService

```typescript
import { AuthService } from '@/services';
import { db } from '@/lib/firebase.config';

const authService = AuthService.getInstance(db);

// Login con email/password
try {
  const userCredential = await authService.login('user@example.com', 'password123');
  console.log('Usuario logueado:', userCredential.user);
} catch (error) {
  console.error('Error:', error);
}

// Login con Google
try {
  const user = await authService.loginWithGoogle();
  console.log('Usuario logueado con Google:', user);
} catch (error) {
  console.error('Error:', error);
}

// Registro de nuevo usuario
try {
  const userCredential = await authService.register(
    'newuser@example.com',
    'password123',
    'Nombre Usuario'
  );
  console.log('Usuario registrado:', userCredential.user);
} catch (error) {
  console.error('Error:', error);
}

// Obtener usuario actual
const currentUser = authService.getCurrentUser();
console.log('Usuario actual:', currentUser);

// Cerrar sesión
await authService.logout();
```

### 2. ProjectService

```typescript
import { ProjectService } from '@/services';
import { db } from '@/lib/firebase.config';

const projectService = ProjectService.getInstance(db);

// Crear un nuevo proyecto
const projectId = await projectService.createProject({
  name: 'Mi Proyecto',
  description: 'Descripción del proyecto',
  color: '#3B82F6',
  members: ['userId1', 'userId2'],
  isArchived: false,
  budget: 5000,
});

// Obtener todos los proyectos de un usuario
const projects = await projectService.getAllProjects('userId');
console.log('Proyectos:', projects);

// Obtener proyectos en tiempo real (Observable)
const subscription = projectService.getProjectsByUser('userId').subscribe({
  next: (projects) => {
    console.log('Proyectos actualizados:', projects);
  },
  error: (error) => {
    console.error('Error:', error);
  }
});

// Actualizar un proyecto
await projectService.updateProject('projectId', {
  name: 'Nuevo nombre',
  budget: 7000,
});

// Archivar un proyecto
await projectService.archiveProject('projectId');

// Eliminar un proyecto
await projectService.deleteProject('projectId');

// No olvides desuscribirte cuando termines
subscription.unsubscribe();
```

### 3. TaskService

```typescript
import { TaskService } from '@/services';
import { db } from '@/lib/firebase.config';

const taskService = TaskService.getInstance(db);

// Crear una nueva tarea
const taskId = await taskService.createTask({
  projectId: 'projectId',
  title: 'Implementar feature',
  description: 'Descripción detallada',
  status: 'todo',
  assignedId: 'userId',
  priority: 'high',
  attachments: [],
});

// Obtener todas las tareas de un usuario
const tasks = await taskService.getAllTasks('userId');

// Obtener tareas filtradas por proyecto
const projectTasks = await taskService.getAllTasks('userId', 'projectId');

// Actualizar una tarea
await taskService.updateTask('taskId', {
  title: 'Nuevo título',
  status: 'in-progress',
  priority: 'medium',
});

// Actualizar solo el estado
await taskService.updateTaskStatus('taskId', 'done');

// Agregar un comentario a una tarea
await taskService.addComment('taskId', {
  userId: 'userId',
  content: 'Este es un comentario',
});

// Eliminar una tarea
await taskService.deleteTask('taskId');
```

### 4. TimeService

```typescript
import { TimeService } from '@/services';
import { db } from '@/lib/firebase.config';

const timeService = TimeService.getInstance(db);

// Iniciar un temporizador
const entryId = await timeService.startTimer('userId', 'taskId');
console.log('Temporizador iniciado:', entryId);

// Detener un temporizador
await timeService.stopTimer(entryId);

// Obtener todas las entradas de tiempo de un usuario
const entries = await timeService.getTimerEntries('userId');
console.log('Entradas de tiempo:', entries);

// Crear una entrada de tiempo manual
const manualEntryId = await timeService.createManualEntry({
  userId: 'userId',
  taskId: 'taskId',
  startTime: new Date('2024-01-15T09:00:00'),
  endTime: new Date('2024-01-15T17:00:00'),
  isEdited: false,
});

// Editar una entrada de tiempo
await timeService.editTimeEntry(entryId, {
  startTime: new Date('2024-01-15T08:00:00'),
  endTime: new Date('2024-01-15T16:00:00'),
});
```

### 5. ClientService

```typescript
import { ClientService } from '@/services';
import { db } from '@/lib/firebase.config';

const clientService = ClientService.getInstance(db);

// Crear un nuevo cliente
const clientId = await clientService.createClient({
  name: 'Acme Corp',
  contactEmail: 'contact@acme.com',
  ownerId: 'userId',
});

// Obtener todos los clientes
const clients = await clientService.getAllClients();

// Obtener clientes en tiempo real (Observable)
const subscription = clientService.getClientsByOwner('userId').subscribe({
  next: (clients) => {
    console.log('Clientes actualizados:', clients);
  },
  error: (error) => {
    console.error('Error:', error);
  }
});

// Actualizar un cliente
await clientService.updateClient('clientId', {
  name: 'Acme Corporation',
  contactEmail: 'newcontact@acme.com',
});

// Eliminar un cliente
await clientService.deleteClient('clientId');

// Desuscribirse
subscription.unsubscribe();
```

## Uso en Componentes de React

### Ejemplo con useEffect para autenticación

```typescript
'use client';

import { useEffect, useState } from 'react';
import { AuthService } from '@/services';
import { db } from '@/lib/firebase.config';
import { User } from 'firebase/auth';

export default function MyComponent() {
  const [user, setUser] = useState<User | null>(null);
  const authService = AuthService.getInstance(db);

  useEffect(() => {
    // Obtener usuario actual al montar
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Escuchar cambios de autenticación
    const auth = authService.getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await authService.login('user@example.com', 'password');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <p>Bienvenido, {user.email}</p>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

### Ejemplo con Observables (RxJS)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ProjectService, Project } from '@/services';
import { db } from '@/lib/firebase.config';

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const projectService = ProjectService.getInstance(db);

  useEffect(() => {
    const userId = 'current-user-id'; // Obtener del contexto de autenticación
    
    // Suscribirse a cambios en tiempo real
    const subscription = projectService.getProjectsByUser(userId).subscribe({
      next: (projects) => {
        setProjects(projects);
      },
      error: (error) => {
        console.error('Error al obtener proyectos:', error);
      }
    });

    // Limpiar la suscripción al desmontar
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <h2>Mis Proyectos</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Tipos e Interfaces

Todas las interfaces están exportadas desde los servicios correspondientes:

```typescript
import { 
  Task, 
  Comment, 
  Attachment,
  TimeEntry,
  Project,
  Client 
} from '@/services';
```

## Manejo de Errores

Todos los servicios lanzan errores descriptivos que puedes capturar:

```typescript
try {
  await taskService.createTask(taskData);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Mostrar mensaje al usuario
  }
}
```

## Próximos Pasos

1. **Configurar Firebase** - Sigue las instrucciones en `FIREBASE_SETUP.md`
2. **Crear Stores con Zustand** - Para estado global (usuario, temporizador activo, etc.)
3. **Integrar en componentes** - Usar los servicios en tus páginas y componentes de React
4. **Implementar protección de rutas** - Verificar autenticación antes de acceder a páginas privadas

## Notas Importantes

- Los servicios usan el **patrón Singleton** - siempre usa `getInstance(db)`
- Recuerda **desuscribirte de Observables** cuando los componentes se desmonten
- Todos los métodos son **asíncronos** excepto `getCurrentUser()`
- Los errores se propagan - usa **try/catch** para manejarlos
