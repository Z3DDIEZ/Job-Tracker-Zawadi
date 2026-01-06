# Quick Start Guide

## ⚠️ Important: Don't Open HTML Directly!

**DO NOT** open `index.html` directly in your browser (double-clicking it).

**WHY?** 
- TypeScript files need to be compiled
- Module imports don't work with `file://` protocol
- You'll get CORS errors

## ✅ Correct Way: Use the Dev Server

### Step 1: Start the Development Server

```bash
npm run dev
```

This will:
- ✅ Start a local server (usually `http://localhost:3000`)
- ✅ Compile TypeScript automatically
- ✅ Handle module imports correctly
- ✅ Provide hot reload (changes update instantly)
- ✅ Open your browser automatically

### Step 2: Use the URL Provided

The terminal will show something like:
```
  VITE v5.0.5  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Open that URL in your browser** (it usually opens automatically).

---

## Common Mistakes

### ❌ Wrong Way:
1. Double-clicking `index.html`
2. Opening `file:///C:/path/to/index.html`
3. Using `file://` protocol

**Result**: CORS errors, TypeScript not compiled, modules don't load

### ✅ Right Way:
1. Run `npm run dev` in terminal
2. Use the `http://localhost:3000` URL
3. Let Vite handle everything

**Result**: Everything works perfectly!

---

## Troubleshooting

### "Port 3000 is already in use"

Change the port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // or any other port
}
```

Or stop the other process using port 3000.

### "Cannot find module"

Make sure you've run:
```bash
npm install
```

### Still having issues?

1. Check the terminal output for errors
2. Check browser console (F12) for errors
3. Make sure you're using the `http://` URL, not `file://`

---

## Production Build

When you're ready to deploy:

```bash
npm run build
```

This creates a `dist/` folder with compiled, optimized files that can be deployed to GitHub Pages or any static host.

---

**Remember**: Always use `npm run dev` for development! 🚀
