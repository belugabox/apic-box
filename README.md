# 🎯 APIC Box

> Event management system with React frontend and Hono backend  
> Reorganized to follow modern microservice patterns

---

## ✨ Features

- 📅 **Event Management** - Create, view, and manage events
- 👥 **User Registration** - Register users for events
- 🔐 **JWT Authentication** - Secure admin panel with JWT tokens
- 💾 **File-based Persistence** - JSON storage (no DB needed for dev)
- ⚡ **Real-time UI** - React with TypeScript for type safety
- 🎨 **Minimal UI** - BeerCSS for lightweight styling
- 🔄 **Modular Architecture** - Clean separation of concerns

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Start server** (Terminal 1)

```bash
cd apps/server
npm start
# Server running on http://localhost:3001
```

**3. Start client** (Terminal 2)

```bash
cd apps/client
npm run dev
# Client running on http://localhost:5173
```

**4. Open in browser**

- Navigate to `http://localhost:5173`
- Login with `admin` / `admin`
- Manage events!

### Windows Quick Start

```bash
# One-click start both server and client
start.bat
```

---

## 📁 Project Structure

```
apic-box/
├── apps/
│   ├── server/                 # Backend (Hono + Node.js)
│   │   ├── src/
│   │   │   ├── config.ts              # JWT secrets (★ NEW)
│   │   │   ├── auth/                  # Authentication module
│   │   │   │   ├── auth.ts
│   │   │   │   └── index.ts
│   │   │   ├── events/                # Events module
│   │   │   │   ├── events.ts
│   │   │   │   ├── events.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── main.ts                # Server startup
│   │   │   └── router.ts              # API routes
│   │   ├── config/                    # Data storage (JSON)
│   │   │   ├── users.json
│   │   │   ├── events.json
│   │   │   └── registrations.json
│   │   └── package.json
│   │
│   └── client/                 # Frontend (React + Vite)
│       ├── src/
│       │   ├── App.tsx                # Root component
│       │   ├── main.tsx               # Entry point
│       │   ├── components/
│       │   │   ├── Navigation.tsx
│       │   │   └── EventCard.tsx
│       │   ├── pages/
│       │   │   ├── Home.tsx
│       │   │   ├── Events.tsx         # Public events list
│       │   │   └── Admin.tsx          # Admin dashboard (★ NEW)
│       │   └── services/
│       │       ├── auth/
│       │       │   └── auth.ts        # Login/logout
│       │       ├── event/
│       │       │   └── event.ts       # Event API calls
│       │       └── server.ts          # API client
│       └── package.json
│
├── docs/                              # 📚 Documentation
│   ├── AUTHENTICATION.md              # JWT authentication guide
│   ├── CHANGELOG.md                   # Full list of changes
│   ├── TROUBLESHOOTING.md             # Common issues & solutions
│   ├── CONTRIBUTING.md                # Developer guidelines
│   ├── QUICK_REFERENCE.md             # Quick cheatsheet
│   ├── COMPLETION.md                  # Project completion report
│   └── INDEX.md                       # Documentation index
│
├── scripts/
│   └── clear-tokens.js                # Token cleanup utility
├── README.md                          # This file (entry point)
└── package.json
```

---

## 🔑 Key Improvements in This Version

### ✅ Architecture Reorganization

- **Before**: Flat file structure with duplication
- **After**: Modular architecture (auth/, events/, config.ts) like beluga-box
- **Benefit**: Scalable, maintainable, easier to add features

### ✅ JWT Security Fix (CRITICAL)

- **Problem**: "invalid signature" errors when verifying tokens
- **Root Cause**: JWT secret was re-evaluated, causing different signatures
- **Solution**: Centralized JWT secrets in `config.ts`
- **Result**: Tokens now work correctly ✓

### ✅ Frontend Simplification

- **Removed**: Settings page (redundant)
- **Merged**: Login into Admin page (modal overlay)
- **Result**: 3 clean pages (Home, Events, Admin)

### ✅ Error Handling

- Auto-clear invalid tokens (401 errors)
- Better error messages
- Comprehensive logging for debugging

---

## 🔐 Authentication

### Login

```
Username: admin
Password: admin
```

### How It Works

```
User Login
  ↓
POST /api/auth/login { username, password }
  ↓
Server: Hash check + JWT generation
  ↓
Client: Store tokens in localStorage
  ↓
Authorization: Bearer <token>
  ↓
Server: Verify token with same JWT_SECRET
  ↓
Access Granted ✓
```

### JWT Configuration

Located in `apps/server/src/config.ts`:

```typescript
export const JWT_SECRET =
    process.env.JWT_SECRET || 'apic-box-secret-key-change-in-production';
export const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    'apic-box-refresh-secret-key-change-in-production';
```

For production, use environment variables:

```bash
export JWT_SECRET=your-production-secret
export JWT_REFRESH_SECRET=your-production-refresh-secret
npm start
```

---

## 📚 API Endpoints

### Public Endpoints

**Get all events**

```
GET /api/events
Response: Event[]
```

**Register for event**

```
POST /api/events/{eventId}/register
Body: { name: string, email: string }
Response: { id: string, ...registration }
```

### Protected Endpoints (requires JWT token)

**Get admin events**

```
GET /api/admin/events
Header: Authorization: Bearer <token>
Response: Event[]
```

**Create event**

```
POST /api/admin/events
Header: Authorization: Bearer <token>
Body: { title, description, type, status }
Response: { id: string, ...event }
```

**Get event registrations**

```
GET /api/events/{eventId}/registrations
Header: Authorization: Bearer <token>
Response: Registration[]
```

---

## 🛠️ Development

### Available Scripts

**Server**

```bash
cd apps/server
npm start        # Run in production mode
npm run dev      # Run with hot reload (nodemon)
npm run build    # TypeScript build
```

**Client**

```bash
cd apps/client
npm run dev      # Dev server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Setup

**Create `.env` file in `apps/server/`:**

```
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3001
```

**Create `.env` file in `apps/client/`:**

```
VITE_API_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### "JsonWebTokenError: invalid signature"

→ See **TROUBLESHOOTING.md** section "Issue 1"

### Server won't start

→ Check if port 3001 is in use: `netstat -ano | findstr :3001`

### Events not showing

→ Check `apps/server/config/events.json` exists and is readable

### More Issues?

📖 Read **TROUBLESHOOTING.md** for detailed solutions

---

## 📖 Documentation

All documentation is organized in the `docs/` folder:

- **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - JWT auth details & debugging
- **[docs/CHANGELOG.md](./docs/CHANGELOG.md)** - Complete changelog
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Common issues & solutions
- **[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Developer guidelines
- **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Quick cheatsheet
- **[docs/INDEX.md](./docs/INDEX.md)** - Complete documentation index

---

## 🧪 Testing Workflow

1. **Create Event (Admin)**
    - Navigate to `/admin`
    - Login with `admin`/`admin`
    - Fill event form
    - Click "Create"
    - ✓ Event appears in list
    - ✓ Persists in `config/events.json`

2. **View Events (Public)**
    - Navigate to `/events`
    - ✓ See all created events
    - ✓ See event details (title, description, type)

3. **Register for Event (Public)**
    - On event card, fill registration form
    - Click "Register"
    - ✓ Confirmation appears
    - ✓ Registration saved in `config/registrations.json`

4. **View Registrations (Admin)**
    - Go to `/admin`
    - Expand event details
    - ✓ See all registrations for that event

---

## 🔄 State Management

### Client-Side Storage

- **localStorage**: JWT tokens + user info
    - `accessToken` - Short-lived (15m)
    - `refreshToken` - Long-lived (7d)
    - `user` - Current user JSON

- **React State**: Events, forms, UI state

### Server-Side Storage

- **JSON Files**: `config/` directory
    - `users.json` - User credentials
    - `events.json` - Event data
    - `registrations.json` - User registrations

---

## 📦 Dependencies

### Server

- **hono** - Lightweight web framework
- **jsonwebtoken** - JWT token handling
- **bcryptjs** - Password hashing
- **zod** - Data validation

### Client

- **react** - UI framework
- **react-router** - Client-side routing
- **vite** - Build tool & dev server
- **beercss** - Minimal CSS framework
- **hono/client** - Type-safe API client

---

## 🚢 Deployment

### Build for Production

**Server**

```bash
cd apps/server
npm run build
npm start  # Runs built files
```

**Client**

```bash
cd apps/client
npm run build
# Outputs to dist/ - serve with any static host
```

### Docker

```bash
docker build -t apic-box .
docker run -p 3001:3001 -p 5173:5173 apic-box
```

See **Dockerfile** for details.

---

## 🎓 Learning Resources

- **JWT Tokens**: https://jwt.io/
- **Hono Framework**: https://hono.dev/
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **BeerCSS**: https://www.beercss.com/

---

## 📝 License

MIT

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a PR

---

## 📧 Support

- 📖 Check the [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) guide
- 🔍 Review [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)
- 📋 See [docs/CHANGELOG.md](./docs/CHANGELOG.md) for full changelog

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-06-05  
**Version**: 2.0 (Reorganized with JWT fix)
