"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    KanbanSquare,
    FolderKanban,
    Clock,
    Plus,
    ChevronDown,
    LogOut,
    User2,
    MoreHorizontal,
} from "lucide-react"

import { useAuth, useProjects } from "@/hooks"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarRail,
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from "next/image"

// Menu items principales
const mainMenuItems = [
    {
        title: "Dashboard",
        url: "/app/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Kanban",
        url: "/app/kanban",
        icon: KanbanSquare,
    },
    {
        title: "Timesheet",
        url: "/app/timesheet",
        icon: Clock,
    },
    {
        title: "Projects",
        url: "/app/project",
        icon: FolderKanban,
    },
    {
        title: "Clients",
        url: "/app/clients",
        icon: User2,
    }
]

export function AppSidebarAdvanced({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const { projects, loading: projectsLoading } = useProjects()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        <KanbanSquare className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">TodoTrack</span>
                                        <span className="truncate text-xs">Task Management</span>
                                    </div>
                                    <ChevronDown className="ml-auto size-4 opacity-60" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56"
                                side="right"
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/app/dashboard">Go to dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Switch workspace</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Menú Principal */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainMenuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Proyectos - Grupo Colapsable */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="w-full">
                                Projects
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {projectsLoading ? (
                                        // Loading skeleton
                                        Array.from({ length: 3 }).map((_, index) => (
                                            <SidebarMenuItem key={index}>
                                                <SidebarMenuSkeleton showIcon />
                                            </SidebarMenuItem>
                                        ))
                                    ) : projects.length === 0 ? (
                                        // Empty state
                                        <SidebarMenuItem>
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                No projects yet
                                            </div>
                                        </SidebarMenuItem>
                                    ) : (
                                        // Projects list
                                        projects.map((project) => (
                                            <SidebarMenuItem key={project.id}>
                                                <SidebarMenuButton asChild isActive={pathname === `/app/project/${project.id}`}>
                                                    <Link href={`/app/project/${project.id}`}>
                                                        <FolderKanban />
                                                        <span>{project.name}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <SidebarMenuAction showOnHover>
                                                            <MoreHorizontal />
                                                            <span className="sr-only">More</span>
                                                        </SidebarMenuAction>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        className="w-48"
                                                        side="right"
                                                        align="start"
                                                    >
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/app/project/${project.id}/kanban`}>
                                                                <KanbanSquare className="mr-2 size-4" />
                                                                <span>Kanban Board</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <span>Edit Project</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <span>Delete Project</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </SidebarMenuItem>
                                        ))
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Quick Actions */}
                <SidebarGroup>
                    <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <CreateProjectDialog 
                                    userId={user?.uid || ''}
                                    onProjectCreated={() => {}}
                                >
                                    <SidebarMenuButton tooltip="New Project">
                                        <Plus />
                                        <span>New Project</span>
                                    </SidebarMenuButton>
                                </CreateProjectDialog>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        {user?.photoURL ? (
                                            <Image
                                                src={user.photoURL}
                                                alt={user.displayName || "User Avatar"}
                                                className="h-full w-full rounded-full object-cover"
                                                width={32}
                                                height={32}
                                            />
                                        ) : (
                                            <User2 className="size-4" />
                                        )}
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
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem>
                                    <User2 className="mr-2 size-4" />
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => logout()}>
                                    <LogOut className="mr-2 size-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
