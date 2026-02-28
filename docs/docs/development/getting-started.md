---
sidebar_position: 1
title: Getting Started
---

# Getting Started

Run the full MediSage stack locally in a few minutes.

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20.x |
| npm | 9.x |
| MongoDB | 6.x (local or Atlas) |
| Redis | 7.x (local or Redis Cloud) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/atharva038/HackFusion-2k26-Team-LUXRAY-.git
cd HackFusion-2k26-Team-LUXRAY-
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
# Edit .env with your credentials
```

Start the development server:

```bash
npm run dev
# Server starts at http://localhost:5000
```

---

## 3. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
# Frontend starts at http://localhost:5173
```

Visit [http://localhost:5173](http://localhost:5173).

---

## 4. Seed the Database (optional)

Populate the medicines catalog with sample data:

```bash
cd backend
npm run seed
```

---

## 5. Create an Admin User

```bash
cd backend
npm run create-admin
# Follow the prompts for email and password
```

Login at `/login` with admin credentials to access `/admin`.

---

## Backend Commands

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm run start` | Production start |
| `npm run seed` | Seed database with sample medicines |
| `npm run create-admin` | Interactive admin user creation |
| `npm run test` | Run Vitest tests once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Frontend Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint check |

---

## Common Issues

### MongoDB not running

```bash
# Start MongoDB locally
sudo systemctl start mongod
# Or use Atlas — set MONGODB_URI in .env
```

### Redis not running

```bash
sudo systemctl start redis
# Or use Redis Cloud — set REDIS_URL in .env
```

### Port conflicts

Default ports:
- Backend: `5000` (set via `PORT` env var)
- Frontend: `5173` (Vite default)

### CORS errors

Make sure `FRONTEND_URL` in backend `.env` matches exactly where your frontend runs (including port).

---

## Docs Site

To run this documentation site locally:

```bash
cd docs
npm install
npm run start
# Docs at http://localhost:3000
```
