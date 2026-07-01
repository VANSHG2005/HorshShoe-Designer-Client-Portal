# 🐴 HorseShoe Studio

**Design Studio Project Management & Client Collaboration System**

A full-stack platform where admins manage designers and clients, designers upload versioned design work, clients give feedback and approve/reject designs, and everyone tracks tasks and deadlines in one place.

---

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS 3 (primary styling) + Bootstrap 5 / `react-bootstrap` (modals, toasts, offcanvas)
- React Router v6
- Redux Toolkit (global state management)
- Axios (API client with JWT interceptors)
- React Hook Form + Zod (form validation)
- Recharts (dashboard analytics)
- Socket.IO Client (real-time notifications)
- React Hot Toast (notification toasts)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT (access + refresh token authentication)
- bcrypt (password hashing)
- Multer (file uploads — local disk storage, Cloudinary-ready)
- Socket.IO (real-time events)
- Zod (request validation)
- Helmet, CORS, Rate Limiter, Mongo Sanitize (security)
- Winston + Morgan (logging)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Setup

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and secrets

# Client
cp client/.env.example client/.env
# Edit client/.env if your API runs on a different port
```

### 3. Run in Development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

### 4. Seed Demo Data (after Phase 10)

```bash
cd server
npm run seed
```

---

## Project Structure

```
HorseShoe Studio/
├── server/
│   ├── config/          # DB connection, environment config
│   ├── controllers/     # Route handler logic
│   ├── middleware/       # Auth, RBAC, error handling, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # Logger, socket helpers, utilities
│   ├── uploads/         # Local file storage
│   ├── server.js        # Entry point
│   └── seed.js          # Demo data seeder
│
├── client/
│   ├── src/
│   │   ├── app/         # Redux store
│   │   ├── components/  # Reusable UI components
│   │   ├── features/    # Redux slices
│   │   ├── hooks/       # Custom React hooks
│   │   ├── layouts/     # App shell, sidebar, navbar
│   │   ├── pages/       # Route-level page components
│   │   ├── services/    # Axios API layer
│   │   └── utils/       # Constants, helpers
│   ├── App.jsx
│   └── main.jsx
│
└── README.md
```

---

## Build Phases

1. ✅ **Scaffold** — Project structure, dependencies, health check
2. ✅ **Auth Module** — JWT auth, RBAC, login UI
3. ✅ **Clients & Users** — CRUD management
4. ✅ **Projects** — CRUD, status workflow
5. ✅ **Tasks** — Kanban, progress tracking
6. ✅ **Designs & Versioning** — File upload, version history
7. ✅ **Comments & Approvals** — Feedback workflow, audit trail
8. ✅ **Notifications** — Socket.IO real-time
9. ✅ **Dashboard** — Analytics charts
10. ✅ **Polish** — Tests, seed data, final QA

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to all resources |
| **Designer** | Assigned projects, tasks, design uploads |
| **Client** | Own projects, design review, approve/reject |
| **Project Manager** | (Optional) Manage deadlines & assignments |

---

## License

Private — HorseShoe Studio
