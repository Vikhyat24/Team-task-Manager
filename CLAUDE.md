# CLAUDE.md — Team Task Manager

## Tech Stack (Locked — Do Not Change)

| Layer | Choice |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Frontend | React 18 + Vite + TypeScript |
| State | Redux Toolkit + RTK Query |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Railway |

## Repo Layout

```
team-task-manager/
├── apps/
│   ├── api/   # Express + Prisma backend (port 3000)
│   └── web/   # Vite + React frontend (port 5173)
├── CLAUDE.md
├── .gitignore
└── README.md
```

## Data Model

```prisma
model User {
  id           String           @id @default(cuid())
  name         String
  email        String           @unique
  passwordHash String
  createdAt    DateTime         @default(now())
  memberships  ProjectMember[]
  ownedProjects Project[]       @relation("ProjectOwner")
  assignedTasks Task[]          @relation("TaskAssignee")
  createdTasks  Task[]          @relation("TaskCreator")
}

model Project {
  id          String           @id @default(cuid())
  name        String
  description String?
  ownerId     String
  owner       User             @relation("ProjectOwner", fields: [ownerId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
  createdAt   DateTime         @default(now())
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      Role     @default(MEMBER)
  joinedAt  DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
}

model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      TaskStatus  @default(TODO)
  priority    Priority    @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  createdById String
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdBy   User        @relation("TaskCreator", fields: [createdById], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum Role { ADMIN MEMBER }
enum TaskStatus { TODO IN_PROGRESS DONE }
enum Priority { LOW MEDIUM HIGH }
```

## RBAC Rules

- Project **owner** is implicitly ADMIN.
- **ADMIN** can: invite/remove members, change roles, create/edit/delete any task.
- **MEMBER** can: view project, create tasks, edit only their own tasks or tasks assigned to them, change status of assigned tasks.

## Error Response Shape

```json
{ "error": { "code": "STRING", "message": "Human readable", "details": {} } }
```

## Rules

- **Do not refactor working code** without explicit instruction.
- **Do not change the tech stack** — no swapping libraries.
- All list endpoints return `{ data: [...], meta: { total: number } }`.
- One Zod schema per route, colocated with the route file.
- Use Prisma `include` for nested data on detail endpoints.
