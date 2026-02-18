"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive, MoreHorizontal, FolderOpen, DollarSign, Clock, User2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { useAuthStore } from '@/stores';
import { ProjectService, type Project } from '@/services/project.service';
import { UserService, type UserData } from '@/services/user.service';
import { db } from '@/lib/firebase.config';

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [usersMap, setUsersMap] = useState<Record<string, UserData>>({});

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const userProjects = await projectService.getAllProjects(user.uid);
        setProjects(userProjects);

        // Obtener todos los UIDs únicos de miembros
        const uniqueUserIds = new Set<string>();
        userProjects.forEach(project => {
          project.members?.forEach(memberId => uniqueUserIds.add(memberId));
        });

        // Cargar información de usuarios
        const userService = UserService.getInstance(db);
        const usersData: Record<string, UserData> = {};
        
        await Promise.all(
          Array.from(uniqueUserIds).map(async (userId) => {
            try {
              const userData = await userService.getUser(userId);
              if (userData) {
                usersData[userId] = userData;
              }
            } catch (error) {
              console.error(`Error loading user ${userId}:`, error);
            }
          })
        );
        
        setUsersMap(usersData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSharedProject = (project: Project) => Boolean(user && project.ownerId !== user.uid);

  const handleProjectClick = (projectId: string) => {
    router.push(`/app/project/${projectId}`);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([...projects, newProject]);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Breadcrumb */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="px-6 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {user && (
              <CreateProjectDialog
                userId={user.uid}
                onProjectCreated={handleProjectCreated}
              />
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Projects Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              {projects.length === 0
                ? 'Create your first project to get started'
                : 'No projects match your search'}
            </p>
            {projects.length === 0 && user && (
              <CreateProjectDialog
                userId={user.uid}
                onProjectCreated={handleProjectCreated}
              />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const sharedProject = isSharedProject(project);
              return (
                <Card
                  key={project.id}
                  className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/50 ${sharedProject ? 'bg-amber-50/40 border-amber-200/60' : ''}`}
                  onClick={() => handleProjectClick(project.id)}
                >
                  {/* Color Bar */}
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: sharedProject ? '#f59e0b' : (project.color || '#3b82f6') }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate group-hover:text-primary transition-colors text-lg">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}
                      </div>
                      {sharedProject && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                          Shared
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                  {/* Client Info */}
                  {project.clientName && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                        <User2 className="h-3.5 w-3.5" />
                        <span className="font-medium">{project.clientName}</span>
                      </div>
                    </div>
                  )}

                  {/* Financial Info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {project.budget !== null && project.budget !== undefined && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <div className="flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md px-2 py-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="font-semibold">${project.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {project.hourlyRate !== null && project.hourlyRate !== undefined && (
                      <div className="flex items-center gap-1 text-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md px-2 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-semibold">${project.hourlyRate}/h</span>
                      </div>
                    )}
                  </div>

                  {/* Estimated Time */}
                  {project.estimatedTime && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Est: {project.estimatedTime}</span>
                    </div>
                  )}

                  {/* Team Members */}
                  {project.members && project.members.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 4).map((memberId, idx) => {
                          const memberData = usersMap[memberId];
                          return (
                            <Avatar key={idx} className="w-7 h-7 border-2 border-background" title={memberData?.displayName || memberData?.email || 'Unknown'}>
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {memberData?.displayName?.[0]?.toUpperCase() || 
                                 memberData?.email?.[0]?.toUpperCase() || 
                                 'U'}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                      {project.members.length > 4 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          +{project.members.length - 4} more
                        </span>
                      )}
                      {project.isArchived && (
                        <Badge variant="outline" className="gap-1 ml-auto">
                          <Archive className="h-3 w-3" />
                          Archived
                        </Badge>
                      )}
                    </div>
                  )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Estimated Time</TableHead>
                  <TableHead className="w-[180px]">Members</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const sharedProject = isSharedProject(project);
                  return (
                  <TableRow
                    key={project.id}
                    className={`cursor-pointer hover:bg-muted/50 ${sharedProject ? 'bg-amber-50/40' : ''}`}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <TableCell>
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: sharedProject ? '#f59e0b' : (project.color || '#3b82f6') }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          {sharedProject && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                              Shared
                            </Badge>
                          )}
                        </div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.clientName ? (
                        <div className="flex items-center gap-1.5">
                          <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{project.clientName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.budget !== null && project.budget !== undefined ? (
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          ${project.budget.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.hourlyRate !== null && project.hourlyRate !== undefined ? (
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          ${project.hourlyRate}/h
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.estimatedTime ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{project.estimatedTime}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.members && project.members.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {project.members.slice(0, 2).map((memberId, idx) => {
                            const memberData = usersMap[memberId];
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="w-6 h-6 border-2 border-background">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {memberData?.displayName?.[0]?.toUpperCase() || 
                                     memberData?.email?.[0]?.toUpperCase() || 
                                     'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate max-w-[120px]">
                                  {memberData?.displayName || memberData?.email?.split('@')[0] || 'Unknown'}
                                </span>
                              </div>
                            );
                          })}
                          {project.members.length > 2 && (
                            <span className="text-xs text-muted-foreground pl-8">
                              +{project.members.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.isArchived ? (
                        <Badge variant="outline" className="gap-1">
                          <Archive className="h-3 w-3" />
                          Archived
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
