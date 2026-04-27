/**
 * @fileoverview Comprehensive Firestore module tests.
 * Imports firebase-config.js directly so moduleNameMapper routes to the same mock.
 */

import {
  saveChatMessage,
  getChatHistory,
  saveQuizScore,
  getLeaderboard,
  saveChecklistProgress,
  getChecklistProgress,
  updateChecklistItem
} from '../../src/js/firestore.js';

// Import the same mocked firebase-config (via moduleNameMapper — same instance as firestore.js)
import * as firebaseConfig from '../../src/js/firebase-config.js';

// Import firebase/firestore mocks from setup.js globals
import {
  addDoc, getDoc, getDocs, setDoc, updateDoc,
  collection, doc, query, where, orderBy, limit
} from 'firebase/firestore';

// We also need to mock auth.js — firestore.js imports getCurrentUser from it.
// Since we can't use jest.mock() after imports in ESM, we use the __mocks__ file approach.
// The auth.js in src/js/__mocks__/auth.js is the manual mock.
jest.mock('../../src/js/auth.js');
import * as authModule from '../../src/js/auth.js';

const MOCK_DB = { __type: 'firestoreDb' };

function setupReady(withUser = true) {
  firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
  firebaseConfig.getDbInstance.mockReturnValue(MOCK_DB);
  authModule.getCurrentUser.mockReturnValue(
    withUser ? { uid: 'user1', displayName: 'Test User' } : null
  );
}

function setupNotReady() {
  firebaseConfig.isFirebaseConfigured.mockReturnValue(false);
  firebaseConfig.getDbInstance.mockReturnValue(null);
  authModule.getCurrentUser.mockReturnValue(null);
}

describe('Firestore Module - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupNotReady();
    // Reset firestore mocks to known return values
    collection.mockReturnValue('colRef');
    doc.mockReturnValue('docRef');
    query.mockReturnValue('queryRef');
    where.mockReturnValue('whereClause');
    orderBy.mockReturnValue('orderByClause');
    limit.mockReturnValue('limitClause');
  });

  // ==================== saveChatMessage ====================
  describe('saveChatMessage', () => {
    it('returns null when Firebase not configured', async () => {
      setupNotReady();
      expect(await saveChatMessage({ role: 'user', content: 'Hello' })).toBeNull();
    });

    it('returns null when user not logged in', async () => {
      setupReady(false);
      expect(await saveChatMessage({ role: 'user', content: 'Test' })).toBeNull();
    });

    it('returns document ID on success', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 'msg123' });
      expect(await saveChatMessage({ role: 'user', content: 'Hello!' })).toBe('msg123');
    });

    it('calls addDoc with userId, role, content', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 'msgX' });
      await saveChatMessage({ role: 'bot', content: 'AI reply' });
      expect(addDoc).toHaveBeenCalledWith(
        'colRef',
        expect.objectContaining({ userId: 'user1', role: 'bot', content: 'AI reply' })
      );
    });

    it('returns null when addDoc throws', async () => {
      setupReady(true);
      addDoc.mockRejectedValueOnce(new Error('Write error'));
      expect(await saveChatMessage({ role: 'user', content: 'Test' })).toBeNull();
    });
  });

  // ==================== getChatHistory ====================
  describe('getChatHistory', () => {
    it('returns [] when not configured', async () => {
      expect(await getChatHistory()).toEqual([]);
    });

    it('returns [] when user not logged in', async () => {
      setupReady(false);
      expect(await getChatHistory()).toEqual([]);
    });

    it('returns mapped messages array', async () => {
      setupReady(true);
      getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'msg1', data: () => ({ role: 'user', content: 'Hi' }) },
          { id: 'msg2', data: () => ({ role: 'bot', content: 'Hello' }) }
        ]
      });
      const result = await getChatHistory();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'msg1', role: 'user' });
    });

    it('accepts custom maxMessages', async () => {
      setupReady(true);
      getDocs.mockResolvedValueOnce({ docs: [] });
      await getChatHistory(20);
      expect(getDocs).toHaveBeenCalled();
    });

    it('returns [] on error', async () => {
      setupReady(true);
      getDocs.mockRejectedValueOnce(new Error('Read error'));
      expect(await getChatHistory()).toEqual([]);
    });
  });

  // ==================== saveQuizScore ====================
  describe('saveQuizScore', () => {
    it('returns null when not configured', async () => {
      expect(await saveQuizScore({ score: 8, total: 10, percentage: 80 })).toBeNull();
    });

    it('returns null when user not logged in', async () => {
      setupReady(false);
      expect(await saveQuizScore({ score: 8, total: 10, percentage: 80 })).toBeNull();
    });

    it('returns document ID on success', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 'score123' });
      getDoc.mockResolvedValueOnce({ exists: () => false });
      setDoc.mockResolvedValueOnce();
      const result = await saveQuizScore({
        score: 9, total: 10, percentage: 90,
        difficulty: 'beginner', category: 'voting', timeTaken: 60
      });
      expect(result).toBe('score123');
    });

    it('calls addDoc with correct score structure', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 's1' });
      getDoc.mockResolvedValueOnce({ exists: () => false });
      setDoc.mockResolvedValueOnce();
      await saveQuizScore({ score: 5, total: 10, percentage: 50, difficulty: 'advanced', category: 'all', timeTaken: 90 });
      expect(addDoc).toHaveBeenCalledWith(
        'colRef',
        expect.objectContaining({ userId: 'user1', score: 5, percentage: 50 })
      );
    });

    it('returns null on addDoc error', async () => {
      setupReady(true);
      addDoc.mockRejectedValueOnce(new Error('Write failed'));
      expect(await saveQuizScore({ score: 5, total: 10, percentage: 50 })).toBeNull();
    });

    it('updates leaderboard when new personal best', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 's2' });
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ bestScore: 40 }) });
      setDoc.mockResolvedValueOnce();
      await saveQuizScore({ score: 9, total: 10, percentage: 90, difficulty: 'beginner', category: 'voting', timeTaken: 30 });
      expect(setDoc).toHaveBeenCalled();
    });

    it('skips leaderboard update when not personal best', async () => {
      setupReady(true);
      addDoc.mockResolvedValueOnce({ id: 's3' });
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ bestScore: 100 }) });
      await saveQuizScore({ score: 7, total: 10, percentage: 70, difficulty: 'beginner', category: 'voting', timeTaken: 50 });
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  // ==================== getLeaderboard ====================
  describe('getLeaderboard', () => {
    it('returns [] when not configured', async () => {
      expect(await getLeaderboard()).toEqual([]);
    });

    it('returns ranked entries on success', async () => {
      setupReady(true);
      getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'e1', data: () => ({ displayName: 'Alice', bestScore: 95 }) },
          { id: 'e2', data: () => ({ displayName: 'Bob', bestScore: 80 }) }
        ]
      });
      const result = await getLeaderboard();
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].displayName).toBe('Alice');
    });

    it('accepts custom topN', async () => {
      setupReady(true);
      getDocs.mockResolvedValueOnce({ docs: [] });
      await getLeaderboard(5);
      expect(getDocs).toHaveBeenCalled();
    });

    it('returns [] on error', async () => {
      setupReady(true);
      getDocs.mockRejectedValueOnce(new Error('Error'));
      expect(await getLeaderboard()).toEqual([]);
    });
  });

  // ==================== saveChecklistProgress ====================
  describe('saveChecklistProgress', () => {
    it('returns false when not configured', async () => {
      expect(await saveChecklistProgress({ 'voter-id': true })).toBe(false);
    });

    it('returns false when user not logged in', async () => {
      setupReady(false);
      expect(await saveChecklistProgress({ 'voter-id': true })).toBe(false);
    });

    it('returns true on success', async () => {
      setupReady(true);
      setDoc.mockResolvedValueOnce();
      expect(await saveChecklistProgress({ 'voter-id': true })).toBe(true);
    });

    it('calls setDoc with merge:true and correct structure', async () => {
      setupReady(true);
      setDoc.mockResolvedValueOnce();
      await saveChecklistProgress({ 'voter-id': true, 'check-roll': false });
      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ userId: 'user1', progress: { 'voter-id': true, 'check-roll': false } }),
        { merge: true }
      );
    });

    it('returns false on error', async () => {
      setupReady(true);
      setDoc.mockRejectedValueOnce(new Error('Write error'));
      expect(await saveChecklistProgress({ 'voter-id': true })).toBe(false);
    });
  });

  // ==================== getChecklistProgress ====================
  describe('getChecklistProgress', () => {
    it('returns {} when not configured', async () => {
      expect(await getChecklistProgress()).toEqual({});
    });

    it('returns {} when user not logged in', async () => {
      setupReady(false);
      expect(await getChecklistProgress()).toEqual({});
    });

    it('returns progress map when document exists', async () => {
      setupReady(true);
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ progress: { 'voter-id': true, 'check-roll': false } })
      });
      const result = await getChecklistProgress();
      expect(result['voter-id']).toBe(true);
      expect(result['check-roll']).toBe(false);
    });

    it('returns {} when document does not exist', async () => {
      setupReady(true);
      getDoc.mockResolvedValueOnce({ exists: () => false });
      expect(await getChecklistProgress()).toEqual({});
    });

    it('returns {} when progress field is missing', async () => {
      setupReady(true);
      getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({}) });
      expect(await getChecklistProgress()).toEqual({});
    });

    it('returns {} on error', async () => {
      setupReady(true);
      getDoc.mockRejectedValueOnce(new Error('Read error'));
      expect(await getChecklistProgress()).toEqual({});
    });
  });

  // ==================== updateChecklistItem ====================
  describe('updateChecklistItem', () => {
    it('returns false when not configured', async () => {
      expect(await updateChecklistItem('voter-id', true)).toBe(false);
    });

    it('returns false when user not logged in', async () => {
      setupReady(false);
      expect(await updateChecklistItem('voter-id', true)).toBe(false);
    });

    it('returns true on success', async () => {
      setupReady(true);
      updateDoc.mockResolvedValueOnce();
      expect(await updateChecklistItem('voter-id', true)).toBe(true);
    });

    it('calls updateDoc with nested progress field', async () => {
      setupReady(true);
      updateDoc.mockResolvedValueOnce();
      await updateChecklistItem('check-roll', false);
      expect(updateDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ 'progress.check-roll': false })
      );
    });

    it('falls back to setDoc when updateDoc fails', async () => {
      setupReady(true);
      updateDoc.mockRejectedValueOnce(new Error('Not found'));
      setDoc.mockResolvedValueOnce();
      await updateChecklistItem('voter-id', true);
      expect(setDoc).toHaveBeenCalled();
    });

    it('returns boolean from fallback', async () => {
      setupReady(true);
      updateDoc.mockRejectedValueOnce(new Error('Error'));
      setDoc.mockResolvedValueOnce();
      expect(typeof await updateChecklistItem('voter-id', true)).toBe('boolean');
    });
  });
});
