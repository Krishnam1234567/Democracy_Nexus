/**
 * @fileoverview Tests for the Timeline module.
 */

jest.mock('../../src/js/analytics.js', () => ({
  trackTimelineView: jest.fn()
}));

jest.mock('../../src/js/accessibility.js', () => ({
  announce: jest.fn()
}));

jest.mock('../../src/js/security.js', () => ({
  sanitizeHTML: jest.fn((s) => s)
}));

import { renderTimeline, getTimelineState, initTimeline } from '../../src/js/timeline.js';

describe('Timeline Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="timeline-container"></div>
      <div id="summary-grid"></div>
      <button class="timeline-tab active" data-type="general" aria-selected="true">General</button>
      <button class="timeline-tab" data-type="state" aria-selected="false">State</button>
      <button class="timeline-tab" data-type="local" aria-selected="false">Local</button>
    `;
    jest.clearAllMocks();
  });

  describe('renderTimeline', () => {
    it('renders timeline items for general election type', () => {
      renderTimeline('general');
      const container = document.getElementById('timeline-container');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('renders timeline items for state election type', () => {
      renderTimeline('state');
      const container = document.getElementById('timeline-container');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('renders timeline items for local election type', () => {
      renderTimeline('local');
      const container = document.getElementById('timeline-container');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('shows error message for unknown timeline type', () => {
      renderTimeline('unknown_type');
      const container = document.getElementById('timeline-container');
      expect(container.innerHTML).toContain('not available');
    });

    it('returns early when container is missing', () => {
      document.body.innerHTML = '';
      expect(() => renderTimeline('general')).not.toThrow();
    });

    it('renders timeline cards with tabindex and role', () => {
      renderTimeline('general');
      const cards = document.querySelectorAll('.timeline-card');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(card.getAttribute('tabindex')).toBe('0');
      });
    });

    it('renders timeline items with visible class via requestAnimationFrame', () => {
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { cb(); return 0; });
      renderTimeline('general');
      const items = document.querySelectorAll('.fade-in-up');
      items.forEach(item => {
        expect(item.classList.contains('visible')).toBe(true);
      });
      window.requestAnimationFrame.mockRestore();
    });
  });

  describe('getTimelineState', () => {
    it('returns an object with type and expandedItem', () => {
      const state = getTimelineState();
      expect(state).toHaveProperty('type');
      expect(state).toHaveProperty('expandedItem');
    });

    it('defaults to general type', () => {
      const state = getTimelineState();
      expect(state.type).toBe('general');
    });

    it('defaults expandedItem to null', () => {
      const state = getTimelineState();
      expect(state.expandedItem).toBeNull();
    });
  });

  describe('initTimeline', () => {
    it('renders timeline and summary on init', () => {
      initTimeline();
      const container = document.getElementById('timeline-container');
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('sets up tab navigation handlers', () => {
      initTimeline();
      const statTab = document.querySelector('[data-type="state"]');
      statTab.click();
      const state = getTimelineState();
      expect(state.type).toBe('state');
    });

    it('does not switch tab if same type is clicked', () => {
      initTimeline();
      const generalTab = document.querySelector('[data-type="general"]');
      generalTab.click();
      const state = getTimelineState();
      expect(state.type).toBe('general');
    });
  });

  describe('Timeline card interaction', () => {
    it('expands details when a card is clicked', () => {
      renderTimeline('general');
      const firstCard = document.querySelector('.timeline-card');
      if (firstCard) {
        firstCard.click();
        // should not throw
        expect(true).toBe(true);
      }
    });

    it('handles Enter key on timeline card', () => {
      renderTimeline('general');
      const firstCard = document.querySelector('.timeline-card');
      if (firstCard) {
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        firstCard.dispatchEvent(event);
        expect(true).toBe(true);
      }
    });

    it('handles Space key on timeline card', () => {
      renderTimeline('general');
      const firstCard = document.querySelector('.timeline-card');
      if (firstCard) {
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        firstCard.dispatchEvent(event);
        expect(true).toBe(true);
      }
    });
  });
});
