/**
 * Jest test setup file.
 * Provides global mocks and polyfills for the test environment.
 */

/* global globalThis */

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i) => Object.keys(store)[i] || null)
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({})
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({}),
  connectAuthEmulator: jest.fn(),
  onAuthStateChanged: jest.fn().mockImplementation((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
  GoogleAuthProvider: class {
    addScope() {}
  },
  signInWithPopup: jest.fn().mockResolvedValue(null),
  signInAnonymously: jest.fn().mockResolvedValue(null),
  signOut: jest.fn().mockResolvedValue(null)
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn().mockReturnValue({}),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn().mockReturnValue('colRef'),
  doc: jest.fn().mockReturnValue('docRef'),
  addDoc: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  setDoc: jest.fn().mockResolvedValue(null),
  updateDoc: jest.fn().mockResolvedValue(null),
  query: jest.fn().mockReturnValue('queryRef'),
  where: jest.fn().mockReturnValue('whereClause'),
  orderBy: jest.fn().mockReturnValue('orderByClause'),
  limit: jest.fn().mockReturnValue('limitClause'),
  serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP')
}));

// Mock firebase/analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn().mockReturnValue({}),
  isSupported: jest.fn().mockResolvedValue(true),
  logEvent: jest.fn()
}));

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: jest.fn().mockResolvedValue({
            response: { text: () => 'Mock AI response' }
          })
        })
      };
    }
  }
}));

// Suppress console noise in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
}

// Mock Vite import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: 'test_key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test_id',
        VITE_GEMINI_API_KEY: 'test_gemini',
        DEV: true
      }
    }
  },
  writable: true
});
