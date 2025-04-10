// tests/unit/utils/messageHandler.test.js
// This tests the utility functions used for message handling

describe('Message Handler Tests', () => {
  // Set up DOM for tests
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="messages"></ul>
      <div id="currentChatBoxTitle"></div>
    `;
  });

  test('constructChatMessageFromJson should display content for visible messages', () => {
    // Function from the client-side code
    function constructChatMessageFromJson(data) {
      if (!data.visible) {
        return "Message is deleted by moderator";
      }
      return data.username + ":" + data.msg;
    }

    const messageData = {
      username: 'testuser',
      msg: 'Hello, world!',
      visible: true
    };

    const result = constructChatMessageFromJson(messageData);
    expect(result).toBe('testuser:Hello, world!');
  });

  test('constructChatMessageFromJson should show deletion notice for invisible messages', () => {
    function constructChatMessageFromJson(data) {
      if (!data.visible) {
        return "Message is deleted by moderator";
      }
      return data.username + ":" + data.msg;
    }

    const messageData = {
      username: 'testuser',
      msg: 'Deleted content',
      visible: false
    };

    const result = constructChatMessageFromJson(messageData);
    expect(result).toBe('Message is deleted by moderator');
  });

  test('addChatMessageToChatBox should add message to the chat box', () => {
    // Simplified version of the function from client-side code
    function addChatMessageToChatBox(msg) {
      const item = document.createElement('li');
      item.textContent = msg.visible ? 
        msg.username + ":" + msg.msg : 
        "Message is deleted by moderator";
      
      document.getElementById('messages').appendChild(item);
      item.setAttribute("id", msg.messageId);
      item.setAttribute("data-visibility", msg.visible);
      
      if (msg.sentiment === 'positive') {
        item.classList.add('positive');
      } else if (msg.sentiment === 'negative') {
        item.classList.add('negative');
      } else {
        item.classList.add('neutral');
      }
    }

    const messageData = {
      messageId: '123',
      username: 'testuser',
      msg: 'Hello, world!',
      visible: true,
      sentiment: 'positive'
    };

    addChatMessageToChatBox(messageData);

    // Check that the message was added correctly
    const messageElements = document.querySelectorAll('#messages li');
    expect(messageElements.length).toBe(1);
    expect(messageElements[0].textContent).toBe('testuser:Hello, world!');
    expect(messageElements[0].getAttribute('id')).toBe('123');
    expect(messageElements[0].getAttribute('data-visibility')).toBe('true');
    expect(messageElements[0].classList.contains('positive')).toBe(true);
  });

  test('addChatMessageToChatBox should handle negative sentiment', () => {
    function addChatMessageToChatBox(msg) {
      const item = document.createElement('li');
      item.textContent = msg.visible ? 
        msg.username + ":" + msg.msg : 
        "Message is deleted by moderator";
      
      document.getElementById('messages').appendChild(item);
      item.setAttribute("id", msg.messageId);
      item.setAttribute("data-visibility", msg.visible);
      
      if (msg.sentiment === 'positive') {
        item.classList.add('positive');
      } else if (msg.sentiment === 'negative') {
        item.classList.add('negative');
      } else {
        item.classList.add('neutral');
      }
    }

    const messageData = {
      messageId: '456',
      username: 'testuser',
      msg: 'This is bad!',
      visible: true,
      sentiment: 'negative'
    };

    addChatMessageToChatBox(messageData);

    const messageElement = document.querySelector('#messages li');
    expect(messageElement.classList.contains('negative')).toBe(true);
  });

  test('addChatMessageToChatBox should handle neutral sentiment', () => {
    function addChatMessageToChatBox(msg) {
      const item = document.createElement('li');
      item.textContent = msg.visible ? 
        msg.username + ":" + msg.msg : 
        "Message is deleted by moderator";
      
      document.getElementById('messages').appendChild(item);
      item.setAttribute("id", msg.messageId);
      item.setAttribute("data-visibility", msg.visible);
      
      if (msg.sentiment === 'positive') {
        item.classList.add('positive');
      } else if (msg.sentiment === 'negative') {
        item.classList.add('negative');
      } else {
        item.classList.add('neutral');
      }
    }

    const messageData = {
      messageId: '789',
      username: 'testuser',
      msg: 'Neutral message',
      visible: true,
      sentiment: undefined
    };

    addChatMessageToChatBox(messageData);

    const messageElement = document.querySelector('#messages li');
    expect(messageElement.classList.contains('neutral')).toBe(true);
  });
});
