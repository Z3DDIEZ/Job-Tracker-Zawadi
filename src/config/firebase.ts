/**
 * Firebase Configuration
 * Loads config from environment variables
 * 
 * SECURITY: No hardcoded credentials allowed
 * All config must come from environment variables
 */

import type { FirebaseConfig } from '@/types';

// Get Firebase config from environment variables
export function getFirebaseConfig(): FirebaseConfig {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  // Validate all required environment variables are present
  if (!apiKey || !authDomain || !databaseURL || !projectId || !storageBucket || !messagingSenderId || !appId) {
    const missingVars: string[] = [];
    if (!apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
    if (!authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
    if (!databaseURL) missingVars.push('VITE_FIREBASE_DATABASE_URL');
    if (!projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
    if (!storageBucket) missingVars.push('VITE_FIREBASE_STORAGE_BUCKET');
    if (!messagingSenderId) missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
    if (!appId) missingVars.push('VITE_FIREBASE_APP_ID');

    console.error('❌ Firebase configuration incomplete. Missing environment variables:');
    console.error(missingVars.join(', '));
    console.error('\n📝 To fix this:');
    console.error('1. Create a .env file in the project root');
    console.error('2. Fill in your Firebase credentials from https://console.firebase.google.com');
    console.error('3. Restart the dev server (npm run dev)');
    
    // In development, show helpful error but don't crash - let the app show a message
    if (import.meta.env.DEV) {
      // Return a config that will fail gracefully when Firebase tries to initialize
      // This allows the app to show a user-friendly message instead of crashing
      return {
        apiKey: apiKey || 'MISSING',
        authDomain: authDomain || 'MISSING',
        databaseURL: databaseURL || 'MISSING',
        projectId: projectId || 'MISSING',
        storageBucket: storageBucket || 'MISSING',
        messagingSenderId: messagingSenderId || 'MISSING',
        appId: appId || 'MISSING',
      };
    }
    
    // In production, use minimal fallback (user should set env vars)
    // This is a last resort - should not happen in proper deployment
    return {
      apiKey: apiKey || '',
      authDomain: authDomain || '',
      databaseURL: databaseURL || '',
      projectId: projectId || '',
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
    };
  }

  return {
    apiKey,
    authDomain,
    databaseURL,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}
