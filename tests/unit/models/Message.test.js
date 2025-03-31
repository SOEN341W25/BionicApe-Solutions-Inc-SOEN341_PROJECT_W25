// tests/unit/models/Message.test.js
const mongoose = require('mongoose');
const Message = require('../../../model/Message');

describe('Message Model Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Message.deleteMany({});
  });

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
    const messageData = {
      msg: 'Hello, world!',
      username: 'testuser'
    };

    const message = new Message(messageData);
    expect(message.messageId).toBe(0); // Default value
    expect(message.visible).toBe(true); // Default value
  });

  test('should save message successfully', async () => {
    const messageData = {
      messageId: 42,
      msg: 'Test message content',
      username: 'testuser'
    };

    const validMessage = new Message(messageData);
    const savedMessage = await validMessage.save();
    
    expect(savedMessage._id).toBeDefined();
    expect(savedMessage.messageId).toBe(42);
    expect(savedMessage.msg).toBe('Test message content');
    expect(savedMessage.username).toBe('testuser');
    expect(savedMessage.visible).toBe(true);
  });

  test('should update message visibility', async () => {
    const message = new Message({
      messageId: 1,
      msg: 'Original message',
      username: 'testuser',
      visible: true
    });
    
    await message.save();
    
    // Update the message visibility
    message.visible = false;
    await message.save();
    
    // Retrieve the updated message
    const updatedMessage = await Message.findOne({ messageId: 1 });
    
    expect(updatedMessage.visible).toBe(false);
  });
});
