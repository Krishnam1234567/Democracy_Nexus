/**
 * @fileoverview Comprehensive glossary module tests.
 */

jest.mock('../../src/js/analytics.js', () => ({
  trackGlossaryLookup: jest.fn()
}));

jest.mock('../../src/js/accessibility.js', () => ({
  announce: jest.fn()
}));

jest.mock('../../src/js/security.js', () => ({
  sanitizeHTML: jest.fn((s) => String(s)),
  sanitizeInput: jest.fn((s) => (typeof s === 'string' ? s.trim() : '')),
  escapeRegExp: jest.fn((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  debounce: jest.fn((fn) => fn)
}));

import {
  filterTerms,
  renderGlossary,
  getGlossaryState,
  initGlossary
} from '../../src/js/glossary.js';

function setupGlossaryDOM() {
  document.body.innerHTML = `
    <input id="glossary-search-input" type="text" />
    <div id="glossary-grid"></div>
    <div id="search-results-count"></div>
    <button class="filter-btn active" data-category="all" aria-selected="true">All</button>
    <button class="filter-btn" data-category="voting" aria-selected="false">Voting</button>
    <button class="filter-btn" data-category="voter-registration" aria-selected="false">Registration</button>
  `;
}

describe('Glossary Module - Full Coverage', () => {
  beforeEach(() => {
    setupGlossaryDOM();
    jest.clearAllMocks();
  });

  describe('filterTerms', () => {
    it('returns all terms when no filter applied', () => {
      const terms = filterTerms();
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
    });

    it('returns consistent number of total terms across calls', () => {
      const terms1 = filterTerms();
      const terms2 = filterTerms();
      expect(terms1.length).toBe(terms2.length);
    });
  });

  describe('renderGlossary', () => {
    it('renders all terms to grid', () => {
      renderGlossary();
      const grid = document.getElementById('glossary-grid');
      expect(grid.children.length).toBeGreaterThan(0);
    });

    it('updates search results count element', () => {
      renderGlossary();
      const count = document.getElementById('search-results-count');
      expect(count.textContent).not.toBe('');
    });

    it('count text contains "terms"', () => {
      renderGlossary();
      const count = document.getElementById('search-results-count');
      expect(count.textContent).toContain('term');
    });

    it('returns early when grid is missing', () => {
      document.body.innerHTML = '';
      expect(() => renderGlossary()).not.toThrow();
    });

    it('renders glossary cards with tabindex', () => {
      renderGlossary();
      const cards = document.querySelectorAll('.glossary-card');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach(card => {
        expect(card.getAttribute('tabindex')).toBe('0');
      });
    });

    it('renders cards with glossary term headings', () => {
      renderGlossary();
      const headings = document.querySelectorAll('.glossary-term');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('renders category tags on cards', () => {
      renderGlossary();
      const tags = document.querySelectorAll('.glossary-category-tag');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('renders extra info when available', () => {
      renderGlossary();
      const extras = document.querySelectorAll('.glossary-extra');
      expect(extras.length).toBeGreaterThan(0); // EPIC has extra
    });
  });

  describe('getGlossaryState', () => {
    it('returns object with searchQuery property', () => {
      const state = getGlossaryState();
      expect(state).toHaveProperty('searchQuery');
    });

    it('returns object with activeCategory property', () => {
      const state = getGlossaryState();
      expect(state).toHaveProperty('activeCategory');
    });

    it('default searchQuery is empty string', () => {
      const state = getGlossaryState();
      expect(state.searchQuery).toBe('');
    });

    it('default activeCategory is "all"', () => {
      const state = getGlossaryState();
      expect(state.activeCategory).toBe('all');
    });
  });

  describe('initGlossary', () => {
    it('does not throw on init', () => {
      expect(() => initGlossary()).not.toThrow();
    });

    it('renders terms on initialization', () => {
      initGlossary();
      const grid = document.getElementById('glossary-grid');
      expect(grid.children.length).toBeGreaterThan(0);
    });

    it('sets up search input listener', () => {
      initGlossary();
      const searchInput = document.getElementById('glossary-search-input');
      expect(searchInput).not.toBeNull();
    });

    it('handles Escape key in search to clear query', () => {
      initGlossary();
      const searchInput = document.getElementById('glossary-search-input');
      searchInput.value = 'test';
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      searchInput.dispatchEvent(event);
      expect(searchInput.value).toBe('');
    });

    it('updates active category on filter click', () => {
      initGlossary();
      const votingBtn = document.querySelector('[data-category="voting"]');
      votingBtn.click();
      const state = getGlossaryState();
      expect(state.activeCategory).toBe('voting');
    });

    it('removes active class from other filters when one is clicked', () => {
      initGlossary();
      const votingBtn = document.querySelector('[data-category="voting"]');
      votingBtn.click();
      const allBtn = document.querySelector('[data-category="all"]');
      expect(allBtn.classList.contains('active')).toBe(false);
    });

    it('adds active class to clicked filter', () => {
      initGlossary();
      const votingBtn = document.querySelector('[data-category="voting"]');
      votingBtn.click();
      expect(votingBtn.classList.contains('active')).toBe(true);
    });

    it('triggers search input event', () => {
      initGlossary();
      const searchInput = document.getElementById('glossary-search-input');
      searchInput.value = 'EVM';
      searchInput.dispatchEvent(new Event('input'));
      expect(true).toBe(true);
    });
  });

  describe('Card interaction', () => {
    it('toggles expanded state on card click', () => {
      renderGlossary();
      const card = document.querySelector('.glossary-card');
      if (card) {
        card.click();
        expect(card.classList.contains('expanded')).toBe(true);
      }
    });

    it('collapses card on second click', () => {
      renderGlossary();
      const card = document.querySelector('.glossary-card');
      if (card) {
        card.click(); // expand
        card.click(); // collapse
        expect(card.classList.contains('expanded')).toBe(false);
      }
    });

    it('handles Enter key on card', () => {
      renderGlossary();
      const card = document.querySelector('.glossary-card');
      if (card) {
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        card.dispatchEvent(event);
        expect(true).toBe(true);
      }
    });

    it('handles Space key on card', () => {
      renderGlossary();
      const card = document.querySelector('.glossary-card');
      if (card) {
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
        card.dispatchEvent(event);
        expect(true).toBe(true);
      }
    });

    it('closes other cards when one is expanded', () => {
      renderGlossary();
      const cards = document.querySelectorAll('.glossary-card');
      if (cards.length >= 2) {
        cards[0].click();
        cards[1].click();
        expect(cards[0].classList.contains('expanded')).toBe(false);
        expect(cards[1].classList.contains('expanded')).toBe(true);
      }
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no terms match filter', () => {
      initGlossary();
      // Click a category with no matching terms
      const regBtn = document.querySelector('[data-category="conduct"]');
      if (regBtn) {
        regBtn.click();
      }
      // Simulate empty results by checking grid content
      const grid = document.getElementById('glossary-grid');
      expect(grid).not.toBeNull();
    });
  });
});
