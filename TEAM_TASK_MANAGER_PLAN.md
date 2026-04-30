# Team Task Manager — Build Plan

A phased build plan for the **Team Task Manager** full-stack assignment. Designed to be Claude Code–friendly: each phase has a clear goal, deliverables, and acceptance criteria so you can hand off one phase at a time.

---

## 0. Assignment Recap

Build a web app where users can create projects, invite team members, assign tasks, and track progress — with role-based access (Admin / Member).

**Mandatory deliverables**
- Live URL (deployed on **Railway**, fully functional)
- Public GitHub repo
- README with setup + API docs
- 2–5 min demo video

---

## 1. Tech Stack (Locked)

| Layer | Choice | Why |
|---|---|---|
| Backend | **Node.js + Express** | Familiar from DocRack auth/API; minimal boilerplate; Railway-friendly |
| Database | **PostgreSQL** | Relational data (users ↔ projects ↔ tasks) is a perfect fit; Railway provisions in 1 click |
| ORM | **Prisma** | Type-safe queries, migrations, easy to demo schema in README |
| Auth | **JWT + bcrypt** | Stateless, simple, good for SPA + Railway |
| Validation | **Zod** | Schema-based validation shared between routes |
| Frontend | **React 18 + Vite + TypeScript** | Fast dev loop |
| State | **Redux Toolkit + RTK Query** | Server cache + auth state in one place |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, clean UI without bikeshedding |
| Deployment | **Railway** (backend + Postgres + frontend) | Single-vendor, free tier, mandatory for assignment |

**Repo layout**
```
team-task-manager/
├── apps/
│   ├── api/          # Express + Prisma backend
│   └── web/          # Vite + React frontend
├── README.md
└── railway.json      # Railway config
```

---

## 2. Data Model (Source of Truth)

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

**Authorization rule of thumb**
- Project **owner** is implicitly ADMIN.
- ADMIN can: invite/remove members, change roles, create/edit/delete any task.
- MEMBER can: view project, create tasks, edit only their own tasks or tasks assigned to them, change status of assigned tasks.

---

## 3. Phased Plan

### P0 — Foundation & Setup (Day 1, ~3 hrs)

**Goal:** Empty but runnable monorepo with both apps booting and Postgres connected locally.

**Tasks**
1. `git init`, create GitHub repo (public).
2. Scaffold `apps/api`: `npm init`, install `express`, `prisma`, `@prisma/client`, `zod`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `helmet`, `morgan`.
3. Scaffold `apps/web`: `npm create vite@latest -- --template react-ts`, install `tailwindcss`, `@reduxjs/toolkit`, `react-redux`, `react-router-dom`, `axios`.
4. Provision Postgres on Railway, copy `DATABASE_URL` to `apps/api/.env`.
5. `prisma init` + paste schema from §2 + `prisma migrate dev --name init`.
6. Add health endpoint `GET /api/health` returning `{ ok: true }`.
7. Confirm Vite dev server hits the API via proxy.

**Acceptance**
- `npm run dev` works in both apps.
- `/api/health` returns 200 from local API.
- Prisma Studio shows empty tables.

---

### P1 — Auth System (Day 1–2, ~4 hrs)

**Goal:** Signup, login, and protected route check working end-to-end with JWT.

**Backend tasks**
1. `POST /api/auth/signup` — Zod validate `{ name, email, password }`, hash password with bcrypt (10 rounds), create user, return `{ user, token }`.
2. `POST /api/auth/login` — verify credentials, return `{ user, token }`.
3. `GET /api/auth/me` — returns current user, requires `Authorization: Bearer <jwt>`.
4. `requireAuth` middleware — verifies JWT, attaches `req.user`.
5. Standard error response shape: `{ error: { code, message, details? } }`.

**Frontend tasks**
1. `authSlice` (Redux Toolkit) — stores `user`, `token`; persisted to `localStorage`.
2. Axios instance with interceptor to attach token + handle 401.
3. `/signup` and `/login` pages with form validation.
4. `<ProtectedRoute>` wrapper — redirects to `/login` if no token.
5. Bootstrap on app load: if token exists, call `/auth/me` to hydrate user.

**Acceptance**
- New user can sign up, gets logged in, lands on `/dashboard`.
- Refresh keeps user logged in.
- Hitting `/dashboard` directly without token redirects to `/login`.

---

### P2 — Core Backend APIs (Day 2–3, ~6 hrs)

**Goal:** All REST endpoints for projects, members, and tasks, fully working in Postman/Thunder Client.

**Endpoints**

```
Projects
  POST   /api/projects                          create (creator becomes owner + ADMIN)
  GET    /api/projects                          list projects user is member of
  GET    /api/projects/:id                      detail incl. members + task counts
  PATCH  /api/projects/:id                      update (ADMIN only)
  DELETE /api/projects/:id                      delete (owner only)

Members
  POST   /api/projects/:id/members              invite by email (ADMIN only)
  PATCH  /api/projects/:id/members/:userId      change role (ADMIN only, can't demote owner)
  DELETE /api/projects/:id/members/:userId      remove (ADMIN only)

Tasks
  POST   /api/projects/:id/tasks                create
  GET    /api/projects/:id/tasks                list w/ filters: ?status=&assigneeId=&overdue=true
  GET    /api/tasks/:id                         detail
  PATCH  /api/tasks/:id                         update (rules per role)
  DELETE /api/tasks/:id                         delete (ADMIN or creator)

Dashboard
  GET    /api/dashboard                         aggregate: my tasks, by status, overdue count, recent projects
```

**Implementation notes**
- One Zod schema per endpoint, colocated with the route file.
- All list endpoints return `{ data, meta: { total } }`.
- Use Prisma `include` for nested data on detail endpoints.
- Add a `loadProjectMembership` middleware that fetches the caller's role for `:id` and attaches it to `req.membership`.

**Acceptance**
- Full CRUD demoed via Postman collection (export & commit `postman/collection.json`).
- Filters on task list work (`?overdue=true`, `?status=TODO`, `?assigneeId=me`).

---

### P3 — RBAC & Validations Hardening (Day 3, ~3 hrs)

**Goal:** Role-based access control is bulletproof and consistent across endpoints.

**Tasks**
1. `requireRole('ADMIN')` middleware composing on top of `loadProjectMembership`.
2. Task-edit authorization helper:
   ```
   canEditTask(user, task, membership):
     if membership.role === 'ADMIN' → true
     if task.createdById === user.id → true
     if task.assigneeId === user.id → true (status only)
     else → false
   ```
3. Centralized error handler with proper HTTP codes:
   - 400 validation, 401 unauth, 403 forbidden, 404 not found, 409 conflict.
4. Rate limit signup/login (e.g., `express-rate-limit`).
5. Helmet headers, CORS allowlist (env-driven).
6. Negative-path tests via Postman: member trying to delete admin's task → 403.

**Acceptance**
- A non-admin member cannot invite, remove members, or change roles.
- A member can update status of their assigned task but not reassign it.
- All 4xx responses follow the same shape.

---

### P4 — Frontend Layout, Routing & Auth UX (Day 3–4, ~4 hrs)

**Goal:** Authenticated app shell with navigation and empty states for each main screen.

**Routes**
```
/login
/signup
/dashboard               (default authed landing)
/projects
/projects/:id            (overview + members + tasks tabs)
/projects/:id/tasks/:taskId   (task detail / edit modal)
```

**Tasks**
1. Layout: left sidebar (Dashboard, Projects), top bar (user menu, logout).
2. RTK Query `apiSlice` with endpoints for all backend routes.
3. Toast system (`sonner` or `react-hot-toast`) wired into RTKQ error responses.
4. Empty states with primary CTAs ("Create your first project").
5. Loading skeletons (Tailwind `animate-pulse`).

**Acceptance**
- Logged-in user sees sidebar + dashboard shell.
- All routes render without errors against real API.

---

### P5 — Feature Screens: Projects, Tasks, Dashboard (Day 4–5, ~8 hrs)

**Goal:** All user-facing flows complete and polished.

**5a. Projects**
- List page: cards w/ name, description, member count, task count.
- Create modal: name + description.
- Detail page tabs: **Overview** (counts, recent activity), **Members**, **Tasks**.
- Members tab: invite by email input, role dropdown, remove button (ADMIN only).

**5b. Tasks**
- Two views toggle: **List** (table) and **Board** (Kanban: TODO / IN_PROGRESS / DONE columns).
- Drag-and-drop on board to change status (`@dnd-kit/core`).
- Task detail panel/modal: title, description, assignee dropdown (project members), status, priority, due date.
- Inline status change on list view via dropdown.
- Overdue tasks highlighted in red.

**5c. Dashboard**
- Cards: My Tasks (count), In Progress, Overdue, Completed This Week.
- "My Open Tasks" list across all projects, sorted by due date.
- "Recent Projects" grid (top 4).

**Acceptance**
- Create project → invite a member (use second test account) → create task → assign → second user logs in and sees task in their dashboard.
- Drag task from TODO to DONE updates DB and reflects on refresh.

---

### P6 — Deployment, README & Submission (Day 5–6, ~4 hrs)

**Goal:** Live URL on Railway, polished README, demo video recorded.

**6a. Railway deployment**
1. Connect GitHub repo to Railway project.
2. Service 1: Postgres (already provisioned in P0; promote to production DB).
3. Service 2: API
   - Root: `apps/api`
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start: `node dist/server.js`
   - Env: `DATABASE_URL` (referenced from Postgres service), `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=<web-url>`
4. Service 3: Web
   - Root: `apps/web`
   - Build: `npm install && npm run build`
   - Start: `npx serve -s dist -l $PORT` (or use Railway's static serving)
   - Env: `VITE_API_URL=<api-url>`
5. Generate Railway public domains for both services.
6. Smoke test the live URL with a fresh signup.

**6b. README sections**
- Project overview + feature list
- Tech stack
- Architecture diagram (simple Mermaid)
- Local setup steps (clone → env → migrate → run)
- Environment variable reference table
- API endpoint table
- RBAC matrix
- Deployment notes (Railway)
- Live URL + demo video link
- Screenshots (3–5 key screens)

**6c. Demo video (2–5 min) — script**
1. (0:00–0:20) Intro: what the app does + tech stack.
2. (0:20–1:00) Signup, login, dashboard tour.
3. (1:00–2:00) Create project, invite member (switch to second browser), assign task.
4. (2:00–3:00) Member view: update task status, dashboard reflects change.
5. (3:00–3:30) Show RBAC: member tries admin action and gets blocked.
6. (3:30–4:00) Wrap: live URL, GitHub repo.

Record with **OBS Studio** or **Loom**, upload to YouTube (unlisted) or Loom share link.

**6d. Final submission checklist**
- [ ] Live URL works in incognito (no cached auth)
- [ ] Signup → core flow → logout works without errors
- [ ] GitHub repo public, no secrets committed (`.env` in `.gitignore`)
- [ ] README has live URL + video link at top
- [ ] Postman collection committed under `/postman`
- [ ] Demo video uploaded and link tested

---

## 4. Time Estimate

| Phase | Estimate |
|---|---|
| P0 Setup | 3 hrs |
| P1 Auth | 4 hrs |
| P2 Core APIs | 6 hrs |
| P3 RBAC | 3 hrs |
| P4 Frontend Shell | 4 hrs |
| P5 Feature Screens | 8 hrs |
| P6 Deploy + README + Video | 4 hrs |
| **Total** | **~32 hrs (4–6 day sprint)** |

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Railway free-tier sleep / cold starts during evaluation | Use a $5 hobby plan for the demo week; mention live URL is "warm" in submission |
| CORS issues between frontend and API on Railway | Set `CORS_ORIGIN` env var; test in P6 immediately after deploy, not last |
| Prisma migrations failing on Railway | Always run `prisma migrate deploy` (not `dev`) in build step; commit migrations folder |
| Scope creep on Kanban DnD | Ship list view first (P5a/b without DnD); add DnD only if time permits |
| Demo video runs over 5 min | Storyboard before recording; use second pre-seeded test account to skip filler signup |

---

## 6. What I'd Skip (To Stay In Budget)

These would be nice but not required by the rubric:
- Comments on tasks
- File attachments
- Email notifications (just in-app)
- Activity log / audit trail
- Real-time updates (WebSockets)
- Dark mode

If P5 finishes early, comments are the highest-value addition.

---

## 7. Claude Code Handoff Pattern

For each phase, prompt Claude Code with:

```
Working on Phase P<N>: <phase name>.
Read docs/PLAN.md sections "<phase>" and "Data Model" for context.
Implement only what's listed under P<N> tasks.
Do not touch code outside apps/api/src/<phase-area> unless explicitly required.
After implementation, list the acceptance criteria you've verified.
```

Keep `CLAUDE.md` at repo root with: tech stack lock, the data model from §2, the RBAC rules, and a "do not refactor working code" rule.
