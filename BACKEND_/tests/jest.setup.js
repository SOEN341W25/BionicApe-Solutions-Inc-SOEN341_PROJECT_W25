// tests/jest.setup.js - Setup file for Jest tests

// Setup DOM environment for unit tests
const { JSDOM } = require('jsdom');

// Create a basic DOM environment with elements needed for tests
const jsdom = new JSDOM('<!doctype html><html><body>' +
  '<ul id="messages"></ul>' +
  '<form id="form"><input id="input" /><button type="submit">Send</button></form>' +
  '<div id="currentChatBoxTitle"></div>' +
  '<ul id="renderList"></ul>' +
  '<div id="lastActiveAtTitle"></div>' +
  '<div id="emoji-box" style="display: none;"></div>' +
  '<button id="emoji-button"></button>' +
  '<input id="emoji-input" />' +
  '<form id="inviteForm"><input id="inputInvite" /><button type="submit">Invite</button></form>' +
  '<form id="leaveChannelForm"><button type="submit">Leave</button></form>' +
  '<div class="chat-container"></div>' +
  '<div class="sidebar"></div>' +
  '<div id="btn" class="bx-menu"></div>' +
  '<div class="bx-search"></div>' +
  '<form class="form"><input name="channelName" /><button type="submit">Create</button></form>' +
  '</body></html>');

const { window } = jsdom;

// Set up globals
global.document = window.document;
global.window = window;
global.navigator = {
  userAgent: 'node.js',
};

// Add necessary browser functions
global.window.scrollTo = jest.fn();

// Mock fetch API for tests
global.fetch = jest.fn().mockImplementation((url) => {
  // Mock different responses based on the URL
  if (url.includes('/api/user') && !url.includes('/userDMs/') && !url.includes('/getuser/')) {
    return Promise.resolve({
      json: () => Promise.resolve([
        { username: 'admin', role: 'Admin', userStatus: 'online' },
        { username: 'user1', role: 'NormalUser', userStatus: 'offline' }
      ])
    });
  }

  if (url.includes('/api/user/getuser/')) {
    const username = url.split('/').pop();
    return Promise.resolve({
      json: () => Promise.resolve({
        username,
        role: username === 'admin' ? 'Admin' : 'NormalUser',
        userStatus: 'online',
        lastActivateAt: new Date().toISOString()
      })
    });
  }

  if (url.includes('/api/user/userDMs/')) {
    const username = url.split('/').pop();
    return Promise.resolve({
      json: () => Promise.resolve({
        username,
        userDMs: [{
          recipientUser: 'user1',
          messageIds: [
            { messageId: 1, msg: 'Hello', username: 'admin', visible: true },
            { messageId: 2, msg: 'Hi there', username: 'user1', visible: true }
          ]
        }]
      })
    });
  }

  if (url.includes('/api/user/channels')) {
    return Promise.resolve({
      json: () => Promise.resolve([
        { channelName: 'General', users: ['admin', 'user1'], public: true },
        { channelName: 'Random', users: ['admin'], public: false }
      ])
    });
  }

  if (url.includes('/api/channel') && !url.includes('/channel/')) {
    return Promise.resolve({
      json: () => Promise.resolve([
        { channelName: 'General', users: ['admin', 'user1'], public: true },
        { channelName: 'Random', users: ['admin'], public: true }
      ])
    });
  }

  if (url.includes('/api/channel/') && url.split('/').length > 3) {
    const channelName = url.split('/').pop();
    return Promise.resolve({
      json: () => Promise.resolve({
        channelName,
        users: ['admin', 'user1'],
        public: channelName === 'General',
        messageIds: [
          { messageId: 1, msg: 'Welcome to ' + channelName, username: 'admin', visible: true },
          { messageId: 2, msg: 'Hi everyone', username: 'user1', visible: true }
        ]
      })
    });
  }

  // Default response
  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  });
});

// Mock socket.io client for tests
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn((event, callback) => {
      // Store callbacks to allow triggering them in tests
      if (!mockSocket.eventCallbacks[event]) {
        mockSocket.eventCallbacks[event] = [];
      }
      mockSocket.eventCallbacks[event].push(callback);
      return mockSocket;
    }),
    emit: jest.fn(),
    eventCallbacks: {},
    connect: jest.fn(),
    connected: true,
    disconnect: jest.fn()
  };
  
  // Helper method to trigger events in tests
  mockSocket.triggerEvent = (event, ...args) => {
    if (mockSocket.eventCallbacks[event]) {
      mockSocket.eventCallbacks[event].forEach(callback => callback(...args));
    }
  };
  
  return jest.fn(() => mockSocket);
});

// Suppress console errors during tests
console.error = jest.fn();
// Only log in verbose mode
if (!process.env.VERBOSE) {
  console.log = jest.fn();
}
