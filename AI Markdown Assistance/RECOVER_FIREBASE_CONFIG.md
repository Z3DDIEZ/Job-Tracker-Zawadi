# Recovering Your Firebase Configuration

## ✅ Your Data is Safe!

**Your Firebase data is still in Firebase** - it's stored in the cloud, not locally. You just need to reconnect with your Firebase credentials.

---

## How to Get Your Firebase Config

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one if you don't remember)
3. Click the **⚙️ Settings** icon (gear) → **Project settings**
4. Scroll down to **Your apps** section
5. If you see a web app (</> icon), click it
6. If not, click **Add app** → **Web** (</> icon)
7. Copy the config values from the `firebaseConfig` object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Option 2: Check Your Firebase Project

If you have multiple Firebase projects:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Check each project
3. Go to **Realtime Database** in the left sidebar
4. If you see your applications data, that's your project!

---

## Setting Up .env File

Once you have your Firebase config:

1. **Create `.env` file** in the project root (same folder as `package.json`)

2. **Create `.env` file** in the project root directory

3. **Fill in your values**:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy... (from apiKey)
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com (from authDomain)
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com (from databaseURL)
   VITE_FIREBASE_PROJECT_ID=your-project-id (from projectId)
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com (from storageBucket)
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 (from messagingSenderId)
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef (from appId)
   ```

4. **Restart the dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

---

## Finding Your Old Project

### Check Your Browser History
- Look for visits to `console.firebase.google.com`
- Check which project you were using

### Check Your Email
- Firebase sends emails when you create projects
- Search for "Firebase" in your email

### Check GitHub (if deployed)
- If you deployed this to GitHub Pages
- Check the deployed site's network tab
- Firebase config might be visible in the page source (if it was hardcoded before)

---

## If You Can't Find Your Project

### Option A: Create New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**
3. Follow the setup wizard
4. Enable **Realtime Database**
5. Copy the new config to `.env`

**Note**: This will start fresh - your old data won't be accessible unless you find the old project.

### Option B: Check Local Cache
Your browser might have cached some data. Check:
- Browser DevTools → Application → Local Storage
- Look for keys like `job_tracker_cache` or `applications`

---

## Quick Test

After setting up `.env`, restart the dev server and check:
1. Console should show: `🔥 Firebase initialized`
2. Your applications should load automatically
3. You can add/edit/delete applications

---

## Need Help?

If you're stuck:
1. Check the console for specific error messages
2. Verify all 7 environment variables are set
3. Make sure `.env` is in the project root (not in `src/`)
4. Restart the dev server after creating `.env`

---

**Your data is safe!** Once you reconnect with the correct Firebase config, everything will be back. 🎉
