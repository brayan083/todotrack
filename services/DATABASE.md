# Estructura de Base de Datos Firestore

## 1. Coleccion: `users` (Perfiles)

Administra la informacion global del usuario.

```json
{
  "displayName": "string",
  "email": "string",
  "photoURL": "string",
  "timezone": "string",
  "currency": "string",
  "createdAt": "timestamp"
}
```

## 2. Coleccion: `workspaces` (Espacios de Trabajo)

Contenedor principal multi-tenant. Agrupa proyectos, roles y configuraciones.

```json
{
  "name": "string",
  "description": "string",
  "ownerId": "string",
  "members": ["string"],
  "userRoles": {
    "uid": "admin"
  },
  "settings": {
    "key": "value"
  },
  "createdAt": "timestamp"
}
```

## 3. Coleccion: `projects` (Iniciativas)

Los proyectos viven dentro de un workspace y pueden ser publicos o privados.

```json
{
  "workspaceId": "string",
  "name": "string",
  "description": "string",
  "color": "string",
  "hourlyRate": "number",
  "budget": "number",
  "isArchived": "boolean",
  "visibility": "public | private",
  "ownerId": "string",
  "members": ["string"],
  "userRoles": {
    "uid": "admin"
  },
  "createdAt": "timestamp"
}
```

## 4. Coleccion: `tasks` (Gestion Kanban)

Incluye `workspaceId` para reportes globales.

```json
{
  "workspaceId": "string",
  "projectId": "string",
  "title": "string",
  "description": "string",
  "status": "todo | in-progress | completed",
  "assigneeId": "string",
  "position": "number",
  "dueDate": "timestamp",
  "subtasks": [
    { "id": "string", "title": "string", "isCompleted": true }
  ],
  "attachments": [
    { "name": "string", "url": "string", "type": "string", "uploadedBy": "string" }
  ],
  "isDeleted": "boolean",
  "deletedAt": "timestamp",
  "createdAt": "timestamp"
}
```

### Sub-coleccion: `tasks/{taskId}/comments`

```json
{
  "userId": "string",
  "text": "string",
  "createdAt": "timestamp"
}
```

## 5. Coleccion: `timeEntries` (Registros de Tiempo)

Permite auditar el tiempo invertido por proyecto y workspace.

```json
{
  "workspaceId": "string",
  "userId": "string",
  "projectId": "string",
  "taskId": "string",
  "description": "string",
  "startTime": "timestamp",
  "endTime": "timestamp",
  "duration": "number",
  "entryType": "normal | pomodoro",
  "isManual": "boolean",
  "isEdited": "boolean",
  "originalData": {
    "startTime": "timestamp",
    "endTime": "timestamp"
  },
  "tags": ["string"]
}
```

## 6. Coleccion: `activityLogs` (Timeline)

```json
{
  "workspaceId": "string",
  "projectId": "string",
  "userId": "string",
  "userDisplayName": "string",
  "action": "string",
  "targetId": "string",
  "targetName": "string",
  "timestamp": "timestamp"
}
```

## 7. Coleccion: `invitations` (Accesos)

```json
{
  "workspaceId": "string",
  "projectId": "string | null",
  "email": "string",
  "invitedBy": "string",
  "role": "string",
  "status": "pending | accepted | declined",
  "sentAt": "timestamp"
}
```
