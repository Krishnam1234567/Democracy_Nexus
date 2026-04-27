/**
 * @fileoverview Main application entry point for the Election Education Assistant.
 * Bootstraps all modules: Firebase, Auth, Router, Timeline, Quiz, Glossary, Checklist, Chatbot.
 * @module app
 */

import { initializeFirebase, isFirebaseConfigured } from './firebase-config.js';
import { initAuth, onAuthChange, signInWithGoogle, signOutUser, getUserDisplayInfo } from './auth.js';
import { initGemini } from './ai-service.js';
import { initRouter } from './router.js';
import { initTimeline } from './timeline.js';
import { initQuiz } from './quiz.js';
import { initGlossary } from './glossary.js';
import { initChecklist } from './checklist.js';
import { initChatbot } from './assistant.js';
import { initScrollReveal, initCounterAnimations, prefersReducedMotion } from './accessibility.js';
import { trackAuthEvent } from './analytics.js';

/**
 * Application initialization function.
 * Called when the DOM is fully loaded.
 */
async function initApp() {
  try {
    // 1. Initialize Firebase (auth, firestore, analytics)
    const firebaseReady = await initializeFirebase();
    if (firebaseReady) {
      initAuth();
    }

    // 2. Initialize Gemini AI for chatbot
    initGemini();

    // 3. Initialize UI components
    initRouter();
    initTimeline();
    initQuiz();
    initGlossary();
    await initChecklist();
    initChatbot();

    // 4. Set up navigation
    setupNavigation();

    // 5. Set up auth UI
    setupAuthUI();

    // 6. Initialize animations
    initScrollReveal();
    initCounterAnimations();
    createHeroParticles();

    // 7. Set up mobile menu
    setupMobileMenu();

    // 8. Set up toast notifications
    setupToasts();

    // 9. Hide loading screen
    hideLoadingScreen();

    console.info('[App] Election Education Assistant initialized successfully.');
  } catch (error) {
    console.error('[App] Initialization error:', error);
    hideLoadingScreen();
    showToast('Application partially loaded. Some features may be unavailable.', 'warning');
  }
}

/**
 * Sets up click handlers for navigation links.
 * @private
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      // Close mobile menu when a link is clicked
      const menu = document.getElementById('nav-menu');
      const toggle = document.getElementById('nav-toggle');
      if (menu && menu.classList.contains('open')) {
        menu.classList.remove('open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // Nav brand clicks navigate to home
  const brand = document.getElementById('nav-brand');
  if (brand) {
    brand.addEventListener('click', () => {
      window.location.hash = '#home';
    });
  }
}

/**
 * Sets up the authentication UI button and state listener.
 * @private
 */
function setupAuthUI() {
  const authButton = document.getElementById('auth-button');

  if (authButton) {
    authButton.addEventListener('click', async () => {
      const userInfo = getUserDisplayInfo();
      if (userInfo.uid) {
        // Sign out
        await signOutUser();
        trackAuthEvent('signout');
        showToast('Signed out successfully.', 'info');
      } else {
        // Sign in
        if (!isFirebaseConfigured()) {
          showToast('Firebase not configured. Sign-in unavailable.', 'warning');
          return;
        }
        const user = await signInWithGoogle();
        if (user) {
          trackAuthEvent('google');
          showToast(`Welcome, ${user.displayName || 'User'}!`, 'success');
        }
      }
    });
  }

  // Listen for auth state changes
  onAuthChange((user) => {
    updateAuthUI(user);
  });
}

/**
 * Updates the auth button and user avatar based on auth state.
 *
 * @param {Object|null} user - The Firebase user object.
 * @private
 */
function updateAuthUI(user) {
  const authButton = document.getElementById('auth-button');
  const userAvatar = document.getElementById('user-avatar');
  const avatarImg = document.getElementById('user-avatar-img');
  const displayName = document.getElementById('user-display-name');

  if (!authButton) {
    return;
  }

  if (user && !user.isAnonymous) {
    authButton.textContent = 'Sign Out';
    authButton.setAttribute('aria-label', 'Sign out');

    if (userAvatar) {
      userAvatar.hidden = false;
    }
    if (avatarImg && user.photoURL) {
      avatarImg.src = user.photoURL;
      avatarImg.alt = `${user.displayName || 'User'}'s avatar`;
    }
    if (displayName) {
      displayName.textContent = user.displayName || 'User';
    }
  } else {
    authButton.textContent = 'Sign In';
    authButton.setAttribute('aria-label', 'Sign in with Google');

    if (userAvatar) {
      userAvatar.hidden = true;
    }
  }
}

/**
 * Sets up the mobile hamburger menu toggle.
 * @private
 */
function setupMobileMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      menu.classList.toggle('open');
    });
  }
}

/**
 * Hides the initial loading screen with a fade-out transition.
 * @private
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after transition
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }, 500);
  }
}

/**
 * Creates animated particles in the hero background.
 * Respects reduced motion preferences.
 * @private
 */
function createHeroParticles() {
  if (prefersReducedMotion()) {
    return;
  }

  const particlesContainer = document.getElementById('hero-particles');
  if (!particlesContainer) {
    return;
  }

  const colors = [
    'rgba(59, 130, 246, 0.3)',
    'rgba(139, 92, 246, 0.3)',
    'rgba(16, 185, 129, 0.3)',
    'rgba(245, 158, 11, 0.2)'
  ];

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.width = `${4 + Math.random() * 8}px`;
    particle.style.height = particle.style.width;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.animationDuration = `${8 + Math.random() * 12}s`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particlesContainer.appendChild(particle);
  }
}

// ============================================================
// Toast Notification System
// ============================================================

/** @type {number} Auto-dismiss timeout for toasts in ms */
const TOAST_TIMEOUT = 5000;

/**
 * Sets up the toast notification system.
 * Note: Toast container already exists in HTML.
 * @private
 */
function setupToasts() {}

/**
 * Shows a toast notification.
 *
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'|'warning'} [type='info'] - Toast type.
 * @param {number} [duration=5000] - Duration in milliseconds.
 */
export function showToast(message, type = 'info', duration = TOAST_TIMEOUT) {
  const container = document.getElementById('toast-container');
  if (!container) {
    return;
  }

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span aria-hidden="true">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// Bootstrap
// ============================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
