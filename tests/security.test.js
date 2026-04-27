import { 
  sanitizeHTML, 
  sanitizeInput, 
  validateLength, 
  escapeRegExp, 
  createRateLimiter, 
  isValidURL 
} from '../src/js/security';

describe('Security Utils', () => {
  describe('sanitizeHTML', () => {
    it('removes script tags', () => {
      const dirty = '<script>alert("xss")</script><p>Safe</p>';
      expect(sanitizeHTML(dirty)).toBe('<p>Safe</p>');
    });

    it('allows permitted tags and attributes', () => {
      const clean = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      expect(sanitizeHTML(clean)).toBe(clean);
    });

    it('handles non-string inputs', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
      expect(sanitizeHTML(123)).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('strips all HTML tags', () => {
      expect(sanitizeInput('<b>bold</b> text')).toBe('bold text');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('handles non-string inputs', () => {
      expect(sanitizeInput(null)).toBe('');
    });
  });

  describe('validateLength', () => {
    it('returns true if within limit', () => {
      expect(validateLength('hello', 10)).toBe(true);
      expect(validateLength('hello', 5)).toBe(true);
    });

    it('returns false if exceeds limit', () => {
      expect(validateLength('hello world', 5)).toBe(false);
    });

    it('handles non-string inputs', () => {
      expect(validateLength(null, 10)).toBe(false);
    });
  });

  describe('escapeRegExp', () => {
    it('escapes special regex characters', () => {
      expect(escapeRegExp('hello.*+?^${}()|[]\\')).toBe('hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });
  });

  describe('createRateLimiter', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('allows calls under limit', () => {
      const limiter = createRateLimiter(2, 1000);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
    });

    it('blocks calls over limit', () => {
      const limiter = createRateLimiter(2, 1000);
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
    });

    it('resets after time window', () => {
      const limiter = createRateLimiter(1, 1000);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(false);
      
      jest.advanceTimersByTime(1001);
      
      expect(limiter.tryCall()).toBe(true);
    });
    
    it('can be manually reset', () => {
      const limiter = createRateLimiter(1, 1000);
      limiter.tryCall();
      expect(limiter.tryCall()).toBe(false);
      limiter.reset();
      expect(limiter.tryCall()).toBe(true);
    });
  });

  describe('isValidURL', () => {
    it('validates http/https URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
    });

    it('rejects unsecure or invalid protocols', () => {
      expect(isValidURL('javascript:alert(1)')).toBe(false);
      expect(isValidURL('data:text/html,<html>')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(false);
    });

    it('rejects invalid URL strings', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL(null)).toBe(false);
    });
  });
});
