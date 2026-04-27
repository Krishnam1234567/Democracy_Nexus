/**
 * @fileoverview Accessibility utilities for WCAG 2.1 AA compliance.
 * Manages focus, announcements, keyboard navigation, and reduced motion.
 * @module accessibility
 */

/**
 * Announces a message to screen readers using an ARIA live region.
 *
 * @param {string} message - The message to announce.
 * @param {'polite'|'assertive'} [priority='polite'] - The urgency level.
 */
export function announce(message, priority = 'polite') {
  let announcer = document.getElementById('aria-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'aria-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    document.body.appendChild(announcer);
  }

  announcer.setAttribute('aria-live', priority);
  // Clear then set to trigger announcement
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Manages focus by moving it to a specified element.
 * Useful for page transitions and modal opens.
 *
 * @param {string|HTMLElement} target - CSS selector string or HTMLElement.
 * @param {Object} [options={}] - Options.
 * @param {boolean} [options.preventScroll=false] - Prevent scroll on focus.
 */
export function moveFocus(target, options = {}) {
  const element = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!element) {
    return;
  }

  // Make the element focusable if it isn't
  if (!element.hasAttribute('tabindex') && !isFocusable(element)) {
    element.setAttribute('tabindex', '-1');
  }

  element.focus({ preventScroll: options.preventScroll || false });
}

/**
 * Checks if an element is natively focusable.
 *
 * @param {HTMLElement} element - The element to check.
 * @returns {boolean} True if the element is focusable.
 */
function isFocusable(element) {
  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  return focusableTags.includes(element.tagName) && !element.disabled;
}

/**
 * Creates a focus trap within a container element.
 * Useful for modals and chat panels.
 *
 * @param {HTMLElement} container - The container to trap focus within.
 * @returns {Object} Object with activate() and deactivate() methods.
 */
export function createFocusTrap(container) {
  const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let previousFocus = null;

  /**
   * Handles Tab key to keep focus within the container.
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusableElements.length === 0) {
      return;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  return {
    /**
     * Activates the focus trap, storing the previously focused element.
     */
    activate() {
      previousFocus = document.activeElement;
      container.addEventListener('keydown', handleKeyDown);
      const firstFocusable = container.querySelector(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    },

    /**
     * Deactivates the focus trap and restores focus to the previous element.
     */
    deactivate() {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    }
  };
}

/**
 * Sets up keyboard navigation for interactive elements.
 * Supports arrow keys for tab-like navigation within groups.
 *
 * @param {HTMLElement} container - The container with navigable items.
 * @param {string} itemSelector - CSS selector for navigable items.
 */
export function setupArrowKeyNavigation(container, itemSelector) {
  container.addEventListener('keydown', (event) => {
    const items = Array.from(container.querySelectorAll(itemSelector));
    const currentIndex = items.indexOf(document.activeElement);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        items[nextIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        break;
      default:
        break;
    }
  });
}

/**
 * Checks if the user prefers reduced motion.
 *
 * @returns {boolean} True if reduced motion is preferred.
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Initializes scroll-based reveal animations with IntersectionObserver.
 * Items with the 'fade-in-up' class will become visible when scrolled into view.
 */
export function initScrollReveal() {
  if (prefersReducedMotion()) {
    // If reduced motion is preferred, make everything visible immediately
    document.querySelectorAll('.fade-in-up, .stagger-children').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.fade-in-up, .stagger-children').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Initializes counter animations for stat numbers.
 * Animates numbers from 0 to their target value.
 */
export function initCounterAnimations() {
  const counters = document.querySelectorAll('.stat-number[data-count]');

  if (prefersReducedMotion()) {
    counters.forEach((counter) => {
      counter.textContent = counter.getAttribute('data-count');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

/**
 * Animates a single counter element from 0 to its target value.
 *
 * @param {HTMLElement} element - The counter element with data-count attribute.
 * @private
 */
function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-count'), 10);
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easedProgress * target);

    element.textContent = currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}
