/**
 * @fileoverview Branch-gap coverage tests for auth, router, security, firestore,
 * glossary, timeline, checklist, chatbot, and quiz modules.
 * Targets every specific uncovered line from the coverage report.
 */

// ─── auth.js: line 52 (console.error in notifyListeners catch) ─────────────
import * as firebaseConfig from '../../src/js/firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { onAuthChange, initAuth } from '../../src/js/auth.js';

describe('auth.js — line 52: listener error caught', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
    firebaseConfig.getAuthInstance.mockReturnValue({});
  });

  it('catches and logs error thrown by a registered listener', () => {
    // Register a throwing listener — auth.js notifyListeners catches it at line 52
    const throwingCb = jest.fn(() => { throw new Error('Listener bomb'); });
    onAuthChange(throwingCb);
    // initAuth triggers onAuthStateChanged → notifyListeners → catch branch (line 52)
    onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return jest.fn(); });
    expect(() => initAuth()).not.toThrow();
    // The error should have been caught internally — throwingCb was called
    expect(throwingCb).toHaveBeenCalled();
  });
});
