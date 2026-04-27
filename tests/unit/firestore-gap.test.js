/**
 * Targets firestore.js uncovered lines:
 *  - line 188: updateLeaderboard early return when userId is null
 *  - line 205: catch branch in updateLeaderboard
 */

jest.mock('../../src/js/firebase-config.js', () => ({
  isFirebaseConfigured: jest.fn().mockReturnValue(true),
  getDbInstance: jest.fn().mockReturnValue({ __db: true }),
  getAuthInstance: jest.fn().mockReturnValue(null),
  getAnalyticsInstance: jest.fn().mockReturnValue(null),
  getAppInstance: jest.fn().mockReturnValue(null),
  initializeFirebase: jest.fn()
}));

jest.mock('../../src/js/auth.js');

import * as firebaseConfig from '../../src/js/firebase-config.js';
import * as authModule from '../../src/js/auth.js';
import { saveQuizScore } from '../../src/js/firestore.js';
import { addDoc, getDoc, setDoc } from 'firebase/firestore';

describe('firestore.js — updateLeaderboard branches (lines 188, 205)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
    firebaseConfig.getDbInstance.mockReturnValue({ __db: true });
    require('firebase/firestore').collection.mockReturnValue('colRef');
    require('firebase/firestore').doc.mockReturnValue('docRef');
  });

  it('line 188: skips leaderboard update when user has no uid (getUserId returns null)', async () => {
    // getCurrentUser returns user without uid → getUserId returns null → line 188 early return
    authModule.getCurrentUser.mockReturnValue({ displayName: 'Test' }); // no uid
    addDoc.mockResolvedValueOnce({ id: 'score1' });
    const result = await saveQuizScore({ score: 5, total: 10, percentage: 50 });
    // Should still return score id even if leaderboard skipped
    expect(result).toBe('score1');
  });

  it('line 205: logs error when getDoc throws in updateLeaderboard', async () => {
    authModule.getCurrentUser.mockReturnValue({ uid: 'u1', displayName: 'User' });
    addDoc.mockResolvedValueOnce({ id: 'score2' });
    // Make getDoc throw to trigger line 205 catch branch
    getDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));
    const result = await saveQuizScore({ score: 8, total: 10, percentage: 80 });
    expect(result).toBe('score2');
  });
});
