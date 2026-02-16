/**
 * Services - Punto de entrada para todos los servicios
 * Exporta todos los servicios y tipos para facilitar las importaciones
 */

export { BaseService } from './base.service';
export { AuthService } from './auth.service';
export { UserService, type UserData } from './user.service';
export { TaskService, type Task, type Comment, type Attachment } from './task.service';
export { TimeService, type TimeEntry } from './time.service';
export { ProjectService, type Project } from './project.service';
export { ClientService, type Client } from './client.service';
