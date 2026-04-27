/**
 * @fileoverview Firebase Authentication module.
 * Handles Google Sign-In, anonymous auth, and auth state management.
 * @module auth
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getAuthInstance, isFirebaseConfigured } from './firebase-config.js';

/** @type {import('firebase/auth').User|null} */
let currentUser = null;

/** @type {Array<Function>} */
const authListeners = [];

/**
 * Registers a callback to be notified of authentication state changes.
 *
 * @param {Function} callback - Function called with (user|null) on auth changes.
 * @returns {Function} Unsubscribe function.
 */
export function onAuthChange(callback) {
  authListeners.push(callback);
  // Immediately notify with current state
  if (currentUser !== undefined) {
    callback(currentUser);
  }
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

/**
 * Notifies all registered auth listeners of a state change.
 * @param {import('firebase/auth').User|null} user
 * @private
 */
function notifyListeners(user) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.error('[Auth] Listener error:', err.message);
    }
  });
}

/**
 * Initializes the authentication state listener.
 * Sets up Firebase onAuthStateChanged to track user login/logout.
 *
 * @returns {boolean} True if listener was set up successfully.
 */
export function initAuth() {
  if (!isFirebaseConfigured()) {
    console.warn('[Auth] Firebase not configured. Auth disabled.');
    currentUser = null;
    notifyListeners(null);
    return false;
  }

  const auth = getAuthInstance();
  if (!auth) {
    console.warn('[Auth] Auth instance not available.');
    return false;
  }

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    notifyListeners(user);
    if (user) {
      console.info(`[Auth] User signed in: ${user.displayName || 'Anonymous'}`);
    } else {
      console.info('[Auth] User signed out.');
    }
  });

  return true;
}

/**
 * Signs in the user with Google via popup.
 *
 * @returns {Promise<import('firebase/auth').User|null>} The signed-in user or null on failure.
 */
export async function signInWithGoogle() {
  const auth = getAuthInstance();
  if (!auth) {
    console.error('[Auth] Cannot sign in — Auth not initialized.');
    return null;
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.info('[Auth] Sign-in popup closed by user.');
    } else if (error.code === 'auth/popup-blocked') {
      console.warn('[Auth] Sign-in popup was blocked. Please allow popups.');
    } else {
      console.error('[Auth] Google sign-in failed:', error.message);
    }
    return null;
  }
}

/**
 * Signs in the user anonymously.
 * Useful for allowing access without requiring account creation.
 *
 * @returns {Promise<import('firebase/auth').User|null>} The anonymous user or null.
 */
export async function signInAnon() {
  const auth = getAuthInstance();
  if (!auth) {
    console.error('[Auth] Cannot sign in — Auth not initialized.');
    return null;
  }

  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('[Auth] Anonymous sign-in failed:', error.message);
    return null;
  }
}

/**
 * Signs out the current user.
 *
 * @returns {Promise<boolean>} True if sign-out was successful.
 */
export async function signOutUser() {
  const auth = getAuthInstance();
  if (!auth) {
    return false;
  }

  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('[Auth] Sign-out failed:', error.message);
    return false;
  }
}

/**
 * Returns the currently authenticated user.
 *
 * @returns {import('firebase/auth').User|null} The current user or null.
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Checks if a user is currently signed in (non-anonymous).
 *
 * @returns {boolean} True if a non-anonymous user is signed in.
 */
export function isAuthenticated() {
  return currentUser !== null && !currentUser.isAnonymous;
}

/**
 * Gets user display information for the UI.
 *
 * @returns {Object} User display info with name, email, and photo URL.
 */
export function getUserDisplayInfo() {
  if (!currentUser) {
    return { name: 'Guest', email: '', photoURL: '', uid: '' };
  }
  return {
    name: currentUser.displayName || 'Anonymous User',
    email: currentUser.email || '',
    photoURL: currentUser.photoURL || '',
    uid: currentUser.uid
  };
}
