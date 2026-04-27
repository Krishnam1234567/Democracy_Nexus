export const sendMessage = jest.fn().mockResolvedValue('Mock AI response');
export const resetChat = jest.fn();
export const isGeminiReady = jest.fn().mockReturnValue(false);
export const initGemini = jest.fn().mockReturnValue(false);
export const createRateLimiter = jest.fn();