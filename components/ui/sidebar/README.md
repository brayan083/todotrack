# Sidebar Component

Un componente de sidebar totalmente composable, temático y personalizable para tu aplicación TodoTrack.

## Estructura

El componente Sidebar está compuesto de las siguientes partes:

- `SidebarProvider` - Maneja el estado colapsable del sidebar
- `Sidebar` - El contenedor principal del sidebar
- `SidebarHeader` y `SidebarFooter` - Sticky en la parte superior e inferior
- `SidebarContent` - Contenido scrollable
- `SidebarGroup` - Sección dentro del `SidebarContent`
- `SidebarTrigger` - Botón para activar el sidebar
- `SidebarRail` - Riel interactivo para mostrar/ocultar el sidebar

## Uso Básico

### 1. Actualizar el Layout Principal

Para usar el sidebar en tu aplicación, necesitas actualizar el layout principal. Hay dos opciones:

#### Opción A: Layout de Aplicación (`app/app/layout.tsx`)

Si quieres que el sidebar solo aparezca en las rutas `/app/*`, actualiza el archivo `app/app/layout.tsx`:

```tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

#### Opción B: Layout Global (`app/layout.tsx`)

Si quieres que el sidebar aparezca en toda la aplicación:

```tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from '@/components/auth-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Usar el SidebarTrigger en tus Páginas

Para agregar un botón que abra/cierre el sidebar en cualquier página:

```tsx
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <div>
      <header className="flex h-16 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </header>
      {/* Contenido de tu página */}
    </div>
  );
}
```

## Personalización del AppSidebar

El componente `AppSidebar` (`components/app-sidebar.tsx`) ya está configurado con:

- Navegación principal (Dashboard, Kanban, Projects, Timesheet)
- Acciones rápidas (New Project)
- Footer con información del usuario

Puedes personalizarlo editando el archivo `components/app-sidebar.tsx`.

### Agregar Nuevos Items de Menu

```tsx
const menuItems = [
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Nuevo Item",
    url: "/app/nuevo-item",
    icon: MiIcono, // Importa de lucide-react
  },
  // ... más items
]
```

### Agregar Submenus

```tsx
import { SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";

<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <a href="#">
      <FolderKanban />
      <span>Projects</span>
    </a>
  </SidebarMenuButton>
  <SidebarMenuSub>
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <a href="/app/project/1">Project 1</a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <a href="/app/project/2">Project 2</a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  </SidebarMenuSub>
</SidebarMenuItem>
```

## Props del SidebarProvider

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `defaultOpen` | `boolean` | Estado abierto por defecto (default: `true`) |
| `open` | `boolean` | Estado controlado del sidebar |
| `onOpenChange` | `(open: boolean) => void` | Callback cuando cambia el estado |

### Ejemplo Controlado

```tsx
export function App() {
  const [open, setOpen] = React.useState(false)

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar />
      <main>{children}</main>
    </SidebarProvider>
  )
}
```

## Props del Sidebar

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `side` | `"left"` \| `"right"` | Lado del sidebar (default: `"left"`) |
| `variant` | `"sidebar"` \| `"floating"` \| `"inset"` | Variante del sidebar |
| `collapsible` | `"offcanvas"` \| `"icon"` \| `"none"` | Comportamiento al colapsar |

### Variantes

- `sidebar` - Sidebar estándar pegado al borde
- `floating` - Sidebar flotante con sombra
- `inset` - Sidebar con margen interno (requiere `SidebarInset`)

### Collapsible

- `offcanvas` - Se desliza fuera de la vista
- `icon` - Se colapsa mostrando solo iconos
- `none` - No colapsable

## Hook useSidebar

Accede al estado y controles del sidebar desde cualquier componente dentro del `SidebarProvider`:

```tsx
import { useSidebar } from "@/components/ui/sidebar";

export function MiComponente() {
  const {
    state,      // "expanded" | "collapsed"
    open,       // boolean
    setOpen,    // (open: boolean) => void
    openMobile, // boolean
    setOpenMobile, // (open: boolean) => void
    isMobile,   // boolean
    toggleSidebar, // () => void
  } = useSidebar()

  return (
    <button onClick={toggleSidebar}>
      Toggle Sidebar
    </button>
  )
}
```

## Atajo de Teclado

Por defecto, puedes abrir/cerrar el sidebar con:
- **Mac**: `Cmd + B`
- **Windows/Linux**: `Ctrl + B`

## Responsive

El sidebar automáticamente:
- Se convierte en un Sheet (modal) en móviles
- Muestra tooltips cuando está colapsado en desktop
- Se adapta al tamaño de pantalla

## Temas

El sidebar usa variables CSS que se adaptan automáticamente al tema claro/oscuro. Las variables se encuentran en `app/globals.css`:

```css
:root {
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

## Componentes Disponibles

- `SidebarProvider` - Proveedor de contexto
- `Sidebar` - Contenedor principal
- `SidebarHeader` - Encabezado sticky
- `SidebarFooter` - Footer sticky
- `SidebarContent` - Contenido scrollable
- `SidebarGroup` - Grupo de items
- `SidebarGroupLabel` - Label de grupo
- `SidebarGroupContent` - Contenido de grupo
- `SidebarGroupAction` - Acción de grupo
- `SidebarMenu` - Menú de navegación
- `SidebarMenuItem` - Item de menú
- `SidebarMenuButton` - Botón de menú
- `SidebarMenuAction` - Acción de menú
- `SidebarMenuBadge` - Badge de menú
- `SidebarMenuSub` - Submenú
- `SidebarMenuSubItem` - Item de submenú
- `SidebarMenuSubButton` - Botón de submenú
- `SidebarMenuSkeleton` - Skeleton para carga
- `SidebarSeparator` - Separador
- `SidebarInput` - Input de búsqueda
- `SidebarTrigger` - Botón para toggle
- `SidebarRail` - Riel interactivo
- `SidebarInset` - Contenedor para contenido principal

## Ejemplos Adicionales

### Sidebar con Búsqueda

```tsx
import { SidebarInput } from "@/components/ui/sidebar";

<SidebarHeader>
  <SidebarInput placeholder="Buscar..." />
</SidebarHeader>
```

### Sidebar con Grupos Colapsables

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible";

<Collapsible defaultOpen className="group/collapsible">
  <SidebarGroup>
    <SidebarGroupLabel asChild>
      <CollapsibleTrigger>
        Projects
        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent>
        {/* Contenido del grupo */}
      </SidebarGroupContent>
    </CollapsibleContent>
  </SidebarGroup>
</Collapsible>
```

### Sidebar con Skeleton Loading

```tsx
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";

<SidebarMenu>
  {isLoading ? (
    Array.from({ length: 5 }).map((_, index) => (
      <SidebarMenuItem key={index}>
        <SidebarMenuSkeleton showIcon />
      </SidebarMenuItem>
    ))
  ) : (
    // Items reales
  )}
</SidebarMenu>
```
