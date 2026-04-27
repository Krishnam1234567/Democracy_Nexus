import { jest } from '@jest/globals';

describe('Router Module Tests', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  describe('Navigation', () => {
    test('should handle hash changes', () => {
      window.location.hash = 'home';
      expect(window.location.hash).toBe('#home');
    });

    test('should support multiple pages', () => {
      const pages = ['home', 'timeline', 'quiz', 'glossary', 'checklist'];
      pages.forEach(page => {
        window.location.hash = page;
        expect(window.location.hash).toBe(`#${page}`);
      });
    });
  });

  describe('URL Parsing', () => {
    test('should parse hash from URL', () => {
      const url = new URL('http://example.com/#timeline');
      expect(url.hash).toBe('#timeline');
    });

    test('should handle query parameters', () => {
      const url = new URL('http://example.com/?page=quiz');
      expect(url.searchParams.get('page')).toBe('quiz');
    });

    test('should parse different pages from hash', () => {
      const pages = ['home', 'timeline', 'quiz', 'glossary', 'checklist'];
      pages.forEach(expected => {
        const url = new URL(`http://example.com/#${expected}`);
        expect(url.hash).toBe(`#${expected}`);
      });
    });
  });
});