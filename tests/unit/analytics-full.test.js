/**
 * @fileoverview Analytics module full coverage tests.
 * The moduleNameMapper in jest.config.js routes firebase-config.js imports
 * to tests/__mocks__/firebase-config.js, so all modules share the same mock.
 */

// Import analytics module — its firebase-config.js import is intercepted by moduleNameMapper
import {
  trackEvent,
  trackPageView,
  trackQuizComplete,
  trackChatInteraction,
  trackTimelineView,
  trackGlossaryLookup,
  trackChecklistAction,
  trackAuthEvent
} from '../../src/js/analytics.js';

// Import the SAME mocked firebase-config.js (via moduleNameMapper)
import * as firebaseConfig from '../../src/js/firebase-config.js';
// Import the mocked firebase/analytics
import { logEvent } from 'firebase/analytics';

describe('Analytics Module - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    firebaseConfig.isFirebaseConfigured.mockReturnValue(false);
    firebaseConfig.getAnalyticsInstance.mockReturnValue(null);
  });

  describe('trackEvent', () => {
    it('does nothing when Firebase is not configured', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(false);
      trackEvent('test_event');
      expect(logEvent).not.toHaveBeenCalled();
    });

    it('does nothing when analytics instance is null', () => {
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(null);
      trackEvent('test_event');
      expect(logEvent).not.toHaveBeenCalled();
    });

    it('calls logEvent with correct args when configured', () => {
      const mockInst = { id: 'analytics-instance' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackEvent('test_event', { param: 'value' });
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'test_event', { param: 'value' });
    });

    it('uses empty params by default', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackEvent('my_event');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'my_event', {});
    });

    it('handles logEvent errors gracefully', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      logEvent.mockImplementationOnce(() => { throw new Error('Analytics error'); });
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('trackPageView', () => {
    it('does not throw when not configured', () => {
      expect(() => trackPageView('home')).not.toThrow();
    });

    it('logs page_view with page_title', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackPageView('timeline');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'page_view', expect.objectContaining({ page_title: 'timeline' })
      );
    });

    it('logs page_view with page_location', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackPageView('quiz');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'page_view', expect.objectContaining({ page_location: expect.any(String) })
      );
    });
  });

  describe('trackQuizComplete', () => {
    it('does not throw when not configured', () => {
      expect(() => trackQuizComplete(80, 'beginner', 'voting')).not.toThrow();
    });

    it('logs quiz_complete with score/difficulty/category', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackQuizComplete(90, 'intermediate', 'process');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'quiz_complete',
        expect.objectContaining({ score: 90, difficulty: 'intermediate', category: 'process' })
      );
    });

    it('logs quiz_complete with timestamp', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackQuizComplete(70, 'advanced', 'all');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'quiz_complete', expect.objectContaining({ timestamp: expect.any(String) })
      );
    });
  });

  describe('trackChatInteraction', () => {
    it('does not throw when not configured', () => {
      expect(() => trackChatInteraction('opened')).not.toThrow();
    });

    it('logs chat_interaction with action', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackChatInteraction('opened');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'chat_interaction', { action: 'opened' });
    });

    it('logs closed action', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackChatInteraction('closed');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'chat_interaction', { action: 'closed' });
    });
  });

  describe('trackTimelineView', () => {
    it('does not throw when not configured', () => {
      expect(() => trackTimelineView('general', 'Polling')).not.toThrow();
    });

    it('logs timeline_view with election_type and phase', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackTimelineView('state', 'Campaign');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'timeline_view', { election_type: 'state', phase: 'Campaign' }
      );
    });

    it('logs local election type', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackTimelineView('local', 'Nomination');
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'timeline_view', { election_type: 'local', phase: 'Nomination' }
      );
    });
  });

  describe('trackGlossaryLookup', () => {
    it('does not throw when not configured', () => {
      expect(() => trackGlossaryLookup('EVM')).not.toThrow();
    });

    it('logs glossary_lookup with term', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackGlossaryLookup('EPIC');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'glossary_lookup', { term: 'EPIC' });
    });

    it('logs VVPAT lookup', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackGlossaryLookup('VVPAT');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'glossary_lookup', { term: 'VVPAT' });
    });
  });

  describe('trackChecklistAction', () => {
    it('does not throw when not configured', () => {
      expect(() => trackChecklistAction('voter-id', true)).not.toThrow();
    });

    it('logs checklist_action completed', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackChecklistAction('voter-id', true);
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'checklist_action', { item_id: 'voter-id', completed: true }
      );
    });

    it('logs checklist_action incomplete', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackChecklistAction('check-roll', false);
      expect(logEvent).toHaveBeenCalledWith(
        mockInst, 'checklist_action', { item_id: 'check-roll', completed: false }
      );
    });
  });

  describe('trackAuthEvent', () => {
    it('does not throw when not configured', () => {
      expect(() => trackAuthEvent('google')).not.toThrow();
    });

    it('logs auth_action with google', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackAuthEvent('google');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'auth_action', { method: 'google' });
    });

    it('logs auth_action signout', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackAuthEvent('signout');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'auth_action', { method: 'signout' });
    });

    it('logs auth_action anonymous', () => {
      const mockInst = { id: 'inst' };
      firebaseConfig.isFirebaseConfigured.mockReturnValue(true);
      firebaseConfig.getAnalyticsInstance.mockReturnValue(mockInst);
      trackAuthEvent('anonymous');
      expect(logEvent).toHaveBeenCalledWith(mockInst, 'auth_action', { method: 'anonymous' });
    });
  });
});
