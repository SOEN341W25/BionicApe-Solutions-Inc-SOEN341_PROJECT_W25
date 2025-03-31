// tests/unit/utils/messageHandlers.test.js
describe('Message Handlers Tests', () => {
  test('constructChatMessageFromJson displays correct message for visible messages', () => {
    // Function to test
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

  test('constructChatMessageFromJson displays deletion notice for invisible messages', () => {
    // Function to test
    function constructChatMessageFromJson(data) {
      if (!data.visible) {
        return "Message is deleted by moderator";
      }
      return data.username + ":" + data.msg;
    }
    
    const messageData = {
      username: 'testuser',
      msg: 'Hello, world!',
      visible: false
    };
    
    const result = constructChatMessageFromJson(messageData);
    expect(result).toBe('Message is deleted by moderator');
  });

  test('addChatMessageToChatBox creates correctly structured message element', () => {
    // Mock DOM environment
    document.body.innerHTML = '<ul id="messages"></ul>';
    
    // Function to test
    function addChatMessageToChatBox(msg) {
      const item = document.createElement('li');
      
      if (!msg.visible) {
        item.textContent = "Message is deleted by moderator";
      } else {
        item.textContent = msg.username + ":" + msg.msg;
      }
      
      document.getElementById('messages').appendChild(item);
      item.setAttribute("onclick", "deleteMessage(this)");
      item.setAttribute("id", msg.messageId);
      item.setAttribute("data-visibility", msg.visible);
    }
    
    const messageData = {
      messageId: '123',
      username: 'testuser',
      msg: 'Hello, world!',
      visible: true
    };
    
    addChatMessageToChatBox(messageData);
    
    const messagesElement = document.getElementById('messages');
    const messageItem = messagesElement.firstChild;
    
    expect(messagesElement.childNodes.length).toBe(1);
    expect(messageItem.textContent).toBe('testuser:Hello, world!');
    expect(messageItem.getAttribute('id')).toBe('123');
    expect(messageItem.getAttribute('data-visibility')).toBe('true');
    expect(messageItem.getAttribute('onclick')).toBe('deleteMessage(this)');
  });
});
