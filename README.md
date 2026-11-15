# 🌟 The Golden Circle

> Where Startups Meet Talent

A premium full-stack startup ecosystem platform built with the MERN stack.

## Project Structure

```
golden-circle/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── package.json     # Monorepo root
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Setup

1. Configure backend environment:
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

2. Install dependencies:
```bash
npm run install:all
```

3. Start development:
```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

### URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Tech Stack

| Layer     | Technology                              |
|-----------|----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS v4        |
| Backend   | Node.js, Express.js                    |
| Database  | MongoDB Atlas + Mongoose               |
| Auth      | JWT (Phase 2)                          |
| Media     | Cloudinary (Phase 2)                   |

## Development Phases

- **Phase 1** ✅ — Project scaffold, design system, health check
- **Phase 2** — Authentication (User registration, login, JWT)
- **Phase 3** — Organization profiles
- **Phase 4** — Jobs & opportunities
- **Phase 5** — Events & community
