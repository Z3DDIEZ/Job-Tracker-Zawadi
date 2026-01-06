# Setup Guide: Enhanced Job Application Tracker

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Nanostores** - State management
- **Chart.js** - Data visualization
- **Motion** - Animations
- **Vitest** - Testing framework
- **ESLint & Prettier** - Code quality

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
# Create .env file in the project root
```

Fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_DATABASE_URL=your_database_url_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

**Note**: If you don't set these, the app will fall back to the inline config in `src/config/firebase.ts`.

### 3. Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment.

### 5. Preview Production Build

```bash
npm run preview
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Fix linting errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

---

## Project Structure

```
ouk/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── stores/          # State management (Nanostores)
│   ├── utils/           # Utility functions (validators, filters, etc.)
│   ├── config/          # Configuration files
│   ├── components/      # UI components (to be added)
│   ├── services/        # External services (to be added)
│   └── main.ts          # Application entry point
├── public/              # Static assets
├── dist/                # Build output (generated)
├── index.html           # HTML entry point
├── style.css            # Styles (unchanged)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

---

## Migration from Old Code

### Current State

- ✅ New TypeScript code in `src/main.ts`
- ✅ Old JavaScript code in `script.js` (still works)
- ✅ Both can run in parallel during migration

### Migration Path

1. **Test new code** in development (`npm run dev`)
2. **Verify functionality** matches old code
3. **Deploy new build** when confident
4. **Remove old code** (`script.js`) after successful deployment

---

## TypeScript Benefits

### Type Safety

```typescript
// Before (JavaScript)
function addApplication(company, role, date) {
  // No type checking - easy to make mistakes
}

// After (TypeScript)
function addApplication(
  company: string,
  role: string,
  date: string
): void {
  // TypeScript catches errors at compile time
}
```

### IntelliSense

- Auto-completion in your editor
- Inline documentation
- Refactoring support

### Better Refactoring

- Rename symbols across files
- Find all references
- Safe code changes

---

## State Management (Nanostores)

### Before (Global Object)

```javascript
const AppState = {
  applications: [],
  filters: { search: '' }
};

// Direct mutation - hard to track changes
AppState.filters.search = 'Google';
```

### After (Reactive Stores)

```typescript
import { filters } from './stores/applicationStore';

// Reactive updates
filters.subscribe((currentFilters) => {
  console.log('Filters changed:', currentFilters);
});

// Immutable updates
updateFilter('search', 'Google');
```

---

## Development Workflow

### 1. Make Changes

Edit files in `src/` directory. TypeScript will check for errors.

### 2. See Changes

Vite's hot module replacement (HMR) updates the browser instantly.

### 3. Test Changes

```bash
npm test
```

### 4. Check Quality

```bash
npm run lint
npm run format:check
```

### 5. Build

```bash
npm run build
```

---

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors:

1. Check `tsconfig.json` settings
2. Ensure all imports are correct
3. Run `npm run build` to see full error messages

### Build Fails

1. Clear `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

### Firebase Not Working

1. Check `.env` file exists and has correct values
2. Verify Firebase config in `src/config/firebase.ts`
3. Check browser console for Firebase errors

---

## Next Steps

See `IMPLEMENTATION_PLAN.md` for:
- Phase 2: Data Visualization
- Phase 3: Motion & Animations
- Phase 4: Backend Intelligence
- Phase 5: Production Polish

---

## Support

- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Vite**: [Vite Documentation](https://vitejs.dev/)
- **Nanostores**: [Nanostores Guide](https://github.com/nanostores/nanostores)

---

**Happy Coding! 🚀**
