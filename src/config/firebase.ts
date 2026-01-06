/**
 * Firebase Configuration
 * Loads config from environment variables or falls back to inline config
 */

import type { FirebaseConfig } from '@/types';

// Get Firebase config from environment variables or use defaults
export function getFirebaseConfig(): FirebaseConfig {
  // In development, use environment variables
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // Fallback to inline config (for GitHub Pages deployment)
  // This will be replaced by build-time injection or kept as fallback
  return {
    apiKey: 'AIzaSyClonfK1u9vl-aj43Ipq8cNLGk9avqKlvE',
    authDomain: 'job-tracker-zawadi.firebaseapp.com',
    databaseURL:
      'https://job-tracker-zawadi-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'job-tracker-zawadi',
    storageBucket: 'job-tracker-zawadi.firebasestorage.app',
    messagingSenderId: '991350824064',
    appId: '1:991350824064:web:f838ef8be54f14d94cda65',
  };
}
