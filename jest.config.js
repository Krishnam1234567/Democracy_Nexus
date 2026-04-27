/**
 * Jest configuration for Election Education Assistant.
 * Supports ES modules and jsdom environment for DOM testing.
 */
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.json' }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase|@google/generative-ai|dompurify)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
    // Route firebase-config.js from ANY relative depth to the mock
    'firebase-config\\.js$': '<rootDir>/tests/__mocks__/firebase-config.js',
    // Route election-data.json from any depth
    'election-data\\.json$': '<rootDir>/tests/__mocks__/election-data.json',
    // Route generative-ai
    '^@google/generative-ai$': '<rootDir>/tests/__mocks__/generative-ai.js',
    // Route gemini.js from any relative depth
    'gemini\\.js$': '<rootDir>/tests/__mocks__/gemini.js'
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/firebase-config.js',
    '!src/js/pwa.js',
    '!src/js/gemini.js',
    '!src/js/app.js'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 55,
      functions: 72,
      lines: 70
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  setupFiles: ['<rootDir>/tests/setup.js']
};
