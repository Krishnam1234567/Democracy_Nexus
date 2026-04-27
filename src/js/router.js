/**
 * @fileoverview Simple hash-based client-side router for SPA navigation.
 * @module router
 */

import { announce, moveFocus } from './accessibility.js';
import { trackPageView } from './analytics.js';

/** @type {string} Currently active page */
let currentPage = 'home';

/** @type {Array<Function>} Route change listeners */
const routeListeners = [];

/**
 * Valid page identifiers.
 * @type {Set<string>}
 */
const VALID_PAGES = new Set(['home', 'timeline', 'quiz', 'glossary', 'checklist']);

/**
 * Page titles for accessibility announcements and document title.
 * @type {Object<string, string>}
 */
const PAGE_TITLES = {
  home: 'Home — Election Education Assistant',
  timeline: 'Election Timeline — Election Education Assistant',
  quiz: 'Knowledge Quiz — Election Education Assistant',
  glossary: 'Election Glossary — Election Education Assistant',
  checklist: 'Voter Checklist — Election Education Assistant'
};

/**
 * Initializes the router by setting up hash change listeners
 * and navigating to the initial route.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleHashChange);
  // Handle initial route
  handleHashChange();
}

/**
 * Handles hash change events and updates the active page.
 * @private
 */
function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash);
}

/**
 * Navigates to a specific page.
 *
 * @param {string} page - The page identifier to navigate to.
 */
export function navigateTo(page) {
  if (!VALID_PAGES.has(page)) {
    page = 'home';
  }

  if (page === currentPage) {
    return;
  }

  const previousPage = currentPage;
  currentPage = page;

  // Update URL hash without triggering hashchange
  if (window.location.hash !== `#${page}`) {
    history.pushState(null, '', `#${page}`);
  }

  // Update document title
  document.title = PAGE_TITLES[page] || PAGE_TITLES.home;

  // Update page visibility
  updatePageVisibility(previousPage, page);

  // Remove hidden attribute for proper CSS display handling
  const newSection = document.getElementById(`page-${page}`);
  if (newSection && newSection.hasAttribute('hidden')) {
    newSection.removeAttribute('hidden');
  }

  // Update navigation active state
  updateNavigation(page);

  // Track page view
  trackPageView(page);

  // Announce page change to screen readers
  announce(`Navigated to ${page} page`);

  // Move focus to main content
  setTimeout(() => {
    moveFocus('#main-content');
  }, 100);

  // Notify listeners
  notifyRouteListeners(page, previousPage);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Updates which page section is visible.
 *
 * @param {string} oldPage - The page being hidden.
 * @param {string} newPage - The page being shown.
 * @private
 */
function updatePageVisibility(oldPage, newPage) {
  // Hide old page
  const oldSection = document.getElementById(`page-${oldPage}`);
  if (oldSection) {
    oldSection.classList.remove('active');
    oldSection.hidden = true;
  }

  // Show new page
  const newSection = document.getElementById(`page-${newPage}`);
  if (newSection) {
    newSection.hidden = false;
    newSection.classList.add('active');
    // Add entrance animation
    newSection.classList.add('page-enter');
    newSection.addEventListener('animationend', () => {
      newSection.classList.remove('page-enter');
    }, { once: true });
  }
}

/**
 * Updates the active state of navigation links.
 *
 * @param {string} activePage - The currently active page.
 * @private
 */
function updateNavigation(activePage) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    const page = link.getAttribute('data-page');
    if (page === activePage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Registers a callback for route change events.
 *
 * @param {Function} callback - Function called with (newPage, oldPage).
 * @returns {Function} Unsubscribe function.
 */
export function onRouteChange(callback) {
  routeListeners.push(callback);
  return () => {
    const index = routeListeners.indexOf(callback);
    if (index > -1) {
      routeListeners.splice(index, 1);
    }
  };
}

/**
 * Notifies all route change listeners.
 * @param {string} newPage
 * @param {string} oldPage
 * @private
 */
function notifyRouteListeners(newPage, oldPage) {
  routeListeners.forEach((cb) => {
    try {
      cb(newPage, oldPage);
    } catch (err) {
      console.error('[Router] Listener error:', err.message);
    }
  });
}

/**
 * Returns the currently active page identifier.
 * @returns {string}
 */
export function getCurrentPage() {
  return currentPage;
}
