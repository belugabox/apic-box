# APIC Box - Troubleshooting Guide

## Common Issues and Solutions

---

## 🔴 Issue 1: "JsonWebTokenError: invalid signature"

### Symptom

```
Server logs show: JsonWebTokenError: invalid signature
Browser shows: Unauthorized or Error
```

### Cause

JWT token in localStorage was created with different secret than current app.

### Solution

**Option A: Quick (Browser)**

1. F12 → Application → Local Storage → Select localhost:3001
2. Delete: `accessToken`, `refreshToken`, `user`
3. F5 to refresh
4. Login again with `admin`/`admin`

**Option B: Script**

```bash
node scripts/clear-tokens.js
```

**Option C: Hard Reset**

1. Ctrl+Shift+Delete (Clear browsing data)
2. Check "Cookies and other site data"
3. Clear
4. Refresh page
5. Login again

---

## 🔴 Issue 2: "Cannot GET /admin"

### Symptom

Navigating to `/admin` shows blank page or 404

### Cause

Route not found or navigation issue

### Solution

1. Check browser console (F12) for errors
2. Make sure you're navigating to `/` first, then click "Admin" link
3. Verify `apps/client/src/main.tsx` has Admin route
4. Hard refresh: Ctrl+F5

---

## 🔴 Issue 3: Server won't start

### Symptom

```
Error: Port 3001 already in use
or
Error: Cannot find module 'hono'
```

### Solution

**If port in use:**

```bash
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or use different port:
PORT=3002 npm start
```

**If modules missing:**

```bash
# Go to server folder
cd apps/server

# Reinstall dependencies
rm -r node_modules
npm install

# Or use pnpm
pnpm install
```

---

## 🔴 Issue 4: Client won't start

### Symptom

```
Error: ENOENT: no such file or directory
or
Vite error
```

### Solution

```bash
# Go to client folder
cd apps/client

# Clear cache and reinstall
rm -r node_modules
pnpm install

# Start dev server
npm run dev
```

---

## 🔴 Issue 5: Events not showing in Admin

### Symptom

Login works, but dashboard is empty

### Cause

1. Events not in database yet
2. API call failing silently
3. Browser cache issue

### Solution

1. Check browser console (F12) for errors
2. Check server logs for 401 or API errors
3. Try creating an event (should appear in list)
4. Verify `apps/server/config/events.json` exists and has data:
    ```bash
    cat apps/server/config/events.json
    ```

---

## 🔴 Issue 6: Login fails with "Login failed. Please check your credentials."

### Symptom

Get error even with correct credentials

### Cause

1. Server not running
2. Database corrupted
3. Password hash mismatch

### Solution

**Check server is running:**

```bash
curl http://localhost:3001/api/health
# Should return 200 OK
```

**Check users.json:**

```bash
cat apps/server/config/users.json
```

Should contain:

```json
{
    "admin": {
        "username": "admin",
        "password": "hashed_password",
        "role": "admin"
    }
}
```

**Reset admin password:**

1. Delete `apps/server/config/users.json`
2. Restart server (it will recreate with default password)
3. Default: `admin` / `admin`

---

## 🟡 Issue 7: Events not persisting

### Symptom

Create event → Refresh page → Event disappears

### Cause

Events file not being saved

### Solution

1. Check `apps/server/config/events.json` exists:

    ```bash
    ls -la apps/server/config/
    ```

2. Check file permissions (should be writable):

    ```bash
    # On Windows - file should not be read-only
    attrib apps/server/config/events.json
    ```

3. Check server logs for save errors:

    ```
    Look for: "[Events] Saved" or "Error saving"
    ```

4. Try creating event and check file immediately:

    ```bash
    # In one terminal
    npm start

    # In another
    while true; do echo "=== Events ==="; cat apps/server/config/events.json | jq .; sleep 2; done
    ```

---

## 🟡 Issue 8: CORS errors

### Symptom

```
Access to XMLHttpRequest blocked by CORS policy
```

### Cause

Frontend and backend on different origins with CORS not configured

### Solution

If you deployed client and server to different hosts:

Edit `apps/server/src/router.ts`:

```typescript
import { cors } from 'hono/cors';

// Add this to app
app.use(
    '/api/*',
    cors({
        origin: 'https://yourdomain.com', // or '*' for dev
    }),
);
```

For development (localhost):

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`
- Should work by default ✓

---

## 🟢 Debug Mode - Enable Verbose Logging

### Server

Edit `apps/server/src/auth/auth.ts` and `apps/server/src/config.ts`:

The logging is already added:

```
[CONFIG] JWT_SECRET length: X
[Auth] Attempting login for: admin
[Auth] Login successful, storing tokens
```

View in: Server console

### Client

Open browser DevTools: `F12`

Go to Console tab, you'll see:

```
[Auth] Attempting login for: admin
[Auth] Login successful, storing tokens
[App] Starting up...
[EventService] Got 401 - token invalid
```

---

## ✅ Checklist - Is Everything Working?

Use this to verify your setup:

```
[ ] Server running on http://localhost:3001
    curl http://localhost:3001/api/health

[ ] Client running on http://localhost:5173
    browser → http://localhost:5173

[ ] Can navigate to Events page
    should see public events list

[ ] Can navigate to Admin page
    should see login modal

[ ] Can login with admin/admin
    username: admin
    password: admin

[ ] After login, Admin page shows
    - List of events
    - Create event form

[ ] Can create a new event
    - Fill form
    - Click submit
    - Event appears in list

[ ] Event persists after refresh
    - Refresh page (F5)
    - Event still there

[ ] Browser console shows no red errors
    F12 → Console tab

[ ] Server console shows login logs
    [Auth] Login successful...

```

If all checked ✅ - **You're good to go!**

---

## 📞 Need More Help?

Check these files:

- **docs/AUTHENTICATION.md** - JWT authentication details
- **docs/CHANGELOG.md** - Full list of changes
- **apps/server/src/config.ts** - JWT configuration
- **apps/server/src/auth/auth.ts** - Authentication logic

---

## 🔧 Advanced - Manual Token Generation

If you need to manually create a token for testing:

```bash
# In Node.js REPL:
node

> const jwt = require('jsonwebtoken');
> const secret = 'apic-box-secret-key-change-in-production';
> const token = jwt.sign({username: 'admin', role: 'admin'}, secret, {expiresIn: '15m'});
> console.log(token);
# Copy this token and use it in API calls
```

Then use in requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/admin/events
```

---

**Last Updated:** 2025-06-05
**Status:** Production Ready ✅
