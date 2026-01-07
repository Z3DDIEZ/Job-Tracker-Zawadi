# GitHub Pages Deployment Guide

## 🐛 Issue: Cards Not Showing on Live Demo

**Symptoms**: 
- App works perfectly with `npm run dev` locally
- Cards don't appear on GitHub Pages live demo
- Console shows errors

**Root Causes**:
1. ✅ **Base Path Mismatch** - FIXED (vite.config.ts updated)
2. ⚠️ **Firebase Config Missing** - Environment variables not available in production
3. ✅ **CSP Issues** - FIXED (CSP updated for Firebase)

---

## ✅ Fixes Applied

### 1. Base Path Configuration

Updated `vite.config.ts`:
```typescript
base: process.env.NODE_ENV === 'production' ? '/Job-Tracker-Zawadi/' : '/',
```

This ensures assets load from the correct path on GitHub Pages.

### 2. Content Security Policy

Updated CSP in `index.html` to allow:
- WebSocket connections (`wss://`)
- Firebase script loading (`unsafe-eval`)
- Firebase domains in `script-src`

---

## 🔧 Remaining Issue: Firebase Configuration

### The Problem

When you build for production, Vite embeds environment variables at **build time**. If the build happens without your `.env` file (like on GitHub Actions without secrets), Firebase won't initialize.

### Solutions

#### Option 1: GitHub Actions with Secrets (Recommended)

1. **Add Secrets to GitHub**:
   - Go to: `https://github.com/Z3DDIEZ/Job-Tracker-Zawadi/settings/secrets/actions`
   - Click **New repository secret**
   - Add each Firebase variable:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_DATABASE_URL`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

2. **GitHub Actions Workflow**:
   - Created `.github/workflows/deploy.yml`
   - Automatically builds and deploys on push
   - Uses secrets for Firebase config

3. **Enable GitHub Pages**:
   - Go to: `Settings` → `Pages`
   - **Source**: `GitHub Actions`
   - Save

#### Option 2: Manual Build with Environment Variables

1. **Build locally with env vars**:
   ```bash
   # Windows PowerShell
   $env:NODE_ENV="production"
   npm run build
   ```

2. **Commit and push dist/**:
   ```bash
   git add dist/
   git commit -m "Deploy production build"
   git push
   ```

3. **Set GitHub Pages source**:
   - Go to: `Settings` → `Pages`
   - **Source**: `main` branch, `/dist` folder
   - Save

---

## 🧪 Testing the Fix

### 1. Test Locally with Production Build

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173/Job-Tracker-Zawadi/` (note the base path)

**Check**:
- ✅ Assets load correctly
- ✅ Firebase initializes
- ✅ Cards appear
- ✅ No console errors

### 2. Test on GitHub Pages

After deploying:
1. Visit: `https://z3ddiez.github.io/Job-Tracker-Zawadi/`
2. Open browser DevTools → Console
3. Check for:
   - ✅ No 404 errors for assets
   - ✅ `🔥 Firebase initialized` message
   - ✅ Cards loading

---

## 📋 Deployment Checklist

- [ ] `vite.config.ts` has correct `base` path (`/Job-Tracker-Zawadi/`)
- [ ] Firebase environment variables set (GitHub Actions secrets OR local .env)
- [ ] `npm run build` completes successfully
- [ ] `dist/index.html` has correct asset paths (check for `/Job-Tracker-Zawadi/assets/...`)
- [ ] GitHub Pages source configured correctly
- [ ] Test live site after deployment
- [ ] Check browser console for errors

---

## 🔍 Debugging Steps

### If Cards Still Don't Show:

1. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for errors:
     - `404` → Asset path issue
     - `Firebase configuration missing` → Env vars not set
     - `CSP violation` → CSP blocking resources

2. **Check Network Tab**:
   - See if assets are loading
   - Check if Firebase scripts load
   - Verify paths are correct

3. **Check Firebase Initialization**:
   - Look for `🔥 Firebase initialized` in console
   - If missing, Firebase config is the issue

4. **Verify Base Path**:
   - Assets should load from: `/Job-Tracker-Zawadi/assets/...`
   - Not from: `/assets/...`

---

## 🚀 Quick Fix (Right Now)

If you need to deploy immediately:

1. **Build with your .env file**:
   ```bash
   $env:NODE_ENV="production"
   npm run build
   ```

2. **Verify dist/index.html** has correct paths:
   - Should see `/Job-Tracker-Zawadi/assets/...`

3. **Commit and push dist/**:
   ```bash
   git add dist/
   git commit -m "Deploy with Firebase config"
   git push
   ```

4. **Set GitHub Pages**:
   - Settings → Pages
   - Source: `main` branch, `/dist` folder

5. **Wait 1-2 minutes** for GitHub Pages to update

---

## 📝 Long-term Solution

**Use GitHub Actions** (`.github/workflows/deploy.yml` already created):

1. Add Firebase secrets to GitHub
2. Push to main branch
3. GitHub Actions automatically builds and deploys
4. No need to commit `dist/` folder

---

**The base path issue is fixed!** The remaining issue is ensuring Firebase config is available during the build process.
