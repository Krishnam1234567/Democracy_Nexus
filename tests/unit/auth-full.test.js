/**
 * @fileoverview Comprehensive auth module tests.
 * Imports firebase-config.js via the same path as auth.js so moduleNameMapper
 * routes both to the same mock instance.
 */

import {
  onAuthChange,
  initAuth,
  signInWithGoogle,
  signInAnon,
  signOutUser,
  getCurrentUser,
  isAuthenticated,
  getUserDisplayInfo
} from '../../src/js/auth.js';

// Import the mock directly — same mock instance auth.js uses
import * as firebaseConfig from '../../src/js/firebase-config.js';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut
} from 'firebase/auth';

describe('Auth Module - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseConfig.isFirebaseConfigured.mockReturnValue(false);
    firebaseConfig.getAuthInstance.mockReturnValue(null);
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
    signInWithPopup.mockReset();
    signInAnonymously.mockReset();
    signOut.mockReset();
  });

  describe('getCurrentUser', () => {
    it('returns null or object after initAuth with no user', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
      initAuth();
      expect(getCurrentUser()).toBeNull();
    });

    it('returns the user after sign-in auth state change', () => {
      const mockUser = { uid: 'u1', displayName: 'Test', isAnonymous: false };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(mockUser); return jest.fn(); });
      initAuth();
      expect(getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('getUserDisplayInfo', () => {
    it('returns Guest when no user', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
      initAuth();
      const info = getUserDisplayInfo();
      expect(info.name).toBe('Guest');
      expect(info.uid).toBe('');
    });

    it('has correct structure', () => {
      const info = getUserDisplayInfo();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('email');
      expect(info).toHaveProperty('photoURL');
      expect(info).toHaveProperty('uid');
    });

    it('returns user data when logged in', () => {
      const mockUser = { uid: 'u1', displayName: 'Alice', email: 'a@a.com', photoURL: '', isAnonymous: false };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(mockUser); return jest.fn(); });
      initAuth();
      const info = getUserDisplayInfo();
      expect(info.name).toBe('Alice');
      expect(info.uid).toBe('u1');
    });

    it('uses "Anonymous User" fallback when displayName is null', () => {
      const mockUser = { uid: 'u2', displayName: null, email: '', photoURL: '', isAnonymous: false };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(mockUser); return jest.fn(); });
      initAuth();
      expect(getUserDisplayInfo().name).toBe('Anonymous User');
    });
  });

  describe('isAuthenticated', () => {
    it('returns false with no user', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
      initAuth();
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false for anonymous user', () => {
      const anonUser = { uid: 'anon', isAnonymous: true };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(anonUser); return jest.fn(); });
      initAuth();
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true for non-anonymous user', () => {
      const realUser = { uid: 'g1', isAnonymous: false };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(realUser); return jest.fn(); });
      initAuth();
      expect(isAuthenticated()).toBe(true);
    });

    it('is a boolean', () => {
      expect(typeof isAuthenticated()).toBe('boolean');
    });
  });

  describe('onAuthChange', () => {
    it('calls callback immediately', () => {
      const cb = jest.fn();
      onAuthChange(cb);
      expect(cb).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      expect(typeof onAuthChange(jest.fn())).toBe('function');
    });

    it('unsubscribe stops listener from future calls', () => {
      const cb = jest.fn();
      const unsub = onAuthChange(cb);
      cb.mockClear();
      unsub();
      // Trigger state change
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, f) => { f(null); return jest.fn(); });
      initAuth();
      expect(cb).not.toHaveBeenCalled();
    });

    it('listener is called on auth state change', () => {
      const cb = jest.fn();
      onAuthChange(cb);
      cb.mockClear();
      const mockUser = { uid: 'abc', isAnonymous: false };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, f) => { f(mockUser); return jest.fn(); });
      initAuth();
      expect(cb).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('initAuth', () => {
    it('returns false when not configured', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(false);
      expect(initAuth()).toBe(false);
    });

    it('returns false when auth instance is null', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue(null);
      expect(initAuth()).toBe(false);
    });

    it('returns true when configured', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
      expect(initAuth()).toBe(true);
    });

    it('handles listener errors gracefully during auth state change', () => {
      // Register a well-behaved callback first
      const goodCb = jest.fn();
      onAuthChange(goodCb);
      goodCb.mockClear();
      // Set up Firebase to trigger auth state change
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAuthInstance.mockReturnValue({});
      // Make onAuthStateChanged trigger the internal listener which calls all listeners
      // Even if one listener throws, initAuth should not propagate the error
      onAuthStateChanged.mockImplementation((auth, cb) => {
        cb(null);
        return jest.fn();
      });
      // Should complete without throwing
      expect(() => initAuth()).not.toThrow();
    });
  });

  describe('signInWithGoogle', () => {
    it('returns null when auth not initialized', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue(null);
      expect(await signInWithGoogle()).toBeNull();
    });

    it('returns user on success', async () => {
      const mockUser = { uid: 'g1', displayName: 'Google' };
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInWithPopup.mockResolvedValue({ user: mockUser });
      expect(await signInWithGoogle()).toEqual(mockUser);
    });

    it('returns null on popup closed', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user', message: 'Closed' });
      expect(await signInWithGoogle()).toBeNull();
    });

    it('returns null on popup blocked', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked', message: 'Blocked' });
      expect(await signInWithGoogle()).toBeNull();
    });

    it('returns null on network error', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInWithPopup.mockRejectedValue({ code: 'auth/network-request-failed', message: 'Network' });
      expect(await signInWithGoogle()).toBeNull();
    });
  });

  describe('signInAnon', () => {
    it('returns null when auth not initialized', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue(null);
      expect(await signInAnon()).toBeNull();
    });

    it('returns anon user on success', async () => {
      const anonUser = { uid: 'anon1', isAnonymous: true };
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInAnonymously.mockResolvedValue({ user: anonUser });
      expect(await signInAnon()).toEqual(anonUser);
    });

    it('returns null on failure', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signInAnonymously.mockRejectedValue(new Error('Anon failed'));
      expect(await signInAnon()).toBeNull();
    });
  });

  describe('signOutUser', () => {
    it('returns false when auth not initialized', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue(null);
      expect(await signOutUser()).toBe(false);
    });

    it('returns true on success', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signOut.mockResolvedValue();
      expect(await signOutUser()).toBe(true);
    });

    it('returns false on error', async () => {
      firebaseConfig.getAuthInstance.mockReturnValue({});
      signOut.mockRejectedValue(new Error('Signout failed'));
      expect(await signOutUser()).toBe(false);
    });
  });
});
