# 👨‍💻 Contributing to APIC Box

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### First Time Setup

```bash
# Clone and install
git clone <repo>
cd apic-box
pnpm install

# Start both services
pnpm start:dev  # or run start.bat on Windows
```

---

## Project Structure

```
apic-box/
├── apps/
│   ├── server/     # Hono + TypeScript backend
│   ├── client/     # React + Vite frontend
├── scripts/        # Utility scripts
└── docs/          # Documentation
```

---

## Making Changes

### Before Starting

1. Create a branch: `git checkout -b feature/my-feature`
2. Keep changes focused and atomic
3. Test thoroughly before committing

### Code Style

**TypeScript**

- Use strict mode
- Prefer `const` over `let`
- Always specify types explicitly
- Use functional components for React

**File Structure**

```
feature/
├── feature.ts       # Main logic
├── feature.types.ts # Type definitions
├── feature.test.ts  # Tests
└── index.ts         # Exports
```

**Naming Conventions**

- Files: `camelCase.ts` or `PascalCase.tsx`
- Functions/variables: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Adding Features

#### Adding a Server Endpoint

1. **Create handler in appropriate module**

```typescript
// apps/server/src/myfeature/handler.ts
export const handleMyFeature = async (c: Context) => {
    const body = await c.req.json();
    // Logic here
    return c.json({ success: true });
};
```

2. **Add route in router**

```typescript
// apps/server/src/router.ts
app.post('/api/myfeature', authMiddleware, handleMyFeature);
```

3. **Export from module**

```typescript
// apps/server/src/myfeature/index.ts
export { handleMyFeature } from './handler';
```

#### Adding a Client Page

1. **Create component**

```typescript
// apps/client/src/pages/MyPage.tsx
export const MyPage = () => {
  return <div>My Page</div>;
};
```

2. **Add route**

```typescript
// apps/client/src/main.tsx
{
  path: 'mypage',
  element: <MyPage />,
}
```

3. **Add navigation link**

```typescript
// apps/client/src/components/Navigation.tsx
<a href="/mypage">My Page</a>
```

### Adding Dependencies

**Server**

```bash
cd apps/server
pnpm add package-name
```

**Client**

```bash
cd apps/client
pnpm add package-name
```

### Testing Changes

**Manual Testing**

1. Start server: `cd apps/server && npm start`
2. Start client: `cd apps/client && npm run dev`
3. Navigate to feature in browser
4. Test happy path and error cases
5. Check browser console for errors
6. Check server logs

**Debugging**

- Browser: F12 → Console/Network tabs
- Server: Check terminal output
- Use `console.log()` with prefixes: `[ModuleName]`

---

## Common Development Tasks

### Debugging JWT Issues

1. Check `apps/server/src/config.ts` - JWT_SECRET must be constant
2. Look at `apps/server/src/auth/auth.ts` - signing and verification code
3. Client localStorage must match - clear if tokens are old

### Adding a New Database Entity

1. **Define type** in `apps/server/src/mything/mything.types.ts`

```typescript
export interface MyThing {
    id: string;
    name: string;
    createdAt: string;
}
```

2. **Create CRUD module** in `apps/server/src/mything/mything.ts`

```typescript
const DB_FILE = path.join(__dirname, '../../config/mythings.json');

export const loadMyThings = (): MyThing[] => {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
        return [];
    }
};

export const saveMyThings = (items: MyThing[]) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2));
};

export const addMyThing = (
    item: Omit<MyThing, 'id' | 'createdAt'>,
): MyThing => {
    const items = loadMyThings();
    const newItem: MyThing = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    saveMyThings(items);
    return newItem;
};
```

3. **Export from module** in `apps/server/src/mything/index.ts`

4. **Add routes** in `apps/server/src/router.ts`

### Updating Authentication

⚠️ **DO NOT CHANGE JWT_SECRET without clearing browser tokens**

If you must:

1. Modify `apps/server/src/config.ts`
2. Users must clear localStorage or run `node scripts/clear-tokens.js`
3. Users re-login to get new tokens

---

## Commit Guidelines

**Format**: `type: description`

**Types**:

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code reorganization
- `docs:` Documentation changes
- `chore:` Build, deps, tooling

**Examples**:

```
feat: add event filtering by category
fix: resolve JWT token verification error
docs: update authentication guide
```

---

## Pull Request Process

1. **Keep PRs focused** - One feature per PR
2. **Update docs** if behavior changes
3. **Test before submitting**
4. **Write clear PR description**
5. **Link related issues**

### PR Checklist

- [ ] Code follows project style
- [ ] New files have appropriate exports
- [ ] Tests pass (if applicable)
- [ ] No console errors in browser
- [ ] No console errors in server
- [ ] Documentation updated
- [ ] Commits are clean and focused

---

## Troubleshooting During Development

### "Module not found" error

```
Check:
- File exists at specified path
- Export statement in module index.ts
- Import path is correct
- TypeScript paths in tsconfig.json
```

### "Port already in use"

```
# Find what's using the port
lsof -i :3001
# or on Windows
netstat -ano | findstr :3001

# Kill the process
kill -9 <PID>
# or on Windows
taskkill /PID <PID> /F
```

### Hot reload not working

```
# Restart the dev server
Ctrl+C
npm run dev
```

### Type errors after dependency update

```
# Reinstall types
pnpm install --save-dev @types/package-name

# Or rebuild
pnpm install
npm run build
```

---

## Performance Considerations

### Client

- Use React.memo for expensive components
- Lazy-load pages with React.lazy()
- Minimize bundle size - check Vite analysis
- Use virtual scrolling for long lists

### Server

- Index JSON queries for O(1) lookup if data grows
- Implement pagination for large datasets
- Cache frequently accessed data
- Consider moving to real database for production

---

## Security Notes

### Authentication

- JWT_SECRET is NOT secret (hardcoded in code)
- For production, use strong environment variables
- Never log JWT tokens
- Always verify tokens server-side

### Data

- Validate all user input with Zod
- Sanitize before storing/displaying
- Use HTTPS in production
- Implement CORS properly

### Development

- Don't commit secrets/API keys
- Use .gitignore for local configs
- Review changes before committing
- Keep dependencies updated

---

## Documentation Updates

When making changes, update relevant docs:

- **Feature change**: Update README.md
- **API change**: Update endpoint docs
- **Authentication change**: Update AUTHENTICATION_GUIDE.md
- **Bug fix**: Add to TROUBLESHOOTING.md if user-facing

---

## Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Docs**: https://react.dev/
- **Hono Guide**: https://hono.dev/docs/
- **Vite Guide**: https://vitejs.dev/guide/

---

## Getting Help

- Check existing issues/PRs
- Review documentation
- Ask in PR comments
- Check git history for similar changes

---

## Code Examples

### Proper Module Structure

```typescript
// feature/types.ts
export interface User {
  id: string;
  name: string;
}

// feature/feature.ts
import type { User } from './feature.types';

export const getUser = (id: string): User | null => {
  // Implementation
};

// feature/index.ts
export * from './feature';
export type * from './feature.types';

// router.ts
import { getUser } from './feature';

app.get('/api/users/:id', async (c) => {
  const user = getUser(c.req.param('id'));
  return c.json(user);
});
```

### Error Handling

```typescript
export const safeOperation = async () => {
    try {
        const result = await riskyOperation();
        return { success: true, data: result };
    } catch (error) {
        console.error('[FeatureName] Error:', error);
        return { success: false, error: 'Operation failed' };
    }
};
```

---

**Happy coding!** 🚀
