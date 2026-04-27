import { jest } from '@jest/globals';
import { sanitizeInput, sanitizeHTML, createRateLimiter, escapeRegExp } from '../../src/js/security.js';

describe('Security Module - Full Coverage', () => {
  describe('sanitizeInput', () => {
    test('should sanitize normal input', () => {
      const result = sanitizeInput('Hello World');
      expect(result).toBe('Hello World');
    });

    test('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ');
      expect(result).toBe('hello');
    });

    test('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    test('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>test');
      expect(result).not.toContain('<script>');
    });

    test('should handle unicode', () => {
      const result = sanitizeInput('Élection India भारत');
      expect(result).toBe('Élection India भारत');
    });
  });

  describe('sanitizeHTML', () => {
    test('should allow safe HTML', () => {
      const result = sanitizeHTML('<p>Hello</p>');
      expect(result).toContain('Hello');
    });

    test('should strip dangerous tags', () => {
      const result = sanitizeHTML('<script>alert(1)</script>');
      expect(result).not.toContain('<script>');
    });

    test('should handle plain text', () => {
      const result = sanitizeHTML('Just text');
      expect(result).toContain('Just text');
    });
  });

  describe('createRateLimiter', () => {
    test('should allow calls within limit', () => {
      const limiter = createRateLimiter(5, 1000);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
    });

    test('should block calls over limit', () => {
      const limiter = createRateLimiter(2, 1000);
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
    });

    test('should reset after time', async () => {
      const limiter = createRateLimiter(1, 50);
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
      await new Promise(r => setTimeout(r, 60));
      expect(limiter.tryCall()).toBe(true);
    });
  });

  describe('escapeRegExp', () => {
    test('should escape special characters', () => {
      const result = escapeRegExp('[test]{2}');
      expect(result).toBe('\\[test\\]\\{2\\}');
    });

    test('should escape dots', () => {
      const result = escapeRegExp('a.b');
      expect(result).toBe('a\\.b');
    });

    test('should handle normal text', () => {
      const result = escapeRegExp('hello');
      expect(result).toBe('hello');
    });
  });
});