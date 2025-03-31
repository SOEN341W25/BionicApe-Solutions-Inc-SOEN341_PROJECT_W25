// test/jest.setup.js Setup file for Jest tests

// Mock DOM environment for unit tests that require DOM
const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html><body>' +
  '<ul id="messages"></ul>' +
  '<form id="form"><input id="input" /></form>' +
  '<div id="currentChatBoxTitle"></div>' +
  '<ul id="renderList"></ul>' +
  '<div id="lastActiveAtTitle"></div>' +
  '<div id="emoji-box" style="display: none;"></div>' +
  '<button id="emoji-button"></button>' +
  '<input id="emoji-input" />' +
  '</body></html>');

const { window } = jsdom;

// Global mocks for DOM elements
global.document = window.document;
global.window = window;
global.navigator = {
  userAgent: 'node.js',
};

// Mock fetch API for tests
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/api/user')) {
    return Promise.resolve({
      json: () => Promise.resolve([
        { username: 'admin', role: 'Admin', userStatus: 'online' },
        { username: 'user1', role: 'NormalUser', userStatus: 'offline' }
      ])
    });
  }

  if (url.includes('/api/channel')) {
    return Promise.resolve({
      json: () => Promise.resolve([
        { channelName: 'General', users: ['admin', 'user1'], public: true },
        { channelName: 'Random', users: ['admin'], public: true }
      ])
    });
  }

  // Default response
  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  });
});

// Mock socket.io for tests
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn()
  };
  return jest.fn(() => mockSocket);
});

// Suppress console errors during tests
console.error = jest.fn();
//package.json {
  "name": "chathaven",
  "version": "1.0.0",
  "description": "ChatHaven real-time chat application",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "test:unit": "jest --config=jest.config.js",
    "test:integration": "jest --config=jest.integration.config.js",
    "test:acceptance": "jest --config=jest.acceptance.config.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "socket.io": "^4.7.2",
    "express-session": "^1.17.3",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.3",
    "eslint": "^8.48.0",
    "jest": "^29.6.4",
    "jest-environment-jsdom": "^29.6.4",
    "jest-puppeteer": "^9.0.0",
    "jsdom": "^22.1.0",
    "mongodb-memory-server": "^8.15.1",
    "nodemon": "^3.0.1",
    "puppeteer": "^21.3.1",
    "socket.io-client": "^4.7.2", 
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/jest.setup.js"]
  }
}
