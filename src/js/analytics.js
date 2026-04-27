/**
 * @fileoverview Firebase Analytics event tracking.
 * Logs user interactions for engagement analysis.
 * @module analytics
 */

import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance, isFirebaseConfigured } from './firebase-config.js';

/**
 * Logs an analytics event to Firebase Analytics.
 * Silently fails if Analytics is not available.
 *
 * @param {string} eventName - The event name (snake_case recommended).
 * @param {Object} [params={}] - Additional event parameters.
 */
export function trackEvent(eventName, params = {}) {
  if (!isFirebaseConfigured()) {
    return;
  }

  const analyticsInstance = getAnalyticsInstance();
  if (!analyticsInstance) {
    return;
  }

  try {
    logEvent(analyticsInstance, eventName, params);
  } catch (error) {
    console.warn('[Analytics] Failed to log event:', error.message);
  }
}

/**
 * Tracks a page view event.
 * @param {string} pageName - The page identifier.
 */
export function trackPageView(pageName) {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: window.location.href
  });
}

/**
 * Tracks quiz completion event.
 * @param {number} score - The quiz score percentage.
 * @param {string} difficulty - Quiz difficulty level.
 * @param {string} category - Quiz category.
 */
export function trackQuizComplete(score, difficulty, category) {
  trackEvent('quiz_complete', {
    score,
    difficulty,
    category,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks a chatbot interaction.
 * @param {string} action - The type of interaction ('message_sent', 'opened', 'closed').
 */
export function trackChatInteraction(action) {
  trackEvent('chat_interaction', { action });
}

/**
 * Tracks timeline exploration.
 * @param {string} electionType - Type of election timeline viewed.
 * @param {string} phase - The phase/step viewed.
 */
export function trackTimelineView(electionType, phase) {
  trackEvent('timeline_view', { election_type: electionType, phase });
}

/**
 * Tracks glossary term lookup.
 * @param {string} term - The glossary term searched or viewed.
 */
export function trackGlossaryLookup(term) {
  trackEvent('glossary_lookup', { term });
}

/**
 * Tracks checklist item completion.
 * @param {string} itemId - The checklist item identifier.
 * @param {boolean} completed - Whether the item was completed.
 */
export function trackChecklistAction(itemId, completed) {
  trackEvent('checklist_action', { item_id: itemId, completed });
}

/**
 * Tracks user authentication events.
 * @param {string} method - The auth method ('google', 'anonymous', 'signout').
 */
export function trackAuthEvent(method) {
  trackEvent('auth_action', { method });
}
