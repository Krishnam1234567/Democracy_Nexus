export const GoogleGenerativeAI = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  getGenerativeModel() {
    return {
      startChat: () => ({
        sendMessage: jest.fn().mockResolvedValue({
          response: { text: () => 'Mock AI response' }
        })
      })
    };
  }
};