// tests/unit/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../../model/User');

describe('User Model Tests', () => {
  test('should validate a valid user model', () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser',
      channels: ['General'],
      userDMs: [{
        recipientUser: 'otheruser',
        messageIds: [new mongoose.Types.ObjectId()]
      }],
      userStatus: 'online',
      lastActivateAt: new Date()
    };

    const user = new User(userData);
    const validationError = user.validateSync();
    expect(validationError).toBeUndefined();
  });

  test('should set default values correctly', () => {
    const user = new User({
      username: 'testuser',
      password: 'password123'
    });

    expect(user.username).toBe('testuser');
    expect(user.password).toBe('password123');
    expect(user.channels).toEqual([]);
    expect(user.userDMs).toEqual([]);
  });

  test('should add a direct message relationship', () => {
    const user = new User({
      username: 'testuser',
      password: 'password123'
    });
    
    const messageId = new mongoose.Types.ObjectId();
    user.userDMs.push({
      recipientUser: 'recipient',
      messageIds: [messageId]
    });
    
    expect(user.userDMs).toHaveLength(1);
    expect(user.userDMs[0].recipientUser).toBe('recipient');
    expect(user.userDMs[0].messageIds[0].toString()).toBe(messageId.toString());
  });

  test('should support multiple channels', () => {
    const user = new User({
      username: 'testuser',
      password: 'password123',
      channels: ['General']
    });
    
    user.channels.push('Random');
    user.channels.push('Engineering');
    
    expect(user.channels).toHaveLength(3);
    expect(user.channels).toContain('General');
    expect(user.channels).toContain('Random');
    expect(user.channels).toContain('Engineering');
  });
});
