<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TodoTrack - Project Management & Time Tracking

A modern project management and time tracking application built with Next.js, React, Firebase, and Tailwind CSS.

## Features

- **Authentication**: Email/password and Google OAuth login
- **Dashboard**: Overview of projects and tasks
- **Kanban Board**: Organize tasks in customizable columns
- **Time Tracking**: Built-in timer for task time tracking
- **User Management**: User profiles and authentication

## Run Locally

**Prerequisites**: Node.js 18+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Enable Authentication methods:
   - Email/Password
   - Google OAuth
4. Copy your project credentials
5. Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting Started

1. Visit `/register` to create a new account
2. Sign up with email/password or Google
3. Access the dashboard at `/app/dashboard`
4. Create projects and manage tasks

## Project Structure

```
├── app/
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── app/                # Protected routes (dashboard, kanban, timesheet)
├── components/
│   ├── ui/                 # UI components
│   └── auth-provider.tsx   # Auth initialization
├── services/
│   ├── auth.service.ts     # Firebase authentication
│   ├── task.service.ts     # Task management
│   └── project.service.ts  # Project management
├── stores/
│   ├── auth.store.ts       # Auth state management
│   ├── task.store.ts       # Task state management
│   └── project.store.ts    # Project state management
└── lib/
    └── firebase.config.ts  # Firebase initialization
```

## Authentication Flow

- Users can sign up with email/password or Google OAuth
- Passwords must be at least 8 characters
- Session is persisted in localStorage
- Protected routes redirect to login if not authenticated

## Available Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/app/dashboard` - Dashboard (protected)
- `/app/kanban` - Kanban board (protected)
- `/app/timesheet` - Time tracking (protected)
