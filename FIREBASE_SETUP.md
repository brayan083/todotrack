# Configuración de Firebase

Este proyecto usa Firebase para autenticación y base de datos. Sigue estos pasos para configurarlo:

## 1. Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Sigue los pasos para crear tu proyecto

## 2. Habilitar Autenticación

1. En Firebase Console, ve a **Authentication** > **Sign-in method**
2. Habilita los métodos que necesites:
   - **Email/Password** - Para registro con correo
   - **Google** - Para login con Google (opcional pero recomendado)

## 3. Crear Firestore Database

1. Ve a **Firestore Database** en el menú lateral
2. Haz clic en "Crear base de datos"
3. Selecciona **Modo de producción** (configuraremos las reglas después)
4. Elige la ubicación más cercana a tus usuarios

## 4. Obtener las Credenciales

1. Ve a **Project Settings** (ícono de engranaje) > **General**
2. En la sección "Tus apps", selecciona la app web o crea una nueva
3. Copia las credenciales de configuración

## 5. Configurar Variables de Entorno

1. Copia el archivo `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Abre `.env.local` y reemplaza los valores con tus credenciales de Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
   ```

## 6. Configurar Reglas de Seguridad de Firestore

Ve a **Firestore Database** > **Reglas** y usa estas reglas básicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function - Usuario autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function - Es el propietario
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Proyectos - Solo el creador puede leer/escribir
    match /projects/{projectId} {
      allow read, write: if isAuthenticated() && 
        (resource.data.members == null || 
         request.auth.uid in resource.data.members ||
         resource.data.ownerId == request.auth.uid);
    }
    
    // Tareas - Acceso basado en el proyecto
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated();
    }
    
    // Time Entries - Solo el propietario
    match /timeEntries/{entryId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
    
    // Clientes - Solo el propietario
    match /clients/{clientId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.ownerId;
    }
  }
}
```

## 7. Reiniciar el Servidor de Desarrollo

Después de configurar las variables de entorno:

```bash
npm run dev
```

## Solución de Problemas

### Error: "Firebase: Error (auth/configuration-not-found)"
- Verifica que todas las variables de entorno estén configuradas correctamente
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error: "Firebase: Error (auth/unauthorized-domain)"
- Ve a Firebase Console > Authentication > Settings > Authorized domains
- Agrega `localhost` para desarrollo local
- Agrega tu dominio de producción cuando despliegues

### La autenticación funciona pero no puedo leer/escribir en Firestore
- Revisa las reglas de seguridad en Firestore
- Verifica que el usuario esté autenticado correctamente
- Usa las herramientas de Firebase Console para debuggear las reglas
