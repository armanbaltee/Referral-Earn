# ChainX

**ChainX** is a production-grade affiliate, product, wallet, and task management platform built on the MERN Stack with TypeScript.

---

## Tech Stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Frontend   | React 18 + Vite + TypeScript (strict)                 |
| Styling    | Tailwind CSS + shadcn/ui + Radix UI                   |
| Animations | Framer Motion                                         |
| State      | Zustand + TanStack Query v5                           |
| Forms      | React Hook Form + Zod                                 |
| Charts     | Recharts                                              |
| API Client | Axios                                                 |
| Backend    | Node.js + Express.js + TypeScript                     |
| Database   | MongoDB + Mongoose                                    |
| Auth       | JWT Access + Refresh Token                            |
| Validation | Zod                                                   |
| Docs       | Swagger / OpenAPI 3.0                                 |
| Testing    | Vitest + Supertest                                    |
| Storage    | Cloudinary                                            |
| Deployment | Vercel (client) + Render/VPS (server) + MongoDB Atlas |

---

## Project Structure

```
chainx/
├── client/          # React + Vite frontend
├── server/          # Express + MongoDB backend
├── docs/            # Architecture & API documentation
├── package.json     # Root monorepo (npm workspaces)
├── tsconfig.base.json
└── .gitignore
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- MongoDB ≥ 6.0 (local or Atlas)

### 1. Clone & install

```bash
git clone <repo-url> chainx
cd chainx
npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
```

### 3. Start development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs
- Health Check: http://localhost:5000/api/v1/health

---

## Available Scripts

| Script              | Description                           |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start frontend + backend concurrently |
| `npm run build`     | Build both for production             |
| `npm run start`     | Start production server               |
| `npm run typecheck` | TypeScript check (both)               |
| `npm run lint`      | ESLint check (both)                   |
| `npm run lint:fix`  | Auto-fix lint issues                  |
| `npm run test`      | Run all tests                         |
| `npm run format`    | Format all files with Prettier        |

---

## Environment Variables

See [`server/.env.example`](./server/.env.example) and [`client/.env.example`](./client/.env.example).

> ⚠️ **Never commit `.env` files.** They are in `.gitignore`.

---

## Architecture

- **Backend**: Module-based architecture — each domain module has `model`, `validation`, `service`, `controller`, `routes`, and `types` files.
- **Frontend**: Feature-sliced architecture — features are self-contained with their own components, hooks, services, and types.
- **Financial**: All monetary values stored as **integer paisa** (PKR minor units). Displayed as `PKR X.XX` in the UI.
- **Security**: JWT access tokens (15m) + refresh tokens (7d via httpOnly cookie), RBAC, rate limiting, helmet, mongo-sanitize.

---

## API Versioning

All API routes are prefixed with `/api/v1/`.

---

## Documentation

| Doc                                           | Description                      |
| --------------------------------------------- | -------------------------------- |
| [API.md](./docs/API.md)                       | API endpoints reference          |
| [DATABASE.md](./docs/DATABASE.md)             | Database schema & relationships  |
| [BUSINESS_LOGIC.md](./docs/BUSINESS_LOGIC.md) | Business rules & financial logic |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md)         | Deployment guide                 |

---

## Development Phases

- ✅ **Phase 1** – Project initialization & architecture
- 🔲 **Phase 2** – Authentication (register, login, refresh, logout)
- 🔲 **Phase 3** – Dashboard & user profile
- 🔲 **Phase 4** – Products & orders
- 🔲 **Phase 5** – Wallet & financial transactions
- 🔲 **Phase 6** – Deposits (Easypaisa/JazzCash)
- 🔲 **Phase 7** – Withdrawals
- 🔲 **Phase 8** – Referrals & commissions
- 🔲 **Phase 9** – Tasks & submissions
- 🔲 **Phase 10** – Notifications & announcements
- 🔲 **Phase 11** – Admin panel
