# Phase 1 Testing Guide

## Step-by-Step Testing Process

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages:
- TypeScript
- Vite
- Nanostores
- Testing tools
- Linting tools

**Expected output**: Should complete without errors. Takes 1-2 minutes.

---

### Step 2: Verify Installation

Check that everything installed correctly:

```bash
npm list --depth=0
```

You should see all packages listed.

---

### Step 3: Set Up Environment (Optional)

Create a `.env` file if you want to use environment variables:

```bash
# Create .env file (or copy from .env.example if it exists)
```

Add your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_DATABASE_URL=your_url_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

**Note**: If you don't create `.env`, the app will use the fallback config in `src/config/firebase.ts`.

---

### Step 4: Start Development Server

```bash
npm run dev
```

**Expected behavior**:
- Server starts on `http://localhost:3000`
- Browser opens automatically
- You see your app running
- Hot reload works (try editing a file)

**What to check**:
- ✅ App loads without errors
- ✅ Firebase connects (check console)
- ✅ Can add applications
- ✅ Can filter/search
- ✅ Can edit/delete
- ✅ All features work as before

---

### Step 5: Check for TypeScript Errors

In a new terminal, run:

```bash
npm run build
```

**Expected behavior**:
- TypeScript compiles without errors
- Build completes successfully
- Creates `dist/` folder

**If you see errors**:
- Check the error messages
- Most likely: missing type declarations or import issues
- Fix and try again

---

### Step 6: Run Tests

```bash
npm test
```

**Expected behavior**:
- Tests run successfully
- You see test results
- All tests pass (or at least the example tests)

**What's tested**:
- Filter logic
- Sort logic
- (More tests can be added)

---

### Step 7: Check Code Quality

```bash
npm run lint
```

**Expected behavior**:
- No linting errors (or only warnings)
- Code follows style guidelines

**If there are errors**:
```bash
npm run lint:fix
```

This will auto-fix many issues.

---

### Step 8: Format Code

```bash
npm run format
```

This ensures all code is consistently formatted.

---

### Step 9: Test Production Build

```bash
npm run build
npm run preview
```

**Expected behavior**:
- Build completes
- Preview server starts
- App works exactly like dev version
- All features functional

---

### Step 10: Compare with Old Version

**Side-by-side comparison**:

1. **Old version**: Open `index.html` directly (or use old script.js)
2. **New version**: Run `npm run dev`

**What to verify**:
- ✅ Same functionality
- ✅ Same UI/UX
- ✅ Same Firebase integration
- ✅ No regressions

---

## Common Issues & Solutions

### Issue 1: "Cannot find module"

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: TypeScript errors

**Check**:
- `tsconfig.json` exists
- All imports are correct
- Type definitions are in place

**Solution**: Check error messages, they're usually clear about what's missing.

### Issue 3: Firebase not connecting

**Check**:
- Firebase SDK scripts in `index.html`
- Firebase config in `src/config/firebase.ts`
- Browser console for errors

**Solution**: Verify Firebase config values are correct.

### Issue 4: Build fails

**Check**:
- All TypeScript files compile
- No syntax errors
- All imports resolve

**Solution**: Run `npm run build` and read error messages carefully.

### Issue 5: Tests fail

**Check**:
- Test files are in correct location
- Imports are correct
- Vitest config is correct

**Solution**: Check test file paths and imports.

---

## Testing Checklist

Use this checklist to verify everything works:

### Functionality
- [ ] Can add new application
- [ ] Can edit existing application
- [ ] Can delete application
- [ ] Search filter works
- [ ] Status filter works
- [ ] Date range filter works
- [ ] Visa filter works
- [ ] Sort options work
- [ ] Form validation works
- [ ] Error messages display
- [ ] Success messages display

### Technical
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Firebase connects successfully
- [ ] State management works (filters persist)
- [ ] Cache works (check localStorage)
- [ ] Hot reload works in dev mode
- [ ] Production build works
- [ ] Tests pass

### Code Quality
- [ ] No linting errors
- [ ] Code is formatted
- [ ] Type safety enforced
- [ ] No `any` types (or justified)

---

## Success Criteria

✅ **Phase 1 is successful if**:
1. App runs in dev mode without errors
2. All features work as before
3. TypeScript compiles successfully
4. Tests pass
5. Production build works
6. No regressions

---

## Next Steps After Testing

Once Phase 1 is verified:

1. **Document any issues** you find
2. **Fix any bugs** discovered
3. **Add more tests** if needed
4. **Proceed to Phase 2** (Data Visualization)

---

## Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check terminal for build errors
3. Review error messages carefully
4. Check `SETUP.md` for setup details
5. Review `MIGRATION_NOTES.md` for migration info

---

**Happy Testing! 🧪**
