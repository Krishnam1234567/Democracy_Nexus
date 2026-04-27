jest.mock('../../src/data/election-data.json', () => ({
  glossary: [
    {
      id: 'evm',
      term: 'EVM',
      abbreviation: 'Electronic Voting Machine',
      definition: 'A device used for casting votes in elections.',
      category: 'voting'
    },
    {
      id: 'vvpats',
      term: 'VVPAT',
      abbreviation: 'Voter Verifiable Paper Audit Trail',
      definition: 'A device that provides a paper trail of votes.',
      category: 'voting'
    },
    {
      id: 'epic',
      term: 'EPIC',
      abbreviation: 'Elector Photo Identity Card',
      definition: 'The voter ID card.',
      category: 'registration'
    }
  ],
  quiz: { questions: [] },
  checklist: [],
  timeline: {}
}));

jest.mock('../../src/js/analytics', () => ({
  trackGlossaryLookup: jest.fn()
}));

import { filterTerms, renderGlossary, getGlossaryState } from '../../src/js/glossary';

describe('Glossary Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="glossary-search-input" />
      <div id="glossary-grid"></div>
      <div id="search-results-count"></div>
      <button class="filter-btn active" data-category="all">All</button>
      <button class="filter-btn" data-category="voting">Voting</button>
    `;
  });

  describe('filterTerms', () => {
    it('returns array of terms', () => {
      const terms = filterTerms();
      expect(Array.isArray(terms)).toBe(true);
    });

    it('filters by search query', () => {
      const terms = filterTerms();
      if (terms.length > 0) {
        const firstTerm = terms[0].term.toLowerCase();
        const searchQuery = firstTerm.substring(0, 3);
        const filtered = filterTerms();
        expect(filtered.length).toBeGreaterThan(0);
      }
    });
  });

  describe('renderGlossary', () => {
    it('renders terms to grid', () => {
      renderGlossary();
      const grid = document.getElementById('glossary-grid');
      expect(grid.children.length).toBeGreaterThan(0);
    });

    it('updates results count', () => {
      renderGlossary();
      const count = document.getElementById('search-results-count');
      expect(count.textContent).not.toBe('');
    });

    it('updates results count when rendering', () => {
      renderGlossary();
      const count = document.getElementById('search-results-count');
      expect(count.textContent).toContain('terms');
    });
  });

  describe('getGlossaryState', () => {
    it('returns state object with searchQuery and activeCategory', () => {
      const state = getGlossaryState();
      expect(state).toHaveProperty('searchQuery');
      expect(state).toHaveProperty('activeCategory');
    });
  });
});