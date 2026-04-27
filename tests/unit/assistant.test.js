jest.mock('../../src/js/ai-service', () => ({
  sendMessage: jest.fn().mockResolvedValue('Mock AI response'),
  resetChat: jest.fn(),
  isGeminiReady: jest.fn().mockReturnValue(true)
}));

jest.mock('../../src/js/analytics', () => ({
  trackChatInteraction: jest.fn()
}));

import { appendMessage, isChatbotOpen } from '../../src/js/assistant';

describe('Assistant Module', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="chatbot-messages"></div>
      <div id="welcome-message" class="welcome"></div>
      <div id="suggested-questions"></div>
    `;
  });

  describe('appendMessage', () => {
    it('appends user message to chat', () => {
      appendMessage('user', 'Test message');
      const messages = document.querySelectorAll('.chat-message');
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('user-message')).toBe(true);
    });

    it('appends bot message to chat', () => {
      appendMessage('bot', 'Bot response');
      const messages = document.querySelectorAll('.chat-message');
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('bot-message')).toBe(true);
    });

    it('adds error class for error messages', () => {
      appendMessage('bot', 'Error occurred', true);
      const messages = document.querySelectorAll('.chat-message.error-message');
      expect(messages.length).toBe(1);
    });

    it('hides suggestions after user message', () => {
      document.getElementById('suggested-questions').style.display = '';
      appendMessage('user', 'Test');
      expect(document.getElementById('suggested-questions').style.display).toBe('none');
    });
  });

  describe('isChatbotOpen', () => {
    it('returns boolean', () => {
      const result = isChatbotOpen();
      expect(typeof result).toBe('boolean');
    });
  });
});
