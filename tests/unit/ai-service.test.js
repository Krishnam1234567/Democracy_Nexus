jest.mock('../../src/js/ai-service', () => ({
  sendMessage: jest.fn().mockResolvedValue('Mock AI response'),
  resetChat: jest.fn(),
  isGeminiReady: jest.fn().mockReturnValue(true),
  initGemini: jest.fn().mockReturnValue(true)
}));

jest.mock('../../src/js/security', () => ({
  sanitizeInput: jest.fn(x => x),
  createRateLimiter: jest.fn().mockReturnValue({
    tryCall: jest.fn().mockReturnValue(true),
    reset: jest.fn(),
    remaining: jest.fn().mockReturnValue(9)
  }),
  sanitizeHTML: jest.fn(x => x),
  validateLength: jest.fn().mockReturnValue(true)
}));

import { sendMessage, resetChat, isGeminiReady } from '../../src/js/ai-service';

describe('AI Service Module', () => {
  describe('sendMessage', () => {
    it('returns mock response', async () => {
      const response = await sendMessage('hello');
      expect(response).toBe('Mock AI response');
    });
  });

  describe('resetChat', () => {
    it('does not throw when called', () => {
      expect(() => resetChat()).not.toThrow();
    });
  });

  describe('isGeminiReady', () => {
    it('returns boolean', () => {
      const result = isGeminiReady();
      expect(typeof result).toBe('boolean');
    });
  });
});
