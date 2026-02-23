/**
 * Ejemplo de integración de stores y hooks
 * Este archivo muestra cómo usar los stores en componentes reales
 */

'use client';

import { useAuth, useTimer, useProjects, useTasks, useFormattedTime } from '@/hooks';
import type { Task } from '@/services/task.service';
import { useEffect } from 'react';

/**
 * Ejemplo 1: Componente de Login
 */
export function LoginExample() {
  const { isAuthenticated, loading, error, login, loginWithGoogle } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      // Redireccionar después del login exitoso
      window.location.href = '/app/dashboard';
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (isAuthenticated) {
    return <div>Ya estás autenticado</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Iniciar Sesión
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={loginWithGoogle}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}

/**
 * Ejemplo 2: Widget de Temporizador Flotante
 */
export function TimerWidget() {
  const { activeEntry, elapsedSeconds, isRunning, startTimer, stopTimer } = useTimer();
  const formattedTime = useFormattedTime(elapsedSeconds);
  const { tasks } = useTasks();
  const { projects } = useProjects();

  // Encontrar la tarea asociada al timer activo
  const activeTask = activeEntry ? tasks.find(t => t.id === activeEntry.taskId) : null;

  const handleStart = async () => {
    // En un caso real, deberias seleccionar el proyecto y la tarea desde un modal
    const projectId = projects[0]?.id;
    const taskId = tasks.find((task) => task.projectId === projectId)?.id;
    if (!projectId) {
      return;
    }
    try {
      await startTimer({ projectId, taskId: taskId || null });
    } catch (error) {
      console.error('Error al iniciar timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
    } catch (error) {
      console.error('Error al detener timer:', error);
    }
  };

  if (!isRunning) {
    return (
      <button
        onClick={handleStart}
        className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700"
      >
        Iniciar Timer
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 min-w-[250px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Timer Activo</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      
      <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
        {formattedTime}
      </div>
      
      {activeTask && (
        <div className="text-sm text-gray-600 mb-3 truncate">
          {activeTask.title}
        </div>
      )}
      
      <button
        onClick={handleStop}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
      >
        Detener
      </button>
    </div>
  );
}

/**
 * Ejemplo 3: Lista de Proyectos
 */
export function ProjectsList() {
  const { projects, loading, error, createProject, archiveProject } = useProjects();

  const handleCreate = async () => {
    try {
      await createProject({
        workspaceId: 'default-workspace-id',
        name: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        color: '#3B82F6',
        members: ['current-user-id'],
        ownerId: 'current-user-id', // En producción, obtener del usuario actual
        isArchived: false,
        visibility: 'private',
      });
    } catch (error) {
      console.error('Error al crear proyecto:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando proyectos...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  const activeProjects = projects.filter(p => !p.isArchived);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Proyectos</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div
              className="w-full h-2 rounded-t-lg mb-3"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
            {project.description && (
              <p className="text-gray-600 text-sm mb-4">{project.description}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {project.members?.length || 0} miembros
              </span>
              <button
                onClick={() => archiveProject(project.id)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Archivar
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeProjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tienes proyectos activos. ¡Crea uno para empezar!
        </div>
      )}
    </div>
  );
}

/**
 * Ejemplo 4: Tablero Kanban Simple
 */
export function SimpleKanban() {
  const { filteredTasks, loading, updateTaskStatus, createTask } = useTasks();

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'completed');

  const handleCreateTask = async (status: Task["status"]) => {
    try {
      await createTask({
        workspaceId: 'default-workspace',
        projectId: 'default-project', // En producción, obtener del contexto
        title: 'Nueva Tarea',
        status,
        assigneeId: 'current-user-id',
        position: 0, // En producción, calcular basado en tareas existentes
        priority: 'medium',
        subtasks: [],
        attachments: [],
        isDeleted: false,
        deletedAt: null,
      });
    } catch (error) {
      console.error('Error al crear tarea:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando tareas...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Columna: Por Hacer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Por Hacer</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {todoTasks.length}
          </span>
        </div>
        <button
          onClick={() => handleCreateTask('todo')}
          className="w-full mb-3 border-2 border-dashed border-gray-300 text-gray-600 py-2 rounded-md hover:border-gray-400"
        >
          + Nueva Tarea
        </button>
        <div className="space-y-2">
          {todoTasks.map(task => (
            <div key={task.id} className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="font-medium mb-2">{task.title}</h4>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="todo">Por Hacer</option>
                <option value="in-progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Columna: En Progreso */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-blue-700">En Progreso</h3>
          <span className="bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full">
            {inProgressTasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {inProgressTasks.map(task => (
            <div key={task.id} className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="font-medium mb-2">{task.title}</h4>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="todo">Por Hacer</option>
                <option value="in-progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Columna: Completadas */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-green-700">Completadas</h3>
          <span className="bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full">
            {doneTasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {doneTasks.map(task => (
            <div key={task.id} className="bg-white p-3 rounded-md shadow-sm opacity-75">
              <h4 className="font-medium mb-2 line-through">{task.title}</h4>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="todo">Por Hacer</option>
                <option value="in-progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Ejemplo 5: Dashboard Overview
 */
export function DashboardOverview() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { isRunning, elapsedSeconds } = useTimer();
  const formattedTime = useFormattedTime(elapsedSeconds);

  const activeProjects = projects.filter(p => !p.isArchived);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Bienvenido, {user?.displayName || user?.email}
      </h1>
      <p className="text-gray-600 mb-8">
        Aquí está tu resumen de actividad
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Proyectos Activos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {activeProjects.length}
          </div>
          <div className="text-gray-600">Proyectos Activos</div>
        </div>

        {/* Card: Tareas Pendientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            {pendingTasks.length}
          </div>
          <div className="text-gray-600">Tareas Pendientes</div>
        </div>

        {/* Card: Tiempo Activo */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {isRunning ? formattedTime : '--:--:--'}
          </div>
          <div className="text-gray-600">
            {isRunning ? 'Timer Activo' : 'Sin Timer'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Proyectos Recientes</h2>
          {activeProjects.slice(0, 5).map(project => (
            <div key={project.id} className="py-2 border-b last:border-b-0">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium">{project.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tareas Próximas</h2>
          {pendingTasks.slice(0, 5).map(task => (
            <div key={task.id} className="py-2 border-b last:border-b-0">
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-gray-500">{task.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
