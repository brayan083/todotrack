"use client";
import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, MoreHorizontal, Edit, Play, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectService, type Project } from '@/services/project.service';
import { UserService, type UserData } from '@/services/user.service';
import { TaskService, type Task } from '@/services/task.service';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { db } from '@/lib/firebase.config';
import { useAuthStore } from '@/stores';

interface KanbanPageProps {
  params: Promise<{
    id: string;
  }>;
}

const STATUSES = {
  'todo': { label: 'To Do', color: 'bg-slate-400' },
  'in-progress': { label: 'In Progress', color: 'bg-orange-400' },
  'done': { label: 'Done', color: 'bg-green-500' },
};

const PRIORITY_BADGES: Record<string, string> = {
  'low': 'bg-blue-100 text-blue-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800',
  'urgent': 'bg-red-100 text-red-800',
};

const ProjectKanbanPage: React.FC<KanbanPageProps> = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<{ uid: string; label: string; photoURL?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !resolvedParams.id) return;

      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const taskService = TaskService.getInstance(db);
        const userService = UserService.getInstance(db);
        
        // Load project
        const foundProject = await projectService.getProject(resolvedParams.id);
        
        if (!foundProject) {
          router.push('/app/project');
          return;
        }
        
        setProject(foundProject);

        const memberIds = (foundProject.members || []).filter(Boolean);
        if (memberIds.length > 0) {
          const users = await Promise.all(memberIds.map((memberId) => userService.getUser(memberId)));
          const mapped = users
            .filter((userData): userData is UserData => Boolean(userData))
            .map((userData) => ({
              uid: userData.uid,
              label: userData.displayName || userData.email || userData.uid.slice(0, 8),
              photoURL: userData.photoURL,
            }));
          setAssignees(mapped);
        } else {
          setAssignees([]);
        }

        // Load tasks for this project
        const projectTasks = await taskService.getAllTasks(user.uid, resolvedParams.id);
        setTasks(projectTasks);
      } catch (error) {
        console.error('Error loading project:', error);
        router.push('/app/project');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, resolvedParams.id, router]);

  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const taskService = TaskService.getInstance(db);
      await taskService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push('/app/project')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board Toolbar */}
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/app/project')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: project.color || '#3b82f6' }}
            />
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className="text-sm text-muted-foreground">({tasks.length} tasks)</span>
          </div>
          <div className="flex -space-x-2">
            {project.members && project.members.slice(0, 3).map((member, idx) => (
              <Avatar key={idx} className="w-8 h-8 border-2 border-background">
                <AvatarFallback>{member.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
            {project.members && project.members.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary text-xs font-medium flex items-center justify-center text-muted-foreground">
                +{project.members.length - 3}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9 w-full sm:w-64" 
              placeholder="Search tasks..." 
            />
          </div>
          {user && (
            <CreateTaskDialog 
              projectId={resolvedParams.id}
              userId={user.uid}
              assignees={assignees}
              onTaskCreated={handleTaskCreated}
            />
          )}
        </div>
      </div>

      {/* Kanban Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6 pt-6">
        <div className="flex h-full gap-6 min-w-[1000px]">
          
          {/* Column: To Do */}
          <div className="flex flex-col w-80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUSES['todo'].color}`}></div>
                {STATUSES['todo'].label}
                <Badge variant="secondary" className="ml-auto">
                  {getTasksByStatus('todo').length}
                </Badge>
              </h2>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {getTasksByStatus('todo').map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="flex flex-col w-80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUSES['in-progress'].color}`}></div>
                {STATUSES['in-progress'].label}
                <Badge variant="secondary" className="ml-auto">
                  {getTasksByStatus('in-progress').length}
                </Badge>
              </h2>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {getTasksByStatus('in-progress').map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksByStatus('in-progress').length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                  Drag tasks here to start
                </div>
              )}
            </div>
          </div>

          {/* Column: Done */}
          <div className="flex flex-col w-80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STATUSES['done'].color}`}></div>
                {STATUSES['done'].label}
                <Badge variant="secondary" className="ml-auto">
                  {getTasksByStatus('done').length}
                </Badge>
              </h2>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {getTasksByStatus('done').map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TaskCard - Component para mostrar una tarea
 */
const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const getPriorityColor = (priority: string) => PRIORITY_BADGES[priority] || PRIORITY_BADGES['medium'];

  return (
    <Card className="cursor-move hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
          <Play className="h-3 w-3 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {task.assignedId.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">ID: {task.id.slice(0, 8)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectKanbanPage;
