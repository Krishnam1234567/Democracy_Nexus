import { jest } from '@jest/globals';

// Common mocks for all tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn()
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  isSupported: jest.fn().mockResolvedValue(true),
  logEvent: jest.fn()
}));

// Mock Vite env vars
global.import = {
  meta: {
    env: {
      VITE_FIREBASE_API_KEY: 'test_key',
      VITE_FIREBASE_PROJECT_ID: 'test_id',
      VITE_GEMINI_API_KEY: 'test_gemini',
      DEV: true
    }
  }
};
