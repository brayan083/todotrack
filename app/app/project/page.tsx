"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { CreateProjectDialog } from '@/components/create-project-dialog';
import { useAuthStore } from '@/stores';
import { ProjectsHeader } from './_components/projects-header';
import { ProjectsSearch } from './_components/projects-search';
import { ProjectsGrid } from './_components/projects-grid';
import { ProjectsTable } from './_components/projects-table';
import { useProjectsWithMembers } from './_hooks/use-projects-with-members';
import { type Project } from '@/services/project.service';

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { projects, setProjects, usersMap, loading } = useProjectsWithMembers({ userId: user?.uid });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [projects, searchTerm]);

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
        <ProjectsHeader
          projectCount={filteredProjects.length}
          viewMode={viewMode}
          userId={user?.uid}
          onViewModeChange={setViewMode}
          onProjectCreated={handleProjectCreated}
        />

        <ProjectsSearch value={searchTerm} onChange={setSearchTerm} />

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
          <ProjectsGrid
            projects={filteredProjects}
            usersMap={usersMap}
            onProjectClick={handleProjectClick}
            isSharedProject={isSharedProject}
          />
        ) : (
          <ProjectsTable
            projects={filteredProjects}
            usersMap={usersMap}
            onProjectClick={handleProjectClick}
            isSharedProject={isSharedProject}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
