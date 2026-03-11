# University Club Equipment Borrowing System

Full-stack project for managing university club equipment borrowing with two roles: student user and admin. The project is set up to run locally with npm or with a single Docker Compose command for grading.

## Stack

- Frontend: React, Vite, TailwindCSS, Axios, React Router
- Backend: Node.js, Express, TypeScript, JWT Authentication
- Database: SQLite
- DevOps: Docker, Docker Compose

## Main folders

```text
frontend
backend
database
SRS
```

## Features

- Register and login with JWT
- Student dashboard with due-soon reminders
- Equipment listing with search and category filter
- Borrow workflow: `PENDING -> APPROVED -> RETURN_PENDING -> RETURNED`
- Admin dashboard with quick statistics
- Admin equipment management
- Admin approval and return confirmation
- Equipment condition status: `NORMAL` or `DAMAGED`

## Default accounts

- Admin
  - Email: `admin@club.com`
  - Password: `admin123`
- Student demo
  - Email: `alice@student.edu`
  - Password: `admin123`

## Method 1: Run with npm

Open 2 terminals from the project root.

Backend:

```powershell
cd backend
npm install
npm run dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## Method 2: Run with Docker

From the project root:

```powershell
docker-compose up --build
```

URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## Environment

You can copy `.env.example` to `.env` if you want to override defaults, but the project can run with the default values included in code and compose.

Example values:

```env
PORT=5000
JWT_SECRET=super-secret-university-key
TOKEN_EXPIRES_IN=7d
DATABASE_PATH=./backend/data/university-club.db
CORS_ORIGIN=*
REMINDER_DAYS=3
VITE_API_URL=http://localhost:5000/api
```

## Multi-device testing (important)

If two people test on different computers, both frontends must call the same backend and database.

Use one machine as server:

1. Start backend on server machine (`npm run dev` in `backend` or Docker).
2. Start frontend on server machine, or host static frontend there.
3. On client machines, set `VITE_API_URL` to server IP, for example:

```env
VITE_API_URL=http://192.168.1.10:5000/api
```

If each machine runs its own backend at `localhost:5000`, data will be separate and borrow requests will not appear across machines.

## Important API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/equipment`
- `POST /api/equipment`
- `PUT /api/equipment/:id`
- `DELETE /api/equipment/:id`
- `POST /api/borrow/request`
- `GET /api/borrow/user`
- `GET /api/borrow/all`
- `PUT /api/borrow/approve/:id`
- `PUT /api/borrow/return/:id`
- `PUT /api/borrow/confirm-return/:id`

## Notes

- SQLite database file is created automatically on first backend start.
- Seed data is inserted automatically only when the database is empty.
- The `SRS` folder is kept for the Software Requirements Specification document prepared by the user.