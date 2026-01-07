# Deployment Guide - GitHub Pages

## 🚀 Deploying to GitHub Pages

### Issue: Cards Not Showing on Live Demo

**Problem**: App works locally (`npm run dev`) but cards don't show on GitHub Pages.

**Root Causes**:
1. **Base Path Mismatch** - GitHub Pages serves at `/Job-Tracker-Zawadi/` but build uses absolute paths
2. **Firebase Config Missing** - Environment variables not available in production build
3. **CSP Issues** - Content Security Policy blocking resources

---

## ✅ Solution

### 1. Base Path Configuration

The `vite.config.ts` has been updated to use the correct base path:

```typescript
base: process.env.NODE_ENV === 'production' ? '/Job-Tracker-Zawadi/' : '/',
```

This ensures assets load correctly on GitHub Pages.

### 2. Firebase Configuration for Production

**Option A: GitHub Actions with Secrets (Recommended)**

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Option B: Manual Build with Environment Variables**

1. Set environment variables before building:
```bash
# Windows PowerShell
$env:VITE_FIREBASE_API_KEY="your_key"
$env:VITE_FIREBASE_AUTH_DOMAIN="your_domain"
# ... etc
npm run build
```

2. Commit and push the `dist/` folder (or use GitHub Actions)

### 3. GitHub Pages Settings

1. Go to repo → **Settings** → **Pages**
2. **Source**: Select `gh-pages` branch (or `main` branch `/dist` folder)
3. **Branch**: Select the branch containing your built files
4. Save

---

## 🔧 Troubleshooting

### Cards Not Loading

**Check**:
1. Open browser DevTools → **Console**
2. Look for errors:
   - `404` errors → Base path issue
   - `Firebase configuration missing` → Env vars not set
   - `CSP violation` → CSP blocking resources

### Assets Not Loading

**Fix**: Ensure `vite.config.ts` has correct `base` path:
```typescript
base: '/Job-Tracker-Zawadi/'
```

### Firebase Not Connecting

**Fix**: 
1. Set environment variables in GitHub Actions secrets
2. Or build locally with env vars and commit `dist/`

### CSP Errors

**Fix**: The CSP in `index.html` has been updated to allow:
- `wss://` for WebSockets
- `unsafe-eval` for Firebase scripts
- Firebase domains in `script-src`

---

## 📝 Deployment Checklist

- [ ] `vite.config.ts` has correct `base` path
- [ ] Environment variables set in GitHub Actions (or build locally)
- [ ] `npm run build` completes successfully
- [ ] `dist/` folder contains all files
- [ ] GitHub Pages source set correctly
- [ ] Test live site after deployment
- [ ] Check browser console for errors

---

## 🎯 Quick Fix Steps

1. **Update vite.config.ts** (already done)
2. **Rebuild**:
   ```bash
   npm run build
   ```
3. **Set up GitHub Actions** (recommended) or build locally with env vars
4. **Deploy** `dist/` folder to GitHub Pages
5. **Test** the live site

---

**Note**: The base path `/Job-Tracker-Zawadi/` matches your repo name. If your repo name is different, update the `base` path in `vite.config.ts`.
