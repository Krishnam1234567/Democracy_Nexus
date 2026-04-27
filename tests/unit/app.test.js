/**
 * @fileoverview Comprehensive tests for the App module - testing showToast directly.
 */

jest.mock('../../src/js/firebase-config.js', () => ({
  initializeFirebase: jest.fn().mockResolvedValue(true),
  isFirebaseConfigured: jest.fn().mockReturnValue(false),
  getAuthInstance: jest.fn().mockReturnValue(null),
  getAnalyticsInstance: jest.fn().mockReturnValue(null)
}));

jest.mock('../../src/js/auth.js', () => ({
  initAuth: jest.fn(),
  onAuthChange: jest.fn((cb) => cb(null)),
  signInWithGoogle: jest.fn().mockResolvedValue(null),
  signOutUser: jest.fn().mockResolvedValue(null),
  getUserDisplayInfo: jest.fn().mockReturnValue({ uid: null, displayName: null, photoURL: null })
}));

jest.mock('../../src/js/gemini.js', () => ({
  initGemini: jest.fn()
}));

jest.mock('../../src/js/router.js', () => ({
  initRouter: jest.fn()
}));

jest.mock('../../src/js/timeline.js', () => ({
  initTimeline: jest.fn()
}));

jest.mock('../../src/js/quiz.js', () => ({
  initQuiz: jest.fn(),
  selectQuestions: jest.fn().mockReturnValue([]),
  handleAnswer: jest.fn(),
  getGrade: jest.fn().mockReturnValue('Good'),
  getQuizState: jest.fn().mockReturnValue({})
}));

jest.mock('../../src/js/glossary.js', () => ({
  initGlossary: jest.fn()
}));

jest.mock('../../src/js/checklist.js', () => ({
  initChecklist: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/js/chatbot.js', () => ({
  initChatbot: jest.fn()
}));

jest.mock('../../src/js/accessibility.js', () => ({
  initScrollReveal: jest.fn(),
  initCounterAnimations: jest.fn(),
  prefersReducedMotion: jest.fn().mockReturnValue(false),
  announce: jest.fn(),
  moveFocus: jest.fn(),
  createFocusTrap: jest.fn().mockReturnValue({ activate: jest.fn(), deactivate: jest.fn() }),
  setupArrowKeyNavigation: jest.fn()
}));

jest.mock('../../src/js/analytics.js', () => ({
  trackAuthEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackEvent: jest.fn()
}));

import { showToast } from '../../src/js/app.js';

describe('App Module - showToast', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toast-container"></div>
      <nav id="nav-menu"></nav>
      <button id="nav-toggle" aria-expanded="false"></button>
      <a id="nav-brand"></a>
      <button id="auth-button">Sign In</button>
      <div id="user-avatar" hidden></div>
      <img id="user-avatar-img" />
      <span id="user-display-name"></span>
      <div id="hero-particles"></div>
      <div id="loading-screen"></div>
      <a class="nav-link" href="#home">Home</a>
    `;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a success toast in the container', () => {
    showToast('Hello success', 'success');
    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(1);
    expect(container.children[0].classList.contains('toast-success')).toBe(true);
  });

  it('creates an error toast', () => {
    showToast('Something failed', 'error');
    const toast = document.querySelector('.toast-error');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Something failed');
  });

  it('creates a warning toast', () => {
    showToast('Be careful', 'warning');
    const toast = document.querySelector('.toast-warning');
    expect(toast).not.toBeNull();
  });

  it('creates an info toast by default', () => {
    showToast('FYI message');
    const toast = document.querySelector('.toast-info');
    expect(toast).not.toBeNull();
  });

  it('toast has role="status" for accessibility', () => {
    showToast('Accessible message', 'info');
    const toast = document.querySelector('.toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('auto-dismisses toast after duration', () => {
    showToast('Will disappear', 'info', 1000);
    expect(document.querySelector('.toast')).not.toBeNull();
    jest.advanceTimersByTime(1400);
    // After removing class, second timeout removes from DOM
    jest.advanceTimersByTime(400);
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('does nothing when toast-container is absent', () => {
    document.body.innerHTML = '';
    expect(() => showToast('No container', 'info')).not.toThrow();
  });

  it('stacks multiple toasts', () => {
    showToast('First', 'info');
    showToast('Second', 'success');
    showToast('Third', 'error');
    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(3);
  });
});
