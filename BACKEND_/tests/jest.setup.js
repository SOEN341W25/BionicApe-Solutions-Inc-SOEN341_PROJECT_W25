// tests/jest.setup.js - Simple setup file for Jest tests
// This simplified version should work on all platforms

// Create a minimal DOM environment for testing
const { JSDOM } = require('jsdom');

const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <ul id="messages"></ul>
  <form id="form"><input id="input" /><button type="submit">Send</button></form>
  <div id="currentChatBoxTitle"></div>
  <ul id="renderList"></ul>
  <div id="lastActiveAtTitle"></div>
  <div id="emoji-box" style="display: none;"></div>
  <button id="emoji-button"></button>
  <input id="emoji-input" />
  <form id="inviteForm"><input id="inputInvite" /></form>
  <form id="leaveChannelForm"></form>
  <div class="chat-container"></div>
  <div class="sidebar"></div>
  <div id="btn" class="bx-menu"></div>
  <div class="bx-search"></div>
  <form class="form"><input name="channelName" /></form>
</body>
</html>
`;

const dom = new JSDOM(html);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };
global.window.scrollTo = jest.fn();

// Mock fetch API
global.fetch = jest.fn().mockImplementation((url) => {
  return Promise.resolve({
    json: () => Promise.resolve({ success: true })
  });
});

// Mock socket.io
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn()
  };
  return jest.fn(() => mockSocket);
});

// Suppress console errors during tests
console.error = jest.fn();
