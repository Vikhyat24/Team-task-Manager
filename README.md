# Team Task Manager

A full-stack, comprehensive task management application designed for teams. Built with a modern, type-safe stack: React, Vite, Redux, Node.js, Express, and Prisma.

## Features

- **Robust Authentication**: Secure JWT-based authentication with `bcryptjs` for password hashing and an automatic token-refresh architecture on the frontend.
- **Projects & Kanban Boards**: Create and manage projects with a visual, categorized task layout (To Do, In Progress, Done).
- **Role-Based Access Control (RBAC)**: Fine-grained permissions ensuring that only Project Admins can change settings, invite/remove users, and assign tasks, while all members can update their assigned tasks.
- **Dynamic Dashboard**: View personalized statistics, overdue tasks, and a unified feed of all your open tasks across every project.
- **Beautiful, Accessible UI**: Built with `shadcn/ui` and Tailwind CSS, featuring seamless dark-mode integration and micro-animations.

## Tech Stack

- **Frontend**: React (Vite), Redux Toolkit, React Router v6, Tailwind CSS, Shadcn UI, Axios.
- **Backend**: Node.js, Express, Prisma ORM, Zod Validation, JWT.
- **Database**: SQLite (default for easy local development) / PostgreSQL ready.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm

### 2. Install Dependencies
Navigate to both the `apps/api` and `apps/web` directories and install dependencies:

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 3. Environment Variables
In the `apps/api` directory, create a `.env` file (if not present) and add your secrets:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

### 4. Database Setup
Initialize your SQLite database using Prisma:

```bash
cd apps/api
npx prisma db push
```

*Note: For production, you may want to swap the `provider = "sqlite"` to `provider = "postgresql"` in `apps/api/prisma/schema.prisma` and run `npx prisma migrate dev`.*

### 5. Start the Application

You'll need two terminal windows to run both servers concurrently.

**Start the Backend API:**
```bash
cd apps/api
npm run dev
```

**Start the Frontend Web App:**
```bash
cd apps/web
npm run dev
```

The application will now be running at `http://localhost:5173`.

## Deployment

The application is architected to be easily deployable to platforms like Render, Railway, or Vercel.

1. Provision a PostgreSQL database and replace the SQLite URL in your production environment.
2. Build the frontend: `cd apps/web && npm run build`
3. Build the backend: `cd apps/api && npm run build`
4. Run Prisma migrations on the production database during the deployment phase.
