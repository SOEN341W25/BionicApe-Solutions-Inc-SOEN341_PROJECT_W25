// tests/integration/message-api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Message = require('../../model/Message');
const Counters = require('../../model/Counters');
const Channel = require('../../model/Channel');

// Create a minimal Express application for testing
const app = express();
app.use(express.json());

// Message API routes
app.post('/api/channel/:channelName/message', async (req, res) => {
  try {
    const { channelName } = req.params;
    const { msg, username } = req.body;
    
    // Get channel
    const channel = await Channel.findOne({ channelName });

describe('Message API Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections between tests
    await Message.deleteMany({});
    await Channel.deleteMany({});
    await Counters.deleteMany({});
  });

  test('POST /api/channel/:channelName/message should add a message to a channel', async () => {
    // Create a test channel
    const channel = new Channel({
      channelName: 'General',
      isPublic: true,
      users: ['user1', 'user2'],
      messageIds: []
    });
    await channel.save();
    
    // Message data
    const messageData = {
      msg: 'Hello, General channel!',
      username: 'user1'
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/channel/General/message')
      .send(messageData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    // Check response
    expect(response.body.messageId).toBe(1); // First message ID
    expect(response.body.msg).toBe('Hello, General channel!');
    expect(response.body.username).toBe('user1');
    expect(response.body.visible).toBe(true);
    
    // Verify message was created in database
    const message = await Message.findOne({ messageId: 1 });
    expect(message).not.toBeNull();
    expect(message.msg).toBe('Hello, General channel!');
    
    // Verify message was added to channel
    const updatedChannel = await Channel.findOne({ channelName: 'General' }).populate('messageIds');
    expect(updatedChannel.messageIds.length).toBe(1);
    expect(updatedChannel.messageIds[0].msg).toBe('Hello, General channel!');
  });

  test('PUT /api/message/:messageId should update message visibility', async () => {
    // Create a test message
    const message = new Message({
      messageId: 42,
      msg: 'This will be deleted',
      username: 'moderator',
      visible: true
    });
    await message.save();
    
    // Update data - make message invisible (deleted)
    const updateData = {
      visible: false
    };
    
    // Make API request
    const response = await request(app)
      .put('/api/message/42')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Check response
    expect(response.body.messageId).toBe(42);
    expect(response.body.visible).toBe(false);
    
    // Verify in database
    const updatedMessage = await Message.findOne({ messageId: 42 });
    expect(updatedMessage.visible).toBe(false);
  });

  test('GET /api/message/:messageId should return a specific message', async () => {
    // Create a test message
    const message = new Message({
      messageId: 123,
      msg: 'Test message content',
      username: 'testuser',
      visible: true
    });
    await message.save();
    
    // Make API request
    const response = await request(app)
      .get('/api/message/123')
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Check response
    expect(response.body.messageId).toBe(123);
    expect(response.body.msg).toBe('Test message content');
    expect(response.body.username).toBe('testuser');
    expect(response.body.visible).toBe(true);
  });

  test('Counter should increment with each new message', async () => {
    // Create a test channel
    const channel = new Channel({
      channelName: 'TestChannel',
      isPublic: true,
      users: ['user1'],
      messageIds: []
    });
    await channel.save();
    
    // Set initial counter
    await Counters.create({
      _id: 'messageCounter',
      seq: 10
    });
    
    // Message data for first message
    const messageData1 = {
      msg: 'First message',
      username: 'user1'
    };
    
    // Post first message
    const response1 = await request(app)
      .post('/api/channel/TestChannel/message')
      .send(messageData1)
      .expect(201);
    
    expect(response1.body.messageId).toBe(11); // 10 + 1
    
    // Message data for second message
    const messageData2 = {
      msg: 'Second message',
      username: 'user1'
    };
    
    // Post second message
    const response2 = await request(app)
      .post('/api/channel/TestChannel/message')
      .send(messageData2)
      .expect(201);
    
    expect(response2.body.messageId).toBe(12); // 11 + 1
    
    // Verify counter in database
    const counter = await Counters.findOne({ _id: 'messageCounter' });
    expect(counter.seq).toBe(12);
  });
});
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    // Get next message ID
    let counter = await Counters.findOne({ _id: 'messageCounter' });
    if (!counter) {
      counter = new Counters({ _id: 'messageCounter', seq: 0 });
    }
    counter.seq += 1;
    await counter.save();
    
    // Create message
    const message = new Message({
      messageId: counter.seq,
      msg,
      username,
      visible: true
    });
    
    await message.save();
    
    // Add message to channel
    channel.messageIds.push(message._id);
    await channel.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/message/:messageId', async (req, res) => {
  try {
    const { visible } = req.body;
    const messageId = parseInt(req.params.messageId);
    
    const message = await Message.findOneAndUpdate(
      { messageId },
      { visible },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/message/:messageId', async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const message = await Message.findOne({ messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
