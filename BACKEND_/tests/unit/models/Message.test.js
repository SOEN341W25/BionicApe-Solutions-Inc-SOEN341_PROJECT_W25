// tests/unit/models/Message.test.js
const mongoose = require('mongoose');
const Message = require('../../../model/Message');

describe('Message Model Tests', () => {
  test('should validate a valid message model', () => {
    const messageData = {
      messageId: 1,
      msg: 'Hello, world!',
      visible: true,
      username: 'testuser'
    };

    const message = new Message(messageData);
    const validationError = message.validateSync();
    expect(validationError).toBeUndefined();
  });

  test('should set default values correctly', () => {
    const message = new Message({
      msg: 'Hello, world!',
      username: 'testuser'
    });

    expect(message.messageId).toBe(0); // Default value
    expect(message.visible).toBe(true); // Default value
    expect(message.msg).toBe('Hello, world!');
    expect(message.username).toBe('testuser');
  });

  test('should allow setting messageId to non-default value', () => {
    const message = new Message({
      messageId: 42,
      msg: 'Custom message ID',
      username: 'testuser'
    });

    expect(message.messageId).toBe(42);
  });

  test('should allow setting visibility to false', () => {
    const message = new Message({
      messageId: 1,
      msg: 'This message will be hidden',
      username: 'testuser',
      visible: false
    });

    expect(message.visible).toBe(false);
  });

  test('should correctly represent a deleted message', () => {
    // This test helps ensure the client can properly display deleted messages
    const message = new Message({
      messageId: 1,
      msg: 'Original message content',
      username: 'testuser',
      visible: false
    });

    // This matches the constant in the front-end code
    const DELETED_MODERATOR_MESSAGE = "Message is deleted by moderator";
    
    // Logic similar to what's in the front-end
    const displayContent = message.visible ? 
      message.username + ":" + message.msg : 
      DELETED_MODERATOR_MESSAGE;
    
    expect(displayContent).toBe(DELETED_MODERATOR_MESSAGE);
  });
});
