// tests/integration/message-api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Message = require('../../model/Message');
const Counters = require('../../model/Counters');

// Mock express application setup
const app = express();
app.use(express.json());

// Import routes (assuming these exist in your project)
app.get('/api/message/:messageId', async (req, res) => {
  try {
    const message = await Message.findOne({ messageId: req.params.messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/message', async (req, res) => {
  try {
    // Get next message ID from counter
    let counter = await Counters.findOne({ _id: 'messageCounter' });
    
    if (!counter) {
      counter = new Counters({ _id: 'messageCounter', seq: 0 });
    }
    
    counter.seq += 1;
    await counter.save();
    
    // Create message with incremented ID
    const message = new Message({
      messageId: counter.seq,
      msg: req.body.msg,
      username: req.body.username,
      visible: true
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/message/:messageId', async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { messageId: req.params.messageId },
      req.body,
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
    // Clear the database between tests
    await Message.deleteMany({});
    await Counters.deleteMany({});
  });

  test('GET /api/message/:messageId should return message by ID', async () => {
    // Add test message
    await Message.create({
      messageId: 123,
      msg: 'Test message content',
      username: 'testuser',
      visible: true
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/message/123')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.messageId).toBe(123);
    expect(response.body.msg).toBe('Test message content');
    expect(response.body.username).toBe('testuser');
    expect(response.body.visible).toBe(true);
  });

  test('POST /api/message should create a new message with incremented ID', async () => {
    // Set initial counter
    await Counters.create({
      _id: 'messageCounter',
      seq: 41
    });
    
    // Message data
    const messageData = {
      msg: 'New auto-incremented message',
      username: 'autouser'
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/message')
      .send(messageData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body.messageId).toBe(42); // Incremented from 41
    expect(response.body.msg).toBe('New auto-incremented message');
    expect(response.body.username).toBe('autouser');
    expect(response.body.visible).toBe(true);
    
    // Verify counter was incremented
    const counter = await Counters.findOne({ _id: 'messageCounter' });
    expect(counter.seq).toBe(42);
  });

  test('POST /api/message should create counter if it does not exist', async () => {
    // Message data
    const messageData = {
      msg: 'First message with new counter',
      username: 'firstuser'
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/message')
      .send(messageData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body.messageId).toBe(1); // First message ID
    
    // Verify counter was created
    const counter = await Counters.findOne({ _id: 'messageCounter' });
    expect(counter).not.toBeNull();
    expect(counter.seq).toBe(1);
  });

  test('PUT /api/message/:messageId should update message data', async () => {
    // Create message
    await Message.create({
      messageId: 50,
      msg: 'Original content',
      username: 'originaluser',
      visible: true
    });
    
    // Update data
    const updateData = {
      msg: 'Updated content',
      visible: false
    };
    
    // Make API request
    const response = await request(app)
      .put('/api/message/50')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.messageId).toBe(50);
    expect(response.body.msg).toBe('Updated content');
    expect(response.body.username).toBe('originaluser'); // Unchanged
    expect(response.body.visible).toBe(false); // Changed
    
    // Verify in database
    const updatedMessage = await Message.findOne({ messageId: 50 });
    expect(updatedMessage.msg).toBe('Updated content');
    expect(updatedMessage.visible).toBe(false);
  });

  test('GET /api/message/:messageId should return 404 for non-existent message', async () => {
    // Make API request for non-existent message
    const response = await request(app)
      .get('/api/message/999')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(response.body.error).toBe('Message not found');
  });
});
