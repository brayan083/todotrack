"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Archive, MoreHorizontal, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores';
import { ProjectService, type Project } from '@/services/project.service';
import { db } from '@/lib/firebase.config';

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const projectService = ProjectService.getInstance(db);
        const userProjects = await projectService.getAllProjects(user.uid);
        setProjects(userProjects);
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

  const handleProjectClick = (projectId: string) => {
    router.push(`/app/project/${projectId}/kanban`);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="px-6 py-4 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/app/project/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
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
      </div>

      {/* Projects Grid */}
      <div className="p-6">
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
            {projects.length === 0 && (
              <Button 
                onClick={() => router.push('/app/project/new')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleProjectClick(project.id)}
              >
                {/* Color Bar */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: project.color || '#3b82f6' }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Team Members */}
                  {project.members && project.members.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member, idx) => (
                          <Avatar key={idx} className="w-6 h-6 border border-background">
                            <AvatarFallback className="text-xs">
                              {member.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {project.members.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{project.members.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex gap-2">
                      {project.isArchived && (
                        <Badge variant="outline" className="gap-1">
                          <Archive className="h-3 w-3" />
                          Archived
                        </Badge>
                      )}
                    </div>
                    {project.budget && (
                      <span className="text-xs text-muted-foreground">
                        ${project.budget}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
