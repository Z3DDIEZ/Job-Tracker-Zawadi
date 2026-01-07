# Setup GitHub Secrets - Step by Step

## 🎯 Your Firebase Values

Use these exact values when adding secrets:

```
VITE_FIREBASE_API_KEY = AIzaSyClonfK1u9vl-aj43Ipq8cNLGk9avqKlvE
VITE_FIREBASE_AUTH_DOMAIN = job-tracker-zawadi.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://job-tracker-zawadi-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID = job-tracker-zawadi
VITE_FIREBASE_STORAGE_BUCKET = job-tracker-zawadi.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 991350824064
VITE_FIREBASE_APP_ID = 1:991350824064:web:f838ef8be54f14d94cda65
```

---

## 📝 Step-by-Step Instructions

### Step 1: Add Secrets to GitHub

1. **Go to your repository**:
   - Open: https://github.com/Z3DDIEZ/Job-Tracker-Zawadi

2. **Navigate to Secrets**:
   - Click **Settings** (top menu bar)
   - Click **Secrets and variables** → **Actions** (left sidebar)
   - Click **New repository secret**

3. **Add Each Secret** (repeat 7 times):

   **Secret 1:**
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSyClonfK1u9vl-aj43Ipq8cNLGk9avqKlvE`
   - Click **Add secret**

   **Secret 2:**
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`
   - Value: `job-tracker-zawadi.firebaseapp.com`
   - Click **Add secret**

   **Secret 3:**
   - Name: `VITE_FIREBASE_DATABASE_URL`
   - Value: `https://job-tracker-zawadi-default-rtdb.europe-west1.firebasedatabase.app`
   - Click **Add secret**

   **Secret 4:**
   - Name: `VITE_FIREBASE_PROJECT_ID`
   - Value: `job-tracker-zawadi`
   - Click **Add secret**

   **Secret 5:**
   - Name: `VITE_FIREBASE_STORAGE_BUCKET`
   - Value: `job-tracker-zawadi.firebasestorage.app`
   - Click **Add secret**

   **Secret 6:**
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - Value: `991350824064`
   - Click **Add secret**

   **Secret 7:**
   - Name: `VITE_FIREBASE_APP_ID`
   - Value: `1:991350824064:web:f838ef8be54f14d94cda65`
   - Click **Add secret**

4. **Verify**:
   - You should see 7 secrets listed
   - Each shows as `••••••••` (hidden for security)

---

### Step 2: Enable GitHub Pages

1. **Go to Pages Settings**:
   - Still in **Settings**
   - Click **Pages** (left sidebar)

2. **Configure Source**:
   - Under **Source**, select **GitHub Actions**
   - (Don't select "Deploy from a branch")
   - Save

3. **Verify**:
   - You should see: "Your site is ready to be published at https://z3ddiez.github.io/Job-Tracker-Zawadi/"

---

### Step 3: Commit and Push Workflow

The workflow file is already created. Commit it:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

---

### Step 4: Watch the Deployment

1. **Go to Actions Tab**:
   - Click **Actions** tab in your repository
   - You should see a workflow run starting

2. **Wait for Completion**:
   - Usually takes 1-2 minutes
   - Watch for green checkmark ✅

3. **Check Logs** (if it fails):
   - Click on the workflow run
   - Check the "Build" step logs
   - Look for any errors

---

### Step 5: Test Your Live Site

1. **Visit**: https://z3ddiez.github.io/Job-Tracker-Zawadi/

2. **Open Browser Console** (F12):
   - Look for: `🔥 Firebase initialized`
   - Check for any errors

3. **Verify**:
   - ✅ Cards appear
   - ✅ Data loads
   - ✅ No console errors

---

## ✅ Success Checklist

- [ ] All 7 secrets added to GitHub
- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] Workflow file committed and pushed
- [ ] GitHub Actions workflow runs successfully
- [ ] Live site shows cards and data
- [ ] Console shows "Firebase initialized"

---

## 🔍 Troubleshooting

### Workflow Fails

**Check**:
- All 7 secrets are added (exact names, case-sensitive)
- No extra spaces in secret values
- Workflow file is in `.github/workflows/deploy.yml`

### Firebase Not Working

**Check**:
- Browser console for errors
- Network tab - are Firebase scripts loading?
- Secrets match your `.env` file exactly

### Assets 404 Errors

**Check**:
- `vite.config.ts` has `base: '/Job-Tracker-Zawadi/'`
- Build completed successfully
- GitHub Pages is using GitHub Actions source

---

## 🎉 That's It!

Once set up, every push to `main` will automatically:
1. Build your app with Firebase config
2. Deploy to GitHub Pages
3. Update your live site

No more manual builds needed! 🚀
