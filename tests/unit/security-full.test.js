/**
 * @fileoverview Security module full coverage tests.
 */

import {
  sanitizeHTML,
  sanitizeInput,
  validateLength,
  escapeRegExp,
  createRateLimiter,
  isValidURL,
  debounce
} from '../../src/js/security.js';

describe('Security Module - Complete Coverage', () => {
  describe('sanitizeHTML', () => {
    it('allows safe HTML tags', () => {
      const result = sanitizeHTML('<p>Hello <strong>World</strong></p>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('strips script tags', () => {
      const result = sanitizeHTML('<script>alert("xss")</script><p>Safe</p>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe');
    });

    it('strips iframe tags', () => {
      const result = sanitizeHTML('<iframe src="evil.com"></iframe>');
      expect(result).not.toContain('<iframe>');
    });

    it('strips onerror attributes', () => {
      const result = sanitizeHTML('<img onerror="alert(1)" src="x">');
      expect(result).not.toContain('onerror');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
      expect(sanitizeHTML(42)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(sanitizeHTML('')).toBe('');
    });

    it('allows anchor tags with href', () => {
      const result = sanitizeHTML('<a href="https://example.com">Link</a>');
      expect(result).toContain('href');
    });

    it('allows span with class attribute', () => {
      const result = sanitizeHTML('<span class="highlight">Text</span>');
      expect(result).toContain('span');
    });

    it('allows list elements', () => {
      const result = sanitizeHTML('<ul><li>Item 1</li></ul>');
      expect(result).toContain('li');
    });

    it('strips form tags', () => {
      const result = sanitizeHTML('<form action="/steal"><input type="text"/></form>');
      expect(result).not.toContain('<form');
    });

    it('strips style tags', () => {
      const result = sanitizeHTML('<style>body { display: none }</style>');
      expect(result).not.toContain('<style>');
    });

    it('handles plain text without modification', () => {
      const result = sanitizeHTML('Plain text without HTML');
      expect(result).toContain('Plain text without HTML');
    });
  });

  describe('sanitizeInput', () => {
    it('returns clean text for normal input', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('removes HTML tags', () => {
      const result = sanitizeInput('<b>bold</b> text');
      expect(result).not.toContain('<b>');
      expect(result).toContain('text');
    });

    it('handles XSS script tags', () => {
      const result = sanitizeInput('<script>alert(1)</script>test');
      expect(result).not.toContain('<script>');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
    });

    it('handles unicode characters', () => {
      const result = sanitizeInput('भारत India');
      expect(result).toBe('भारत India');
    });

    it('preserves special characters that are not HTML', () => {
      const result = sanitizeInput('Hello & World');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('validateLength', () => {
    it('returns true when input is within length', () => {
      expect(validateLength('hello', 10)).toBe(true);
    });

    it('returns true when input equals max length', () => {
      expect(validateLength('hello', 5)).toBe(true);
    });

    it('returns false when input exceeds max length', () => {
      expect(validateLength('hello world', 5)).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(validateLength(null, 10)).toBe(false);
      expect(validateLength(undefined, 10)).toBe(false);
      expect(validateLength(42, 10)).toBe(false);
    });

    it('returns true for empty string', () => {
      expect(validateLength('', 0)).toBe(true);
    });
  });

  describe('escapeRegExp', () => {
    it('escapes dots', () => {
      expect(escapeRegExp('a.b')).toBe('a\\.b');
    });

    it('escapes asterisks', () => {
      expect(escapeRegExp('a*b')).toBe('a\\*b');
    });

    it('escapes brackets', () => {
      expect(escapeRegExp('[test]')).toBe('\\[test\\]');
    });

    it('escapes curly braces', () => {
      expect(escapeRegExp('{2}')).toBe('\\{2\\}');
    });

    it('escapes parentheses', () => {
      expect(escapeRegExp('(group)')).toBe('\\(group\\)');
    });

    it('escapes pipe character', () => {
      expect(escapeRegExp('a|b')).toBe('a\\|b');
    });

    it('escapes plus sign', () => {
      expect(escapeRegExp('a+b')).toBe('a\\+b');
    });

    it('escapes question mark', () => {
      expect(escapeRegExp('a?b')).toBe('a\\?b');
    });

    it('escapes caret', () => {
      expect(escapeRegExp('^start')).toBe('\\^start');
    });

    it('escapes dollar sign', () => {
      expect(escapeRegExp('end$')).toBe('end\\$');
    });

    it('does not modify normal text', () => {
      expect(escapeRegExp('hello world')).toBe('hello world');
    });

    it('returns empty string for non-string input', () => {
      expect(escapeRegExp(null)).toBe('');
      expect(escapeRegExp(undefined)).toBe('');
    });
  });

  describe('createRateLimiter', () => {
    it('allows calls within limit', () => {
      const limiter = createRateLimiter(3, 1000);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
    });

    it('blocks calls over limit', () => {
      const limiter = createRateLimiter(2, 1000);
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
    });

    it('reset allows calls again', () => {
      const limiter = createRateLimiter(1, 1000);
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
      limiter.reset();
      expect(limiter.tryCall()).toBe(true);
    });

    it('remaining() returns correct count initially', () => {
      const limiter = createRateLimiter(5, 1000);
      expect(limiter.remaining()).toBe(5);
    });

    it('remaining() decrements after calls', () => {
      const limiter = createRateLimiter(5, 1000);
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.remaining()).toBe(3);
    });

    it('remaining() returns 0 when exhausted', () => {
      const limiter = createRateLimiter(2, 1000);
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.remaining()).toBe(0);
    });

    it('allows calls again after window expires', async () => {
      const limiter = createRateLimiter(1, 50);
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
      await new Promise(r => setTimeout(r, 60));
      expect(limiter.tryCall()).toBe(true);
    });
  });

  describe('isValidURL', () => {
    it('returns true for https URLs', () => {
      expect(isValidURL('https://voters.eci.gov.in')).toBe(true);
    });

    it('returns true for http URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
    });

    it('returns false for javascript: protocol', () => {
      expect(isValidURL('javascript:alert(1)')).toBe(false);
    });

    it('returns false for data: URIs', () => {
      expect(isValidURL('data:text/html,<h1>XSS</h1>')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isValidURL(null)).toBe(false);
      expect(isValidURL(undefined)).toBe(false);
      expect(isValidURL(42)).toBe(false);
    });

    it('returns false for invalid URL format', () => {
      expect(isValidURL('not-a-url')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidURL('')).toBe(false);
    });

    it('returns true for URL with path', () => {
      expect(isValidURL('https://example.com/path/to/page')).toBe(true);
    });

    it('returns true for URL with query params', () => {
      expect(isValidURL('https://example.com?q=test&page=1')).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('delays execution by specified ms', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200);
      debounced();
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200);
      debounced();
      jest.advanceTimersByTime(100);
      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to debounced function', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      debounced('arg1', 'arg2');
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('only fires once for multiple rapid calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      debounced();
      debounced();
      debounced();
      debounced();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
