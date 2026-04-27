/**
 * @fileoverview AI Chatbot UI component.
 * Manages the chatbot widget, message rendering, and user interactions.
 * @module chatbot
 */

import { sendMessage, resetChat } from './gemini.js';
import { sanitizeHTML, sanitizeInput, validateLength } from './security.js';
import { announce, createFocusTrap } from './accessibility.js';
import { trackChatInteraction } from './analytics.js';
import { saveChatMessage } from './firestore.js';

/** @type {boolean} Whether the chatbot panel is open */
let isOpen = false;

/** @type {boolean} Whether a message is currently being processed */
let isProcessing = false;

/** @type {Object|null} Focus trap for the chatbot panel */
let focusTrap = null;

/** Maximum message length */
const MAX_MESSAGE_LENGTH = 500;

/**
 * Initializes the chatbot component.
 * Sets up event listeners for toggle, send, input, and suggestion chips.
 */
export function initChatbot() {
  const toggleBtn = document.getElementById('chatbot-toggle');
  const closeBtn = document.getElementById('chatbot-close');
  const clearBtn = document.getElementById('chatbot-clear');
  const sendBtn = document.getElementById('chatbot-send');
  const input = document.getElementById('chatbot-input');
  const panel = document.getElementById('chatbot-panel');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleChatbot);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeChatbot);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearChat);
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
  }

  if (input) {
    input.addEventListener('input', handleInputChange);
    input.addEventListener('keydown', handleKeyDown);
  }

  // Set up suggestion chip handlers
  const chips = document.querySelectorAll('.suggestion-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question');
      if (question) {
        sendUserMessage(question);
      }
    });
  });

  // Set up focus trap
  if (panel) {
    focusTrap = createFocusTrap(panel);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeChatbot();
    }
  });
}

/**
 * Toggles the chatbot panel open/closed.
 */
function toggleChatbot() {
  if (isOpen) {
    closeChatbot();
  } else {
    openChatbot();
  }
}

/**
 * Opens the chatbot panel.
 */
function openChatbot() {
  const panel = document.getElementById('chatbot-panel');
  const toggleBtn = document.getElementById('chatbot-toggle');
  const badge = document.getElementById('chatbot-badge');

  if (panel) {
    panel.hidden = false;
    isOpen = true;
  }

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close AI Election Assistant chat');
  }

  if (badge) {
    badge.hidden = true;
  }

  if (focusTrap) {
    focusTrap.activate();
  }

  trackChatInteraction('opened');
  announce('Election Assistant chat opened');

  // Focus the input
  setTimeout(() => {
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.focus();
    }
  }, 100);
}

/**
 * Closes the chatbot panel.
 */
function closeChatbot() {
  const panel = document.getElementById('chatbot-panel');
  const toggleBtn = document.getElementById('chatbot-toggle');

  if (panel) {
    panel.hidden = true;
    isOpen = false;
  }

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open AI Election Assistant chat');
    toggleBtn.focus();
  }

  if (focusTrap) {
    focusTrap.deactivate();
  }

  trackChatInteraction('closed');
  announce('Election Assistant chat closed');
}

/**
 * Handles send button click.
 * @private
 */
function handleSend() {
  const input = document.getElementById('chatbot-input');
  if (input && input.value.trim()) {
    sendUserMessage(input.value.trim());
    input.value = '';
    updateCharCount(0);
    updateSendButton('');
  }
}

/**
 * Handles input changes for character count and send button state.
 * @param {Event} e - Input event.
 * @private
 */
function handleInputChange(e) {
  const value = e.target.value;
  updateCharCount(value.length);
  updateSendButton(value);

  // Auto-resize textarea
  e.target.style.height = 'auto';
  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
}

/**
 * Handles keyboard events in the input field.
 * @param {KeyboardEvent} e - Keyboard event.
 * @private
 */
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

/**
 * Updates the character count display.
 * @param {number} count - Current character count.
 * @private
 */
function updateCharCount(count) {
  const countEl = document.getElementById('chatbot-char-count');
  if (countEl) {
    countEl.textContent = `${count}/${MAX_MESSAGE_LENGTH}`;
    countEl.style.color = count > MAX_MESSAGE_LENGTH * 0.9 ? 'var(--color-error)' : '';
  }
}

/**
 * Updates the send button enabled/disabled state.
 * @param {string} value - Current input value.
 * @private
 */
function updateSendButton(value) {
  const sendBtn = document.getElementById('chatbot-send');
  if (sendBtn) {
    sendBtn.disabled = !value.trim() || isProcessing;
  }
}

/**
 * Sends a user message and gets the AI response.
 *
 * @param {string} message - The user's message.
 */
async function sendUserMessage(message) {
  if (isProcessing) {
    return;
  }

  // Validate message
  const cleanMessage = sanitizeInput(message);
  if (!cleanMessage || !validateLength(cleanMessage, MAX_MESSAGE_LENGTH)) {
    return;
  }

  isProcessing = true;
  updateSendButton('');

  // Add user message to chat
  appendMessage('user', cleanMessage);

  // Save to Firestore
  await saveChatMessage({ role: 'user', content: cleanMessage });

  // Show typing indicator
  showTypingIndicator();

  trackChatInteraction('message_sent');

  try {
    // Get AI response
    const response = await sendMessage(cleanMessage);

    // Remove typing indicator
    hideTypingIndicator();

    // Add bot response
    appendMessage('bot', response);

    // Save to Firestore
    await saveChatMessage({ role: 'bot', content: response });
  } catch (error) {
    hideTypingIndicator();
    appendMessage('bot', 'Sorry, I encountered an error. Please try again.', true);
    console.error('[Chatbot] Error:', error.message);
  }

  isProcessing = false;
  updateSendButton(document.getElementById('chatbot-input')?.value || '');
}

/**
 * Appends a message to the chat messages container.
 *
 * @param {'user'|'bot'} role - The message sender.
 * @param {string} content - The message content.
 * @param {boolean} [isError=false] - Whether this is an error message.
 */
export function appendMessage(role, content, isError = false) {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) {
    return;
  }

  const messageEl = document.createElement('div');
  messageEl.className = `chat-message ${role}-message ${isError ? 'error-message' : ''} scale-in`;

  const avatar = role === 'bot' ? '🤖' : '👤';

  // Convert markdown-like formatting to HTML
  const formattedContent = formatMessageContent(content);

  messageEl.innerHTML = `
    <div class="message-avatar" aria-hidden="true">${avatar}</div>
    <div class="message-content">${formattedContent}</div>
  `;

  // Remove suggestion chips after first user message
  const suggestions = document.getElementById('suggested-questions');
  if (suggestions && role === 'user') {
    suggestions.style.display = 'none';
  }

  messagesContainer.appendChild(messageEl);
  scrollToBottom();

  announce(`${role === 'bot' ? 'Assistant' : 'You'}: ${content.substring(0, 100)}`);
}

/**
 * Formats message content with basic markdown support.
 *
 * @param {string} content - Raw message content.
 * @returns {string} HTML formatted content.
 * @private
 */
function formatMessageContent(content) {
  let html = sanitizeHTML(content);

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  // Bullet points
  html = html.replace(/^• (.+)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Wrap in paragraphs if not already structured
  if (!html.includes('<p>') && !html.includes('<ul>') && !html.includes('<li>')) {
    html = `<p>${html}</p>`;
  }

  return html;
}

/**
 * Shows the typing indicator in the chat.
 * @private
 */
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) {
    return;
  }

  const typingEl = document.createElement('div');
  typingEl.className = 'chat-message bot-message typing-message';
  typingEl.id = 'typing-indicator';
  typingEl.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🤖</div>
    <div class="message-content typing-indicator">
      <div class="typing-dots">
        <span class="typing-dot" aria-hidden="true"></span>
        <span class="typing-dot" aria-hidden="true"></span>
        <span class="typing-dot" aria-hidden="true"></span>
      </div>
    </div>
  `;

  messagesContainer.appendChild(typingEl);
  scrollToBottom();

  announce('Assistant is typing...');
}

/**
 * Hides the typing indicator.
 * @private
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Scrolls the chat messages container to the bottom.
 * @private
 */
function scrollToBottom() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

/**
 * Clears the chat history and resets the conversation.
 * @private
 */
function clearChat() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) {
    return;
  }

  // Keep only the welcome message
  const welcomeMsg = document.getElementById('welcome-message');
  messagesContainer.innerHTML = '';

  if (welcomeMsg) {
    messagesContainer.appendChild(welcomeMsg);
    const suggestions = document.getElementById('suggested-questions');
    if (suggestions) {
      suggestions.style.display = '';
    }
  }

  // Reset Gemini chat session
  resetChat();

  announce('Chat history cleared');
  trackChatInteraction('cleared');
}

/**
 * Returns whether the chatbot panel is currently open.
 * @returns {boolean}
 */
export function isChatbotOpen() {
  return isOpen;
}
