/**
 * @fileoverview Election Glossary component.
 * Renders searchable, filterable election terminology cards.
 * @module glossary
 */

import electionData from '../data/election-data.json';
import { sanitizeHTML, sanitizeInput, escapeRegExp, debounce } from './security.js';
import { announce } from './accessibility.js';
import { trackGlossaryLookup } from './analytics.js';

/** @type {string} Current search query */
let searchQuery = '';

/** @type {string} Current category filter */
let activeCategory = 'all';

/**
 * Initializes the glossary component.
 * Sets up search input and category filter handlers.
 */
export function initGlossary() {
  setupSearch();
  setupFilters();
  renderGlossary();
}

/**
 * Sets up the search input with debounced filtering.
 * @private
 */
function setupSearch() {
  const searchInput = document.getElementById('glossary-search-input');
  if (!searchInput) {
    return;
  }

  const debouncedSearch = debounce((value) => {
    searchQuery = sanitizeInput(value);
    renderGlossary();

    if (searchQuery) {
      trackGlossaryLookup(searchQuery);
    }
  }, 300);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  // Clear search on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchQuery = '';
      renderGlossary();
    }
  });
}

/**
 * Sets up category filter button handlers.
 * @private
 */
function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');

      // Update active state
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      activeCategory = category;
      renderGlossary();
      announce(`Showing ${category === 'all' ? 'all' : category} terms`);
    });
  });
}

/**
 * Filters glossary terms based on current search query and category.
 *
 * @returns {Array<Object>} Filtered glossary terms.
 */
export function filterTerms() {
  let terms = [...electionData.glossary];

  // Filter by category
  if (activeCategory !== 'all') {
    terms = terms.filter((term) => term.category === activeCategory);
  }

  // Filter by search
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    terms = terms.filter((term) =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.abbreviation.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery)
    );
  }

  return terms;
}

/**
 * Renders the glossary grid with filtered terms.
 */
export function renderGlossary() {
  const grid = document.getElementById('glossary-grid');
  const countEl = document.getElementById('search-results-count');

  if (!grid) {
    return;
  }

  const filteredTerms = filterTerms();

  // Update results count
  if (countEl) {
    const message = searchQuery
      ? `${filteredTerms.length} term${filteredTerms.length !== 1 ? 's' : ''} found for "${searchQuery}"`
      : `Showing ${filteredTerms.length} term${filteredTerms.length !== 1 ? 's' : ''}`;
    countEl.textContent = message;
  }

  if (filteredTerms.length === 0) {
    grid.innerHTML = `
      <div class="glossary-empty" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 2rem; margin-bottom: 1rem;">🔍</p>
        <p style="color: var(--color-text-secondary);">No terms found. Try a different search or filter.</p>
      </div>
    `;
    announce('No glossary terms found for the current search.');
    return;
  }

  grid.innerHTML = filteredTerms.map((term, index) => createGlossaryCard(term, index)).join('');

  // Attach click handlers for expanding cards
  grid.querySelectorAll('.glossary-card').forEach((card) => {
    card.addEventListener('click', () => toggleCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
    });
  });

  // Make newly rendered cards visible
  requestAnimationFrame(() => {
    grid.querySelectorAll('.glossary-card').forEach((card) => {
      card.classList.add('visible');
    });
  });

  announce(`${filteredTerms.length} glossary terms displayed`);
}

/**
 * Creates the HTML for a single glossary card.
 *
 * @param {Object} term - The glossary term data.
 * @param {number} index - The card index.
 * @returns {string} HTML string for the card.
 * @private
 */
function createGlossaryCard(term, index) {
  const highlightedTerm = highlightSearch(term.term);
  const highlightedDef = highlightSearch(term.definition);

  return `
    <article
      class="glossary-card fade-in-up"
      id="glossary-card-${index}"
      role="listitem"
      tabindex="0"
      aria-label="${term.term}${term.abbreviation ? ` (${term.abbreviation})` : ''}"
    >
      <h3 class="glossary-term">${highlightedTerm}</h3>
      ${term.abbreviation ? `<span class="glossary-abbr">${sanitizeHTML(term.abbreviation)}</span>` : ''}
      <p class="glossary-definition">${highlightedDef}</p>
      <span class="glossary-category-tag">${sanitizeHTML(term.category)}</span>
      ${term.extra ? `
        <div class="glossary-extra">
          <p>${sanitizeHTML(term.extra)}</p>
        </div>
      ` : ''}
    </article>
  `;
}

/**
 * Highlights the search query in text.
 *
 * @param {string} text - The text to highlight within.
 * @returns {string} HTML with highlighted matches.
 * @private
 */
function highlightSearch(text) {
  if (!searchQuery) {
    return sanitizeHTML(text);
  }

  const escaped = escapeRegExp(searchQuery);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const highlighted = text.replace(regex, '<mark style="background: rgba(245, 158, 11, 0.3); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
  return sanitizeHTML(highlighted);
}

/**
 * Toggles the expanded state of a glossary card.
 *
 * @param {HTMLElement} card - The card element to toggle.
 * @private
 */
function toggleCard(card) {
  const isExpanded = card.classList.contains('expanded');

  // Close all cards
  document.querySelectorAll('.glossary-card.expanded').forEach((c) => {
    c.classList.remove('expanded');
  });

  // Toggle the clicked card
  if (!isExpanded) {
    card.classList.add('expanded');
    const term = card.querySelector('.glossary-term')?.textContent;
    if (term) {
      trackGlossaryLookup(term);
      announce(`Expanded details for ${term}`);
    }
  }
}

/**
 * Returns the current glossary filter state.
 * @returns {Object} Current filter state.
 */
export function getGlossaryState() {
  return { searchQuery, activeCategory };
}
