# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MERN stack application for PC build configuration with compatibility validation. Connects users, PC assemblers, and suppliers through role-based access (user, admin, assembler, supplier).

## Development Commands

### Backend (server/)
```powershell
# Install dependencies
npm install --prefix server

# Start development server with hot-reload
npm run dev --prefix server

# Start production server
npm run start --prefix server

# Seed database with test data (4 users + 24 components)
npm run seed --prefix server
```

### Frontend (client/)
```powershell
# Install dependencies
npm install --prefix client

# Start Vite dev server (http://localhost:5173)
npm run dev --prefix client

# Build for production
npm run build --prefix client

# Lint code
npm run lint --prefix client
```

### Running Both
Start backend and frontend in separate terminals. Backend runs on port 5000, frontend on 5173.

## Environment Setup

**server/.env** (copy from env.template):
- `PORT` - Server port (default 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing

**client/.env** (optional):
- `VITE_API_URL` - Backend API URL (default http://localhost:5000/api)

## Test Accounts (after running seed)

All passwords: `password123`
- Admin: admin@example.com
- User: user@example.com
- Assembler: assembler@example.com
- Supplier: supplier@example.com

## Architecture

### Authentication Flow
- JWT tokens stored in localStorage on the client
- `server/middleware/auth.js` exports `protect` (verifies token) and `authorize(...roles)` (checks role permissions)
- Client uses `AuthContext` (src/context/AuthContext.jsx) with `useAuth()` hook for auth state
- `ProtectedRoute` component handles frontend route protection

### API Structure
All routes prefixed with `/api/`:
- `/auth` - Register, login, get current user
- `/components` - CRUD for PC components (role-restricted create/update/delete)
- `/builds` - PC build management with status workflow
- `/users` - User management (admin only)
- `/categories` - Component categories
- `/transactions` - Payment/transaction records

### Component Compatibility System
`server/utils/compatibilityChecker.js` validates PC builds:
- CPU/Motherboard socket matching (LGA 1700, AM4, etc.)
- Chipset compatibility (Z690, B550, X570, etc.)
- Case/Motherboard form factor (ITX < M-ATX < ATX < E-ATX)
- RAM type matching (DDR4 vs DDR5)
- PSU wattage sufficiency

Components use structured fields: `socket`, `chipset`, `formFactor`, `ramType`, `wattage`, `powerRequirement`, `storageInterface`

### Build Status Workflow
Builds follow: `pending` → `assembling` → `completed`
- Users create builds, admins assign to assemblers
- Assemblers update status through the workflow

### Role-Based Access Pattern
Backend routes use middleware chain: `protect, authorize('admin', 'supplier')`
Frontend uses role checks in page components and `ProtectedRoute` with allowed roles.

### API Client
`client/src/utils/api.js` - Axios instance with:
- Base URL from environment
- Authorization header interceptor (attaches JWT from localStorage)
