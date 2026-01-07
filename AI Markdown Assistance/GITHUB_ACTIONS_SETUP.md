# GitHub Actions Setup Guide - Firebase Secrets

## 🎯 Goal

Set up automatic deployment to GitHub Pages with Firebase configuration using GitHub Secrets.

---

## 📋 Step-by-Step Instructions

### Step 1: Add Firebase Secrets to GitHub

1. **Go to your repository**:
   - Visit: `https://github.com/Z3DDIEZ/Job-Tracker-Zawadi`

2. **Navigate to Secrets**:
   - Click **Settings** (top menu)
   - Click **Secrets and variables** → **Actions** (left sidebar)

3. **Add Each Secret**:
   Click **New repository secret** for each of these:

   | Secret Name | Value (from your .env file) |
   |------------|----------------------------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyClonfK1u9vl-aj43Ipq8cNLGk9avqKlvE` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `job-tracker-zawadi.firebaseapp.com` |
   | `VITE_FIREBASE_DATABASE_URL` | `https://job-tracker-zawadi-default-rtdb.europe-west1.firebasedatabase.app` |
   | `VITE_FIREBASE_PROJECT_ID` | `job-tracker-zawadi` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `job-tracker-zawadi.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `991350824064` |
   | `VITE_FIREBASE_APP_ID` | `1:991350824064:web:f838ef8be54f14d94cda65` |

   **Important**: 
   - Name must match exactly (case-sensitive)
   - Value should be the exact value from your `.env` file
   - No quotes needed

4. **Verify All Secrets Added**:
   - You should see 7 secrets listed
   - Each should show as `••••••••` (hidden)

---

### Step 2: Enable GitHub Pages

1. **Go to Pages Settings**:
   - Click **Settings** → **Pages** (left sidebar)

2. **Configure Source**:
   - **Source**: Select **GitHub Actions**
   - Save

3. **Verify**:
   - You should see: "Your site is live at https://z3ddiez.github.io/Job-Tracker-Zawadi/"

---

### Step 3: Commit and Push Workflow

The workflow file (`.github/workflows/deploy.yml`) is already created. You just need to commit it:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

---

### Step 4: Verify Deployment

1. **Check GitHub Actions**:
   - Go to **Actions** tab in your repository
   - You should see a workflow run starting
   - Wait for it to complete (usually 1-2 minutes)

2. **Check for Success**:
   - Green checkmark ✅ = Success
   - Red X ❌ = Error (check logs)

3. **Test Live Site**:
   - Visit: `https://z3ddiez.github.io/Job-Tracker-Zawadi/`
   - Open browser console (F12)
   - Look for: `🔥 Firebase initialized`
   - Cards should appear!

---

## 🔍 Troubleshooting

### Workflow Fails

**Check**:
1. All 7 secrets are added correctly
2. Secret names match exactly (case-sensitive)
3. No extra spaces in secret values
4. Workflow file is in `.github/workflows/` folder

### Firebase Still Not Working

**Check**:
1. Browser console for errors
2. Network tab - are Firebase scripts loading?
3. Verify secrets are set correctly in GitHub

### Assets Not Loading

**Check**:
1. `vite.config.ts` has correct `base` path
2. Build output shows `/Job-Tracker-Zawadi/assets/...`
3. GitHub Pages is using GitHub Actions source

---

## ✅ Success Indicators

After setup, you should see:

1. **GitHub Actions**:
   - ✅ Workflow runs on every push
   - ✅ Build completes successfully
   - ✅ Deployment succeeds

2. **Live Site**:
   - ✅ Assets load correctly
   - ✅ Firebase initializes
   - ✅ Cards appear
   - ✅ No console errors

---

## 🔄 How It Works

1. **You push code** → Triggers workflow
2. **GitHub Actions**:
   - Checks out code
   - Installs dependencies
   - Builds with Firebase secrets
   - Deploys to GitHub Pages
3. **Site updates** automatically (1-2 minutes)

---

## 📝 Notes

- **Secrets are secure**: Never visible in logs or code
- **Automatic**: No need to build locally anymore
- **Always up-to-date**: Every push triggers a new deployment
- **No dist/ in repo**: Build happens in GitHub Actions

---

**Ready to set up?** Follow Step 1 above to add your Firebase secrets! 🚀
