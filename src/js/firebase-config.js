/**
 * @fileoverview Firebase configuration and initialization.
 * Sets up Firebase App, Authentication, Firestore, and Analytics.
 * @module firebase-config
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase configuration object.
 * Values are loaded from environment variables set in .env file.
 * @type {Object}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

/** @type {import('firebase/app').FirebaseApp|null} */
let app = null;

/** @type {import('firebase/auth').Auth|null} */
let auth = null;

/** @type {import('firebase/firestore').Firestore|null} */
let db = null;

/** @type {import('firebase/analytics').Analytics|null} */
let analytics = null;

/** @type {boolean} */
let initialized = false;

/**
 * Checks whether the Firebase configuration has valid (non-empty) values.
 * @returns {boolean} True if essential config values are present.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your_firebase_api_key_here'
  );
}

/**
 * Initializes Firebase services (App, Auth, Firestore, Analytics).
 * Safe to call multiple times — will only initialize once.
 *
 * @returns {Promise<boolean>} True if initialization was successful.
 */
export async function initializeFirebase() {
  if (initialized) {
    return true;
  }

  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Configuration not found. Running in offline mode.');
    return false;
  }

  try {
    // Initialize Firebase App
    app = initializeApp(firebaseConfig);

    // Initialize Authentication
    auth = getAuth(app);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Analytics (only if supported in the current environment)
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
    }

    // Connect to emulators in development mode
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.info('[Firebase] Connected to local emulators.');
    }

    initialized = true;
    console.info('[Firebase] Successfully initialized.');
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error.message);
    return false;
  }
}

/**
 * Returns the Firebase Auth instance.
 * @returns {import('firebase/auth').Auth|null}
 */
export function getAuthInstance() {
  return auth;
}

/**
 * Returns the Firestore database instance.
 * @returns {import('firebase/firestore').Firestore|null}
 */
export function getDbInstance() {
  return db;
}

/**
 * Returns the Firebase Analytics instance.
 * @returns {import('firebase/analytics').Analytics|null}
 */
export function getAnalyticsInstance() {
  return analytics;
}

/**
 * Returns the Firebase App instance.
 * @returns {import('firebase/app').FirebaseApp|null}
 */
export function getAppInstance() {
  return app;
}
