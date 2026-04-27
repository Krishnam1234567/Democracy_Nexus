jest.mock('../../src/js/accessibility', () => ({
  announce: jest.fn(),
  moveFocus: jest.fn()
}));

jest.mock('../../src/js/analytics', () => ({
  trackPageView: jest.fn()
}));

import { navigateTo, getCurrentPage, onRouteChange } from '../../src/js/router';

describe('Router Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="page-home"></div>
      <div id="page-timeline"></div>
      <div id="page-quiz"></div>
      <div id="page-glossary"></div>
      <div id="page-checklist"></div>
      <a href="#home" class="nav-link" data-page="home">Home</a>
      <a href="#timeline" class="nav-link" data-page="timeline">Timeline</a>
    `;
  });

  describe('navigateTo', () => {
    it('updates current page', () => {
      navigateTo('quiz');
      expect(getCurrentPage()).toBe('quiz');
    });

    it('shows the target page', () => {
      navigateTo('timeline');
      const newPage = document.getElementById('page-timeline');
      expect(newPage.classList.contains('active')).toBe(true);
    });

    it('updates navigation links', () => {
      navigateTo('quiz');
      const homeLink = document.querySelector('[data-page="home"]');
      expect(homeLink.classList.contains('active')).toBe(false);
    });

    it('redirects invalid page to home', () => {
      navigateTo('nonexistent');
      expect(getCurrentPage()).toBe('home');
    });
  });

  describe('getCurrentPage', () => {
    it('returns current page string', () => {
      const page = getCurrentPage();
      expect(typeof page).toBe('string');
      expect(['home', 'timeline', 'quiz', 'glossary', 'checklist']).toContain(page);
    });
  });

  describe('onRouteChange', () => {
    it('registers callback and returns unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = onRouteChange(callback);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});