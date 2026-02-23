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
    User,
    MoreHorizontal,
    Check,
} from "lucide-react"

import { useAuth, useProjects, useWorkspace } from "@/hooks"
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
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Image from "next/image"
import { canManageProject, getRoleLabel, getUserRole, type InviteRole, type ProjectRole } from "@/lib/roles"
import { WorkspaceService } from "@/services/workspace.service"
import { InvitationService } from "@/services/invitation.service"
import { UserService, type UserData } from "@/services/user.service"
import { db } from "@/lib/firebase.config"

// Menu items principales
const mainMenuItems = [
    {
        title: "Dashboard",
        url: "/app/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Projects",
        url: "/app/project",
        icon: FolderKanban,
    },
    {
        title: "Timesheet",
        url: "/app/timesheet",
        icon: Clock,
    },
]

export function AppSidebarAdvanced({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const { projects, loading: projectsLoading } = useProjects()
    const {
        workspace,
        workspaces,
        loading: workspacesLoading,
        loadWorkspaces,
        setWorkspace,
        addWorkspace,
    } = useWorkspace()
    const maxProjects = 6
    const visibleProjects = projects.slice(0, maxProjects)
    const hasMoreProjects = projects.length > maxProjects

    const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false)
    const [workspaceName, setWorkspaceName] = React.useState("")
    const [workspaceDescription, setWorkspaceDescription] = React.useState("")
    const [workspaceError, setWorkspaceError] = React.useState<string | null>(null)
    const [workspaceSaving, setWorkspaceSaving] = React.useState(false)

    const [inviteOpen, setInviteOpen] = React.useState(false)
    const [inviteMode, setInviteMode] = React.useState<"email" | "uid">("email")
    const [inviteValue, setInviteValue] = React.useState("")
    const [inviteRole, setInviteRole] = React.useState<InviteRole>("member")
    const [inviteError, setInviteError] = React.useState<string | null>(null)
    const [inviteSending, setInviteSending] = React.useState(false)
    const [workspaceMembersMap, setWorkspaceMembersMap] = React.useState<Record<string, UserData>>({})
    const [workspaceMembersLoading, setWorkspaceMembersLoading] = React.useState(false)
    const [workspaceMembersError, setWorkspaceMembersError] = React.useState<string | null>(null)
    const [workspaceMemberSavingId, setWorkspaceMemberSavingId] = React.useState<string | null>(null)

    const canManageWorkspace = Boolean(workspace && user && workspace.ownerId === user.uid)

    React.useEffect(() => {
        if (user) {
            loadWorkspaces(user.uid)
        }
    }, [user, loadWorkspaces])

    const workspaceMembers = React.useMemo(() => workspace?.members || [], [workspace?.members])

    React.useEffect(() => {
        if (!workspace?.id || workspaceMembers.length === 0) {
            setWorkspaceMembersMap({})
            setWorkspaceMembersLoading(false)
            return
        }

        let isMounted = true
        setWorkspaceMembersLoading(true)
        setWorkspaceMembersError(null)
        const userService = UserService.getInstance(db)

        Promise.all(workspaceMembers.map((memberId) => userService.getUser(memberId)))
            .then((users) => {
                if (!isMounted) return
                const nextMap: Record<string, UserData> = {}
                users.forEach((member) => {
                    if (member) {
                        nextMap[member.uid] = member
                    }
                })
                setWorkspaceMembersMap(nextMap)
            })
            .catch((error: any) => {
                if (!isMounted) return
                setWorkspaceMembersError(error.message || "Unable to load workspace members")
            })
            .finally(() => {
                if (!isMounted) return
                setWorkspaceMembersLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [workspace?.id, workspaceMembers])

    const handleWorkspaceSelect = (workspaceId: string) => {
        const nextWorkspace = workspaces.find((item) => item.id === workspaceId) || null
        if (nextWorkspace) {
            setWorkspace(nextWorkspace)
        }
    }

    const handleCreateWorkspace = async () => {
        if (!user) return
        const name = workspaceName.trim()
        if (!name) {
            setWorkspaceError("Workspace name is required")
            return
        }

        try {
            setWorkspaceSaving(true)
            setWorkspaceError(null)
            const service = WorkspaceService.getInstance(db)
            const created = await service.createWorkspace({
                name,
                description: workspaceDescription.trim(),
                ownerId: user.uid,
                members: [user.uid],
                userRoles: { [user.uid]: "owner" },
                settings: {},
            })
            addWorkspace(created)
            setWorkspace(created)
            setCreateWorkspaceOpen(false)
            setWorkspaceName("")
            setWorkspaceDescription("")
        } catch (error: any) {
            setWorkspaceError(error.message || "Unable to create workspace")
        } finally {
            setWorkspaceSaving(false)
        }
    }

    const handleSendInvite = async () => {
        if (!user || !workspace) return
        const value = inviteValue.trim()
        if (!value) {
            setInviteError(inviteMode === "email" ? "Email is required" : "UID is required")
            return
        }

        try {
            setInviteSending(true)
            setInviteError(null)
            const userService = UserService.getInstance(db)
            let inviteeId: string | undefined
            let email = ""

            if (inviteMode === "email") {
                email = value.toLowerCase()
                if (!/.+@.+\..+/.test(email)) {
                    setInviteError("Invalid email format")
                    return
                }
                const existingUser = await userService.getUserByEmail(email)
                if (existingUser) {
                    inviteeId = existingUser.uid
                }
            } else {
                const existingUser = await userService.getUser(value)
                if (!existingUser) {
                    setInviteError("No user found with that UID")
                    return
                }
                email = (existingUser.email || "").toLowerCase()
                if (!email) {
                    setInviteError("User does not have an email configured")
                    return
                }
                inviteeId = existingUser.uid
            }

            const invitationService = InvitationService.getInstance(db)
            await invitationService.createInvitation({
                workspaceId: workspace.id,
                projectId: null,
                email,
                invitedBy: user.uid,
                role: inviteRole,
                inviteeId,
            })
            setInviteOpen(false)
            setInviteValue("")
        } catch (error: any) {
            setInviteError(error.message || "Unable to send invitation")
        } finally {
            setInviteSending(false)
        }
    }

    const getWorkspaceMemberRole = React.useCallback(
        (memberId: string): ProjectRole => {
            if (workspace?.ownerId === memberId) return "owner"
            const role = workspace?.userRoles?.[memberId] as ProjectRole | undefined
            if (role === "admin" || role === "member" || role === "viewer" || role === "owner") {
                return role
            }
            return "member"
        },
        [workspace?.ownerId, workspace?.userRoles]
    )

    const currentWorkspaceRole = user?.uid ? getWorkspaceMemberRole(user.uid) : null
    const canAccessWorkspaceSettings = currentWorkspaceRole === "owner" || currentWorkspaceRole === "admin"

    const handleWorkspaceMemberRoleChange = async (memberId: string, role: ProjectRole) => {
        if (!workspace || !canManageWorkspace) return
        if (memberId === workspace.ownerId) return

        try {
            setWorkspaceMemberSavingId(memberId)
            setWorkspaceMembersError(null)
            const service = WorkspaceService.getInstance(db)
            await service.updateWorkspaceMemberRole(workspace.id, memberId, role)
            setWorkspace({
                ...workspace,
                userRoles: {
                    ...(workspace.userRoles || {}),
                    [memberId]: role,
                },
            })
        } catch (error: any) {
            setWorkspaceMembersError(error.message || "Unable to update role")
        } finally {
            setWorkspaceMemberSavingId(null)
        }
    }

    const workspaceMemberIds = React.useMemo(() => {
        const members = workspace?.members || []
        const ownerId = workspace?.ownerId
        if (!ownerId) return members
        const withoutOwner = members.filter((memberId) => memberId !== ownerId)
        return [ownerId, ...withoutOwner]
    }, [workspace?.members, workspace?.ownerId])

    const renderProjectItem = (project: (typeof projects)[number]) => {
        const role = getUserRole(project, user?.uid, workspace?.members)
        const canManage = canManageProject(role)

        return (
            <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={pathname === `/app/project/${project.id}`}>
                    <Link href={`/app/project/${project.id}`}>
                        <FolderKanban />
                        <span className="flex-1 truncate">{project.name}</span>
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
                        {canManage && (
                            <DropdownMenuItem>
                                <span>Edit Project</span>
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <DropdownMenuItem className="text-destructive">
                                <span>Delete Project</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        )
    }

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
                                        <span className="truncate font-semibold">{workspace?.name || "Workspace"}</span>
                                        <span className="truncate text-xs">Workspace</span>
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
                                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {workspacesLoading ? (
                                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                                ) : workspaces.length === 0 ? (
                                    <DropdownMenuItem disabled>No workspaces yet</DropdownMenuItem>
                                ) : (
                                    workspaces.map((item) => (
                                        <DropdownMenuItem
                                            key={item.id}
                                            onSelect={() => handleWorkspaceSelect(item.id)}
                                            className="gap-2"
                                        >
                                            {item.id === workspace?.id ? (
                                                <Check className="size-4 text-primary" />
                                            ) : (
                                                <span className="size-4" />
                                            )}
                                            <span className="truncate">{item.name}</span>
                                        </DropdownMenuItem>
                                    ))
                                )}
                                {canAccessWorkspaceSettings && workspace?.id && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={`/app/workspace/${workspace.id}`}>Workspace settings</Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canManageWorkspace && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => setCreateWorkspaceOpen(true)}>
                                            Create workspace
                                        </DropdownMenuItem>
                                    </>
                                )}
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

                {/* Proyectos propios - Grupo Colapsable */}
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
                                        visibleProjects.map(renderProjectItem)
                                    )}
                                    {!projectsLoading && hasMoreProjects && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild>
                                                <Link href="/app/project">
                                                    <span className="text-sm text-muted-foreground">View more</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

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
                                            <User className="size-4" />
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
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg mb-2"
                                side="right"
                                align="start"
                                sideOffset={4}
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/app/profile">
                                        <User className="mr-2 size-4" />
                                        <span>Account</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => logout()}>
                                    <LogOut className="mr-2 size-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <Dialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create workspace</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="workspace-name">Name</Label>
                            <Input
                                id="workspace-name"
                                value={workspaceName}
                                onChange={(event) => setWorkspaceName(event.target.value)}
                                placeholder="Studio, Team A, Personal"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="workspace-description">Description</Label>
                            <Textarea
                                id="workspace-description"
                                value={workspaceDescription}
                                onChange={(event) => setWorkspaceDescription(event.target.value)}
                                placeholder="Optional description"
                            />
                        </div>
                        {workspaceError && <p className="text-sm text-destructive">{workspaceError}</p>}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setCreateWorkspaceOpen(false)}
                            disabled={workspaceSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateWorkspace} disabled={workspaceSaving}>
                            {workspaceSaving ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite members</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="invite-mode">Invite by</Label>
                            <Select value={inviteMode} onValueChange={(value) => setInviteMode(value as "email" | "uid")}>
                                <SelectTrigger id="invite-mode">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="uid">User ID</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invite-value">{inviteMode === "email" ? "Email" : "User ID"}</Label>
                            <Input
                                id="invite-value"
                                value={inviteValue}
                                onChange={(event) => setInviteValue(event.target.value)}
                                placeholder={inviteMode === "email" ? "email@company.com" : "uid"}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as InviteRole)}>
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteSending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendInvite} disabled={inviteSending}>
                            {inviteSending ? "Sending..." : "Send invite"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SidebarRail />
        </Sidebar>
    )
}
