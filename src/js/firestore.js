/**
 * @fileoverview Firestore data access layer.
 * Handles CRUD operations for chat history, quiz scores, checklist progress, and leaderboard.
 * @module firestore
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getDbInstance, isFirebaseConfigured } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

/**
 * Collection names used in Firestore.
 * @enum {string}
 */
const COLLECTIONS = {
  CHAT_HISTORY: 'chatHistory',
  QUIZ_SCORES: 'quizScores',
  CHECKLIST_PROGRESS: 'checklistProgress',
  LEADERBOARD: 'leaderboard'
};

/**
 * Checks if Firestore operations are available.
 * @returns {boolean} True if Firestore is ready.
 * @private
 */
function isDbReady() {
  return isFirebaseConfigured() && getDbInstance() !== null;
}

/**
 * Gets the current user's UID or null.
 * @returns {string|null}
 * @private
 */
function getUserId() {
  const user = getCurrentUser();
  return user ? user.uid : null;
}

// ============================================================
// Chat History Operations
// ============================================================

/**
 * Saves a chat message to Firestore.
 *
 * @param {Object} message - The chat message object.
 * @param {string} message.role - 'user' or 'bot'.
 * @param {string} message.content - The message content.
 * @returns {Promise<string|null>} The document ID or null on failure.
 */
export async function saveChatMessage(message) {
  if (!isDbReady()) {
    return null;
  }
  const userId = getUserId();
  if (!userId) {
    return null;
  }

  try {
    const db = getDbInstance();
    const chatRef = collection(db, COLLECTIONS.CHAT_HISTORY);
    const docRef = await addDoc(chatRef, {
      userId,
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Failed to save chat message:', error.message);
    return null;
  }
}

/**
 * Retrieves chat history for the current user.
 *
 * @param {number} [maxMessages=50] - Maximum number of messages to retrieve.
 * @returns {Promise<Array<Object>>} Array of chat message objects.
 */
export async function getChatHistory(maxMessages = 50) {
  if (!isDbReady()) {
    return [];
  }
  const userId = getUserId();
  if (!userId) {
    return [];
  }

  try {
    const db = getDbInstance();
    const chatRef = collection(db, COLLECTIONS.CHAT_HISTORY);
    const q = query(
      chatRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'asc'),
      limit(maxMessages)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
  } catch (error) {
    console.error('[Firestore] Failed to get chat history:', error.message);
    return [];
  }
}

// ============================================================
// Quiz Score Operations
// ============================================================

/**
 * Saves a quiz score to Firestore.
 *
 * @param {Object} scoreData - The quiz score data.
 * @param {number} scoreData.score - Number of correct answers.
 * @param {number} scoreData.total - Total number of questions.
 * @param {number} scoreData.percentage - Score percentage.
 * @param {string} scoreData.difficulty - Quiz difficulty level.
 * @param {string} scoreData.category - Quiz category.
 * @param {number} scoreData.timeTaken - Time taken in seconds.
 * @returns {Promise<string|null>} Document ID or null.
 */
export async function saveQuizScore(scoreData) {
  if (!isDbReady()) {
    return null;
  }
  const userId = getUserId();
  if (!userId) {
    return null;
  }

  try {
    const db = getDbInstance();
    const user = getCurrentUser();
    const scoresRef = collection(db, COLLECTIONS.QUIZ_SCORES);
    const docRef = await addDoc(scoresRef, {
      userId,
      displayName: user?.displayName || 'Anonymous',
      score: scoreData.score,
      total: scoreData.total,
      percentage: scoreData.percentage,
      difficulty: scoreData.difficulty,
      category: scoreData.category,
      timeTaken: scoreData.timeTaken,
      timestamp: serverTimestamp()
    });

    // Also update leaderboard
    await updateLeaderboard(scoreData.percentage, user?.displayName || 'Anonymous');

    return docRef.id;
  } catch (error) {
    console.error('[Firestore] Failed to save quiz score:', error.message);
    return null;
  }
}

/**
 * Updates the leaderboard with a new score if it's a personal best.
 *
 * @param {number} percentage - The score percentage.
 * @param {string} displayName - The user's display name.
 * @returns {Promise<void>}
 * @private
 */
async function updateLeaderboard(percentage, displayName) {
  const userId = getUserId();
  if (!userId) {
    return;
  }

  try {
    const db = getDbInstance();
    const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, userId);
    const existing = await getDoc(leaderboardRef);

    if (!existing.exists() || existing.data().bestScore < percentage) {
      await setDoc(leaderboardRef, {
        userId,
        displayName,
        bestScore: percentage,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('[Firestore] Failed to update leaderboard:', error.message);
  }
}

/**
 * Retrieves the top scores from the leaderboard.
 *
 * @param {number} [topN=10] - Number of top scores to retrieve.
 * @returns {Promise<Array<Object>>} Array of leaderboard entries.
 */
export async function getLeaderboard(topN = 10) {
  if (!isDbReady()) {
    return [];
  }

  try {
    const db = getDbInstance();
    const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARD);
    const q = query(
      leaderboardRef,
      orderBy('bestScore', 'desc'),
      limit(topN)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d, index) => ({
      rank: index + 1,
      ...d.data()
    }));
  } catch (error) {
    console.error('[Firestore] Failed to get leaderboard:', error.message);
    return [];
  }
}

// ============================================================
// Checklist Progress Operations
// ============================================================

/**
 * Saves checklist progress for the current user.
 *
 * @param {Object<string, boolean>} progress - Map of checklist item IDs to completion status.
 * @returns {Promise<boolean>} True if saved successfully.
 */
export async function saveChecklistProgress(progress) {
  if (!isDbReady()) {
    return false;
  }
  const userId = getUserId();
  if (!userId) {
    return false;
  }

  try {
    const db = getDbInstance();
    const progressRef = doc(db, COLLECTIONS.CHECKLIST_PROGRESS, userId);
    await setDoc(progressRef, {
      userId,
      progress,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to save checklist progress:', error.message);
    return false;
  }
}

/**
 * Retrieves checklist progress for the current user.
 *
 * @returns {Promise<Object<string, boolean>>} Map of checklist item IDs to completion status.
 */
export async function getChecklistProgress() {
  if (!isDbReady()) {
    return {};
  }
  const userId = getUserId();
  if (!userId) {
    return {};
  }

  try {
    const db = getDbInstance();
    const progressRef = doc(db, COLLECTIONS.CHECKLIST_PROGRESS, userId);
    const snapshot = await getDoc(progressRef);
    if (snapshot.exists()) {
      return snapshot.data().progress || {};
    }
    return {};
  } catch (error) {
    console.error('[Firestore] Failed to get checklist progress:', error.message);
    return {};
  }
}

/**
 * Updates a single checklist item's completion status.
 *
 * @param {string} itemId - The checklist item ID.
 * @param {boolean} completed - Whether the item is completed.
 * @returns {Promise<boolean>} True if updated successfully.
 */
export async function updateChecklistItem(itemId, completed) {
  if (!isDbReady()) {
    return false;
  }
  const userId = getUserId();
  if (!userId) {
    return false;
  }

  try {
    const db = getDbInstance();
    const progressRef = doc(db, COLLECTIONS.CHECKLIST_PROGRESS, userId);
    await updateDoc(progressRef, {
      [`progress.${itemId}`]: completed,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    // If document doesn't exist yet, create it
    const progress = { [itemId]: completed };
    return saveChecklistProgress(progress);
  }
}
