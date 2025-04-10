// tests/unit/models/Channel.test.js
const mongoose = require('mongoose');
const Channel = require('../../../model/Channel');

describe('Channel Model Tests', () => {
  test('should validate a valid channel model', () => {
    const channelData = {
      channelName: 'general',
      messageIds: [new mongoose.Types.ObjectId()],
      users: ['user1', 'user2'],
      public: true
    };

    const channel = new Channel(channelData);
    const validationError = channel.validateSync();
    expect(validationError).toBeUndefined();
  });

  test('should set default public value to true', () => {
    const channel = new Channel({
      channelName: 'general',
      users: ['user1', 'user2']
    });

    expect(channel.public).toBe(true);
  });

  test('should allow setting public to false', () => {
    const channel = new Channel({
      channelName: 'private-channel',
      users: ['user1', 'user2'],
      public: false
    });

    expect(channel.public).toBe(false);
  });

  test('should add users to channel', () => {
    const channel = new Channel({
      channelName: 'general',
      users: ['user1']
    });
    
    channel.users.push('user2');
    channel.users.push('user3');
    
    expect(channel.users).toHaveLength(3);
    expect(channel.users).toContain('user1');
    expect(channel.users).toContain('user2');
    expect(channel.users).toContain('user3');
  });

  test('should add messages to channel', () => {
    const channel = new Channel({
      channelName: 'general',
      users: ['user1', 'user2']
    });
    
    const messageId1 = new mongoose.Types.ObjectId();
    const messageId2 = new mongoose.Types.ObjectId();
    
    channel.messageIds.push(messageId1);
    channel.messageIds.push(messageId2);
    
    expect(channel.messageIds).toHaveLength(2);
    expect(channel.messageIds[0].toString()).toBe(messageId1.toString());
    expect(channel.messageIds[1].toString()).toBe(messageId2.toString());
  });
});
