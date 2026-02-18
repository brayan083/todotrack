import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  Timestamp,
  getFirestore,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(fileName) {
  const fullPath = path.join(projectRoot, fileName);
  if (!fs.existsSync(fullPath)) {
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      return;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    if (process.env[key]) {
      return;
    }
    const value = rawValue.replace(/^"|"$/g, '');
    process.env[key] = value;
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const requiredEnv = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error('Faltan variables de entorno:', missing.join(', '));
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomUUID = () => {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMinutes = (date, minutes) => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

const MAIN_USER_UID = '050cn3X1vSaAsdh8NU8NowqgGx82';

async function deleteCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  if (snapshot.empty) {
    return;
  }
  let batch = writeBatch(db);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    count += 1;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();
}

const clientNames = [
  'TechFlow Solutions',
  'Digital Architects',
  'CloudSync Systems',
  'Nexus Development',
  'Innovate Labs',
];

const clients = clientNames.map((name, index) => ({
  id: randomUUID(),
  name,
  contactEmail: `contact@${name.toLowerCase().replace(/\s+/g, '')}.com`,
  ownerId: MAIN_USER_UID,
  createdAt: Timestamp.fromDate(addDays(new Date(), -randomInt(60, 180))),
  updatedAt: Timestamp.fromDate(addDays(new Date(), -randomInt(1, 30))),
}));

const projectNames = [
  'Dashboard Analytics',
  'Mobile App Redesign',
  'API Migration v2.0',
  'Performance Optimization',
  'User Auth System',
  'Payment Integration',
  'Data Pipeline',
  'DevOps Infrastructure',
];

const projectColors = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#F43F5E'];

const projects = projectNames.map((name, index) => {
  const client = randomItem(clients);
  return {
    id: randomUUID(),
    name,
    description: `Sistema completo para ${name.toLowerCase()}. Incluye diseño, desarrollo, testing y deployment.`,
    color: projectColors[index % projectColors.length],
    clientId: client.id,
    clientName: client.name,
    hourlyRate: randomInt(50, 150),
    budget: randomInt(5000, 50000),
    estimatedTime: `${randomInt(80, 400)}h`,
    isArchived: false,
    ownerId: MAIN_USER_UID,
    members: [MAIN_USER_UID],
    userRoles: {
      [MAIN_USER_UID]: 'owner',
    },
    createdAt: Timestamp.fromDate(addDays(new Date(), -randomInt(20, 120))),
    updatedAt: Timestamp.fromDate(addDays(new Date(), -randomInt(1, 15))),
  };
});

const taskTitles = [
  'Diseñar interfaz principal',
  'Implementar autenticación',
  'Configurar base de datos',
  'Escribir documentación API',
  'Realizar pruebas unitarias',
  'Optimizar consultas SQL',
  'Crear endpoints REST',
  'Revisar código',
  'Deploy a producción',
  'Corregir bugs reportados',
  'Implementar cache',
  'Agregar validaciones',
  'Crear migrations',
  'Setup CI/CD',
  'Configurar monitoreo',
  'Escribir tests E2E',
  'Refactoring de código',
  'Documentar funcionalidades',
  'Crear mocks de API',
  'Setup environment variables',
];

const taskStatuses = ['todo', 'done'];
const priorities = ['low', 'medium', 'high'];

const tasks = Array.from({ length: 40 }, (_, index) => {
  const project = randomItem(projects);
  const createdAt = addDays(new Date(), -randomInt(1, 60));
  const daysUntilDue = randomInt(5, 30);
  return {
    id: randomUUID(),
    projectId: project.id,
    title: randomItem(taskTitles),
    description: `Tarea dentro del proyecto ${project.name}`,
    status: Math.random() > 0.4 ? 'done' : 'todo',
    assigneeId: MAIN_USER_UID,
    position: index,
    dueDate: Timestamp.fromDate(addDays(createdAt, daysUntilDue)),
    priority: randomItem(priorities),
    attachments: [],
    createdAt: Timestamp.fromDate(createdAt),
  };
});

const activityDescriptions = [
  'Implementando feature de autenticación',
  'Revisando pull request',
  'Optimizando queries de base de datos',
  'Escribiendo tests',
  'Debugging en producción',
  'Reunión de planning',
  'Code review session',
  'Configurando deployment',
  'Documentando API endpoints',
  'Investigando performance issues',
  'Refactoring de componentes',
  'Setup de monitoreo',
  'Migrando a nueva versión',
  'Integrando servicios terceros',
];

const timeEntries = Array.from({ length: 60 }, (_, index) => {
  const project = randomItem(projects);
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const task = projectTasks.length && Math.random() > 0.3 ? randomItem(projectTasks) : null;
  const daysAgo = randomInt(1, 7);
  const start = addDays(new Date(), -daysAgo);
  const hour = randomInt(9, 17);
  start.setHours(hour, randomInt(0, 59), 0, 0);
  const durationMinutes = randomInt(30, 240);
  const end = addMinutes(start, durationMinutes);
  const isActive = false;

  return {
    id: randomUUID(),
    userId: MAIN_USER_UID,
    projectId: project.id,
    taskId: task ? task.id : null,
    description: randomItem(activityDescriptions),
    startTime: Timestamp.fromDate(start),
    endTime: isActive ? null : Timestamp.fromDate(end),
    duration: isActive ? 0 : durationMinutes * 60,
    entryType: 'normal',
    isManual: false,
    isEdited: false,
    originalData: null,
    tags: [],
  };
});

const activityLogs = Array.from({ length: 25 }, (_, index) => {
  const project = randomItem(projects);
  const task = randomItem(tasks.filter((t) => t.projectId === project.id));
  const actions = ['created_task', 'completed_task', 'logged_time', 'updated_task'];
  const action = randomItem(actions);

  return {
    id: randomUUID(),
    projectId: project.id,
    userId: MAIN_USER_UID,
    userDisplayName: 'Tu usuario',
    action,
    targetId: task.id,
    targetName: task.title,
    timestamp: Timestamp.fromDate(addDays(new Date(), -randomInt(1, 7))),
  };
});

async function seedCollection(name, items) {
  if (!items.length) {
    return;
  }
  let batch = writeBatch(db);
  let count = 0;
  for (const item of items) {
    const docId = item.id ?? item.uid ?? null;
    const docRef = docId
      ? doc(db, name, docId)
      : doc(collection(db, name));
    batch.set(docRef, item);
    count += 1;
    if (count % 400 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  await batch.commit();
}

async function run() {
  console.log('🗑️  Limpiando colecciones existentes...');
  await deleteCollection('activityLogs');
  await deleteCollection('invitations');
  await deleteCollection('timeEntries');
  await deleteCollection('tasks');
  await deleteCollection('projects');
  await deleteCollection('clients');

  console.log('📝 Insertando clientes...');
  await seedCollection('clients', clients);

  console.log('📦 Insertando proyectos...');
  await seedCollection('projects', projects);

  console.log('✅ Insertando tareas...');
  await seedCollection('tasks', tasks);

  console.log('⏱️  Insertando timeEntries...');
  await seedCollection('timeEntries', timeEntries);

  console.log('📊 Insertando activityLogs...');
  await seedCollection('activityLogs', activityLogs);

  console.log('\n✨ Seed completado exitosamente!');
  console.log(`- ${clients.length} clientes`);
  console.log(`- ${projects.length} proyectos`);
  console.log(`- ${tasks.length} tareas`);
  console.log(`- ${timeEntries.length} registros de tiempo`);
  console.log(`- ${activityLogs.length} logs de actividad`);
  console.log(`\nUsuario principal: ${MAIN_USER_UID}`);
}

run().catch((error) => {
  console.error('❌ Error en seed:', error);
  process.exit(1);
});
