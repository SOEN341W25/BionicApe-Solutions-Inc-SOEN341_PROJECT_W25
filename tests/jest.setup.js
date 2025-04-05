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

