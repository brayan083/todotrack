# Estructura de Base de Datos Firestore

## 1. Colección: `users` (Perfiles)

Almacena los datos de los usuarios registrados. Se crea automáticamente cuando un usuario se registra o inicia sesión con Google.

### Documento: `{uid}`

```json
{
  "uid": "string - ID único de Firebase Auth",
  "displayName": "string - Nombre mostrado",
  "email": "string - Correo electrónico del usuario",
  "photoURL": "string - URL de la foto (vacío si no tiene)",
  "timezone": "string - Zona horaria del usuario (detectada automáticamente por región)",
  "currency": "string - Moneda preferida (USD por defecto, o la de su región)",
  "createdAt": "timestamp - Fecha de creación"
}
```

### Ejemplo:
```json
{
  "uid": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "email": "usuario@example.com",
  "displayName": "Juan García",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "timezone": "America/Mexico_City",
  "currency": "MXN",
  "createdAt": "2026-02-15T10:30:00Z"
}
```

## 2. Colección: `clients` (Gestión Centralizada)

*Facilita el cumplimiento del UC-10 (Gestión de Clientes).*

```json
{
  "id": "string - ID del documento",
  "name": "string - Nombre del cliente",
  "contactEmail": "string - Email de contacto",
  "ownerId": "string - UID del usuario creador",
  "createdAt": "timestamp - Fecha de creación"
}
```

### Ejemplo:
```json
{
  "id": "client_12345",
  "name": "Acme Corporation",
  "contactEmail": "contact@acme.com",
  "ownerId": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "createdAt": "2026-02-15T10:30:00Z"
}
```

## 3. Colección: `projects` (Espacios de Trabajo)

*Actualizada para soportar archivado (UC-08) y presupuestos (UC-21).*

```json
{
  "id": "string - ID del documento",
  "name": "string - Nombre del proyecto",
  "description": "string - Descripción del proyecto",
  "color": "string - Color identificador (hex)",
  "clientId": "string - Referencia al documento de clients",
  "clientName": "string - Nombre del cliente (denormalizado)",
  "hourlyRate": "number - Tarifa por hora",
  "budget": "number - Presupuesto máximo monetario",
  "estimatedTime": "string - Tiempo estimado",
  "isArchived": "boolean - Estado de archivo (default: false)",
  "ownerId": "string - UID del propietario",
  "owner_id": "string - UID del propietario (compatibilidad)",
  "members": "array<string> - UIDs de los miembros",
  "userRoles": "map<string, string> - UID: role (admin, member, viewer)",
  "createdAt": "timestamp - Fecha de creación"
}
```

### Ejemplo:
```json
{
  "id": "project_abc123",
  "name": "Rediseño Web",
  "description": "Proyecto de rediseño completo del sitio web",
  "color": "#3b82f6",
  "clientId": "client_12345",
  "clientName": "Acme Corporation",
  "hourlyRate": 50,
  "budget": 10000,
  "estimatedTime": "160h",
  "isArchived": false,
  "ownerId": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "owner_id": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "members": ["aB1cD2eF3gH4iJ5kL6mN7oP8", "xYz987WvU654"],
  "userRoles": {
    "aB1cD2eF3gH4iJ5kL6mN7oP8": "admin",
    "xYz987WvU654": "member"
  },
  "createdAt": "2026-02-15T10:30:00Z"
}
```

## 4. Colección: `tasks` (Gestión Kanban)

*Evolucionada para incluir subtareas (UC-18), adjuntos (UC-17) y fechas límite (UC-22).*

```json
{
  "id": "string - ID del documento",
  "projectId": "string - Referencia al proyecto",
  "title": "string - Título de la tarea",
  "description": "string - Descripción detallada",
  "status": "string - Estado (todo, in-progress, done)",
  "priority": "string - Prioridad (low, medium, high, urgent)",
  "assignedId": "string - UID del responsable",
  "position": "number - Orden en el tablero Kanban",
  "dueDate": "timestamp - Fecha límite",
  "subtasks": "array<object> - Lista de subtareas",
  "attachments": "array<object> - Archivos adjuntos",
  "isDeleted": "boolean - Marcado para papelera (UC-24)",
  "deletedAt": "timestamp - Fecha de eliminación",
  "createdAt": "timestamp - Fecha de creación"
}
```

### Estructura de Subtareas:
```json
{
  "id": "string - ID único de la subtarea",
  "title": "string - Título de la subtarea",
  "isCompleted": "boolean - Estado de completado"
}
```

### Estructura de Adjuntos:
```json
{
  "id": "string - ID único del adjunto",
  "name": "string - Nombre del archivo",
  "url": "string - URL de descarga",
  "type": "string - Tipo MIME",
  "uploadedBy": "string - UID del usuario",
  "uploadedAt": "timestamp - Fecha de carga"
}
```

### Ejemplo:
```json
{
  "id": "task_xyz789",
  "projectId": "project_abc123",
  "title": "Diseñar página de inicio",
  "description": "Crear mockups y prototipos de la página principal",
  "status": "in-progress",
  "priority": "high",
  "assignedId": "xYz987WvU654",
  "position": 1,
  "dueDate": "2026-02-20T23:59:59Z",
  "subtasks": [
    {
      "id": "sub_001",
      "title": "Crear wireframes",
      "isCompleted": true
    },
    {
      "id": "sub_002",
      "title": "Diseñar mockups en Figma",
      "isCompleted": false
    }
  ],
  "attachments": [
    {
      "id": "att_001",
      "name": "wireframe.pdf",
      "url": "https://storage.googleapis.com/...",
      "type": "application/pdf",
      "uploadedBy": "xYz987WvU654",
      "uploadedAt": "2026-02-16T14:30:00Z"
    }
  ],
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2026-02-15T10:30:00Z"
}
```

### Sub-colección: `tasks/{taskId}/comments` (UC-16)

```json
{
  "id": "string - ID del comentario",
  "userId": "string - UID del autor",
  "text": "string - Contenido del comentario",
  "createdAt": "timestamp - Fecha de creación"
}
```

## 5. Colección: `timeEntries` (Registros de Tiempo)

*Actualizada para auditoría (UC-15) y tipos de registro (UC-19).*

```json
{
  "id": "string - ID del documento",
  "userId": "string - UID del usuario",
  "projectId": "string - Referencia al proyecto",
  "taskId": "string - Referencia a la tarea (opcional)",
  "description": "string - Descripción de la actividad",
  "startTime": "timestamp - Inicio del registro",
  "endTime": "timestamp - Fin del registro",
  "duration": "number - Duración en segundos",
  "entryType": "string - Tipo de registro (normal, pomodoro)",
  "isManual": "boolean - Registro manual o automático",
  "isEdited": "boolean - Flag de auditoría (UC-15)",
  "originalData": "map - Datos originales antes de la primera edición",
  "tags": "array<string> - Etiquetas adicionales"
}
```

### Estructura de Original Data:
```json
{
  "startTime": "timestamp - Hora de inicio original",
  "endTime": "timestamp - Hora de fin original"
}
```

### Ejemplo:
```json
{
  "id": "entry_456def",
  "userId": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "projectId": "project_abc123",
  "taskId": "task_xyz789",
  "description": "Trabajando en diseño de página principal",
  "startTime": "2026-02-16T09:00:00Z",
  "endTime": "2026-02-16T11:30:00Z",
  "duration": 9000,
  "entryType": "normal",
  "isManual": false,
  "isEdited": false,
  "originalData": null,
  "tags": ["diseño", "frontend"]
}
```

## 6. Colección: `activityLogs` (Timeline del Proyecto)

*Soporta el UC-25 para transparencia total.*

```json
{
  "id": "string - ID del documento",
  "projectId": "string - Referencia al proyecto",
  "userId": "string - UID del autor de la acción",
  "userDisplayName": "string - Nombre del usuario (denormalizado)",
  "action": "string - Tipo de acción realizada",
  "targetId": "string - ID del recurso afectado",
  "targetName": "string - Nombre del recurso para mostrar",
  "timestamp": "timestamp - Momento de la acción"
}
```

### Tipos de Acción:
- `task_created` - Tarea creada
- `task_completed` - Tarea completada
- `task_deleted` - Tarea eliminada
- `time_started` - Timer iniciado
- `time_stopped` - Timer detenido
- `time_edited` - Registro de tiempo editado
- `member_invited` - Miembro invitado
- `member_joined` - Miembro unido al proyecto
- `project_archived` - Proyecto archivado

### Ejemplo:
```json
{
  "id": "log_789ghi",
  "projectId": "project_abc123",
  "userId": "xYz987WvU654",
  "userDisplayName": "María López",
  "action": "task_completed",
  "targetId": "task_xyz789",
  "targetName": "Diseñar página de inicio",
  "timestamp": "2026-02-16T15:45:00Z"
}
```

## 7. Colección: `invitations` (Invitaciones de Proyecto)

```json
{
  "id": "string - ID del documento",
  "email": "string - Email del invitado",
  "projectId": "string - Referencia al proyecto",
  "invitedBy": "string - UID del invitador",
  "role": "string - Rol asignado (admin, member, viewer)",
  "status": "string - Estado (pending, accepted, declined)",
  "sentAt": "timestamp - Fecha de envío"
}
```

### Ejemplo:
```json
{
  "id": "invite_123",
  "email": "nuevo@ejemplo.com",
  "projectId": "project_abc123",
  "invitedBy": "aB1cD2eF3gH4iJ5kL6mN7oP8",
  "role": "member",
  "status": "pending",
  "sentAt": "2026-02-16T10:00:00Z"
}
```

## Reglas de Seguridad Firestore (Recomendadas)

Agrega estas reglas en la consola de Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function - Usuario autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function - Es miembro del proyecto
    function isMember(projectId) {
      return isAuthenticated() && 
        request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.members;
    }
    
    // Helper function - Es propietario
    function isOwner(ownerId) {
      return isAuthenticated() && request.auth.uid == ownerId;
    }
    
    // Usuarios - Solo pueden leer/actualizar su propio perfil
    match /users/{uid} {
      allow read, update: if isOwner(uid);
      allow create: if isAuthenticated();
    }
    
    // Clientes - Solo el creador puede gestionar
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.ownerId);
    }
    
    // Proyectos - Miembros pueden leer, propietario puede gestionar
    match /projects/{projectId} {
      allow read: if isAuthenticated() && 
        (request.auth.uid in resource.data.members ||
         request.auth.uid == resource.data.ownerId ||
         request.auth.uid == resource.data.owner_id);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.ownerId);
    }
    
    // Tareas - Miembros del proyecto pueden gestionar
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAuthenticated();
      
      // Comentarios en tareas
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow update, delete: if isOwner(resource.data.userId);
      }
    }
    
    // Registros de tiempo - Solo el propietario
    match /timeEntries/{entryId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
    }
    
    // Activity Logs - Solo lectura para miembros del proyecto
    match /activityLogs/{logId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Los logs no se modifican
    }
    
    // Invitaciones
    match /invitations/{inviteId} {
      allow read: if isAuthenticated() && 
        (request.auth.email == resource.data.email || 
         isOwner(resource.data.invitedBy));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && request.auth.email == resource.data.email;
      allow delete: if isOwner(resource.data.invitedBy);
    }
  }
}
```

## Cómo Usar los Servicios

### Guardar usuario (automático)
Se guarda automáticamente al registrarse o loguearse:

```typescript
// En auth.service.ts
await this.userService.saveUser(user, 'google');
```

### Obtener usuario
```typescript
const { UserService } = require('@/services');
const userService = UserService.getInstance(db);
const userData = await userService.getUser('uid_del_usuario');
```

### Actualizar usuario
```typescript
await userService.updateUser('uid', {
  displayName: 'Nuevo nombre'
});
```

### Verificar si existe
```typescript
const exists = await userService.userExists('uid');
```
