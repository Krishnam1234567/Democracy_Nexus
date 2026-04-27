/**
 * @fileoverview Security utilities for the Election Education Assistant.
 * Provides input sanitization, XSS prevention, and rate limiting.
 * @module security
 */

import DOMPurify from 'dompurify';

/**
 * Sanitization configuration for DOMPurify.
 * Restricts allowed HTML tags and attributes to prevent XSS attacks.
 * @type {Object}
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'aria-label'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with a restrictive configuration.
 *
 * @param {string} dirtyHtml - The potentially unsafe HTML string.
 * @returns {string} Sanitized HTML string safe for DOM insertion.
 *
 * @example
 * const clean = sanitizeHTML('<script>alert("xss")</script><p>Hello</p>');
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeHTML(dirtyHtml) {
  if (typeof dirtyHtml !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirtyHtml, SANITIZE_CONFIG);
}

/**
 * Sanitizes plain text input by removing all HTML and trimming whitespace.
 * Suitable for user inputs like search queries, chat messages, etc.
 *
 * @param {string} input - The raw user input string.
 * @returns {string} Sanitized plain text with no HTML tags.
 *
 * @example
 * const safe = sanitizeInput('<b>hello</b> world');
 * // Returns: 'hello world'
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  // Strip all HTML tags and trim
  const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  return stripped.trim();
}

/**
 * Validates that a string does not exceed maximum length.
 *
 * @param {string} input - The input string to validate.
 * @param {number} maxLength - Maximum allowed length.
 * @returns {boolean} True if input is valid (within length limit).
 */
export function validateLength(input, maxLength) {
  if (typeof input !== 'string') {
    return false;
  }
  return input.length <= maxLength;
}

/**
 * Escapes special characters in a string for safe use in regular expressions.
 *
 * @param {string} str - The string to escape.
 * @returns {string} Escaped string safe for use in RegExp constructor.
 */
export function escapeRegExp(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a rate limiter that throttles function invocations.
 * Prevents abuse of API calls and user interactions.
 *
 * @param {number} maxCalls - Maximum number of calls allowed in the time window.
 * @param {number} windowMs - Time window in milliseconds.
 * @returns {Object} Rate limiter with `tryCall()`, `reset()`, and `remaining()` methods.
 *
 * @example
 * const limiter = createRateLimiter(5, 60000); // 5 calls per minute
 * if (limiter.tryCall()) {
 *   // proceed with API call
 * } else {
 *   // rate limited, show message to user
 * }
 */
export function createRateLimiter(maxCalls, windowMs) {
  const calls = [];

  return {
    /**
     * Attempts to make a call. Returns true if within rate limit.
     * @returns {boolean} True if the call is allowed.
     */
    tryCall() {
      const now = Date.now();
      // Remove expired entries
      while (calls.length > 0 && calls[0] <= now - windowMs) {
        calls.shift();
      }
      if (calls.length < maxCalls) {
        calls.push(now);
        return true;
      }
      return false;
    },

    /**
     * Resets the rate limiter, clearing all recorded calls.
     */
    reset() {
      calls.length = 0;
    },

    /**
     * Returns the number of remaining calls allowed in the current window.
     * @returns {number} Remaining calls.
     */
    remaining() {
      const now = Date.now();
      while (calls.length > 0 && calls[0] <= now - windowMs) {
        calls.shift();
      }
      return Math.max(0, maxCalls - calls.length);
    }
  };
}

/**
 * Validates a URL string to ensure it uses safe protocols (http/https).
 *
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL uses http or https protocol.
 */
export function isValidURL(url) {
  if (typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Creates a debounced version of a function.
 * The function will only execute after the specified delay has elapsed
 * since the last invocation.
 *
 * @param {Function} fn - The function to debounce.
 * @param {number} delayMs - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
export function debounce(fn, delayMs) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
