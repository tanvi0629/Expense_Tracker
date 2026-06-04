# 💸 Expense Tracker — Full Stack App

A modern full-stack Expense Tracker with Firebase Authentication, React frontend, Express backend, and PostgreSQL database.

---

## 🗂 Project Structure

```
expense-tracker/
├── frontend/          # React + Vite app (deploy to Vercel)
├── backend/           # Express + PostgreSQL API (deploy to Render)
└── README.md
```

---

## ⚙️ Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Firebase Project (with Auth enabled)
- Google Cloud project linked to Firebase

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in methods:
   - Email/Password ✅
   - Google ✅
   - Phone ✅
4. Go to **Project Settings** → Web app → Copy config
5. Go to **Project Settings** → Service accounts → Generate new private key (for backend)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment Variables

**Frontend** — copy `frontend/.env.example` → `frontend/.env`
**Backend** — copy `backend/.env.example` → `backend/.env`

Fill in Firebase credentials and DB connection string.

### 3. Setup PostgreSQL

```bash
cd backend
npm run db:migrate
```

### 4. Run Dev Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard (same as `.env`).

### Backend → Render

1. Create new **Web Service** on [Render](https://render.com)
2. Connect GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `backend/.env.example`
6. Add a **PostgreSQL** database from Render dashboard
7. Copy the `DATABASE_URL` to your service env vars

---

## 📋 API Endpoints

All routes (except `/api/auth/*`) require `Authorization: Bearer <jwt>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/verify` | Verify Firebase token, create user |
| GET | `/api/expenses` | Get all expenses (with filters) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/export/csv` | Export expenses as CSV |
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update user (budget, name) |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Auth | Firebase v9 (Email, Google, Phone) |
| Backend | Express.js, Node.js 18 |
| Database | PostgreSQL + pg |
| Deployment | Vercel (FE), Render (BE) |
