import { trackEvent, trackPageView, trackQuizComplete, trackChatInteraction } from '../../src/js/analytics';

describe('Analytics Module', () => {
  describe('trackEvent', () => {
    it('does not throw when called', () => {
      expect(() => trackEvent('test_event')).not.toThrow();
    });

    it('accepts params object', () => {
      expect(() => trackEvent('test_event', { key: 'value' })).not.toThrow();
    });
  });

  describe('trackPageView', () => {
    it('accepts page name', () => {
      expect(() => trackPageView('home')).not.toThrow();
    });
  });

  describe('trackQuizComplete', () => {
    it('tracks quiz completion with score', () => {
      expect(() => trackQuizComplete(85, 'beginner', 'all')).not.toThrow();
    });
  });

  describe('trackChatInteraction', () => {
    it('tracks chat actions', () => {
      expect(() => trackChatInteraction('message_sent')).not.toThrow();
      expect(() => trackChatInteraction('opened')).not.toThrow();
      expect(() => trackChatInteraction('closed')).not.toThrow();
    });
  });
});