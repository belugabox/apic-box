# ⚡ APIC Box - Quick Reference

## 🚀 Start Development

```bash
# Terminal 1 - Server
cd apps/server && npm start

# Terminal 2 - Client
cd apps/client && npm run dev
```

---

## 🔗 URLs

| Service    | URL                            | Purpose         |
| ---------- | ------------------------------ | --------------- |
| Client     | `http://localhost:5173`        | React frontend  |
| Server API | `http://localhost:3001/api`    | Backend API     |
| Events     | `http://localhost:5173/events` | Public events   |
| Admin      | `http://localhost:5173/admin`  | Admin dashboard |

---

## 🔐 Default Credentials

```
Username: admin
Password: admin
```

---

## 📂 Key Files

### Backend

| File                               | Purpose        |
| ---------------------------------- | -------------- |
| `apps/server/src/config.ts`        | ⭐ JWT secrets |
| `apps/server/src/auth/auth.ts`     | Authentication |
| `apps/server/src/events/events.ts` | Event CRUD     |
| `apps/server/src/router.ts`        | API routes     |
| `apps/server/config/users.json`    | User database  |
| `apps/server/config/events.json`   | Event database |

### Frontend

| File                                      | Purpose       |
| ----------------------------------------- | ------------- |
| `apps/client/src/App.tsx`                 | Root layout   |
| `apps/client/src/pages/Admin.tsx`         | Admin page    |
| `apps/client/src/pages/Events.tsx`        | Events page   |
| `apps/client/src/services/auth/auth.ts`   | Login service |
| `apps/client/src/services/event/event.ts` | Event service |

---

## 🛣️ API Endpoints

### Public

```
GET  /api/events                      # List all events
POST /api/events/{id}/register        # Register for event
```

### Protected (needs JWT token)

```
GET  /api/admin/events                # List events (admin)
POST /api/admin/events                # Create event
GET  /api/events/{id}/registrations   # Get registrations
```

---

## 🔧 Common Commands

### Server

```bash
cd apps/server

npm start                  # Run server
npm run dev                # Run with hot reload
npm run build              # Build TypeScript
```

### Client

```bash
cd apps/client

npm run dev                # Dev server
npm run build              # Production build
npm run lint               # ESLint check
```

### Project-wide

```bash
pnpm install              # Install all deps
pnpm update               # Update all deps
```

---

## 📝 TypeScript Paths

Quick shortcuts for imports:

```typescript
// Server
import type { Event } from '@server/events';
import { getEvents } from '@server/events';

// Client - handled by Vite automatically
```

---

## 🐛 Debug Checklist

### Browser Console (F12)

```
Look for:
[ ] No red errors
[ ] "[Auth] Login successful..." on login
[ ] "[EventService]" calls showing success
```

### Server Console

```
Look for:
[ ] "Server running on http://localhost:3001"
[ ] "[Auth] Login successful..." on login
[ ] "[Events] Saved" after creating event
```

### Files

```
Check:
[ ] apps/server/config/events.json has new events
[ ] apps/server/config/registrations.json has registrations
```

---

## ⚠️ Common Issues

### "JsonWebTokenError: invalid signature"

→ Clear localStorage: F12 → Application → Local Storage → Delete all  
→ Refresh and re-login

### Server won't start

→ Check port: `netstat -ano | findstr :3001`  
→ Or use different: `PORT=3002 npm start`

### Events not showing

→ Check file exists: `ls apps/server/config/events.json`  
→ Verify it has content (not empty array)

### Client can't reach server

→ Check server is running: `curl http://localhost:3001/api/health`  
→ Check client trying right URL in services

---

## 🔄 Git Workflow

```bash
# Before making changes
git checkout main
git pull

# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... code ...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature

# Create PR on GitHub
```

---

## 📊 File Sizes

Keep these reasonable:

- TypeScript files: < 500 lines
- React components: < 400 lines
- JSON config files: < 1MB

---

## 🧪 Manual Testing Scenario

1. **Start services** - Both running on correct ports ✓
2. **Open** `http://localhost:5173` ✓
3. **Click Events** - See public events list ✓
4. **Click Admin** - See login modal ✓
5. **Login** - `admin` / `admin` ✓
6. **See dashboard** - List of events ✓
7. **Create event** - Fill form, submit ✓
8. **Verify** - New event in list ✓
9. **Refresh page** - Event still there ✓
10. **Check file** - `apps/server/config/events.json` has event ✓

All ✓? **You're good!**

---

## 📚 Documentation

- Full guide: **README.md**
- Auth details: **docs/AUTHENTICATION.md**
- All changes: **docs/CHANGELOG.md**
- Issues & fixes: **docs/TROUBLESHOOTING.md**
- Dev guide: **docs/CONTRIBUTING.md**

---

## ⌨️ Keyboard Shortcuts

### Browser DevTools

```
F12              Open DevTools
Ctrl+Shift+I     Open DevTools (alternate)
Ctrl+Shift+J     Open Console
Ctrl+Shift+K     Open Console (alternate)
Ctrl+Shift+Delete Clear site data
```

### VS Code

```
Ctrl+`           Toggle terminal
Ctrl+B           Toggle explorer
Ctrl+Shift+P     Command palette
Ctrl+F           Find in file
Ctrl+H           Find & replace
```

### Git

```
git status       Check changes
git diff         See changes
git log          View history
git reflog       Undo mistakes
```

---

## 🚨 Breaking Changes Checklist

If modifying these, notify team:

- [ ] JWT_SECRET changed
- [ ] API endpoints changed
- [ ] Database schema changed
- [ ] Authentication flow changed
- [ ] Environment variables changed

---

## 📞 Quick Links

- **API Docs**: See docs/AUTHENTICATION.md
- **Types**: Check `apps/server/src/*/**.types.ts`
- **Examples**: Grep for `// Example:` in code
- **TODOs**: Grep for `// TODO:` in code

---

## 🎯 Performance Tips

- Restart dev server if hot reload doesn't work
- Clear `node_modules` if weird errors: `rm -rf node_modules && pnpm install`
- Use `pnpm` instead of `npm` for faster installs
- Check `pnpm-lock.yaml` before committing changes

---

**Print this page for quick reference!** 📋
