// tests/integration/channel-api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Channel = require('../../model/Channel');
const User = require('../../model/User');

// Create a minimal Express application for testing
const app = express();
app.use(express.json());

// Channel API routes
app.get('/api/channel', async (req, res) => {
  try {
    const channels = await Channel.find({});
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/channel/:channelName', async (req, res) => {
  try {
    const channel = await Channel.findOne({ channelName: req.params.channelName })
      .populate('messageIds');
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channel', async (req, res) => {
  try {
    const { channelName, isPublic = true } = req.body;
    
    // Check if channel already exists
    const existingChannel = await Channel.findOne({ channelName });
    if (existingChannel) {
      return res.status(400).json({ error: 'Channel already exists' });
    }
    
    const channel = new Channel({
      channelName,
      isPublic,
      users: [],
      messageIds: []
    });
    
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/channel/:channelName', async (req, res) => {
  try {
    const { users } = req.body;
    
    const channel = await Channel.findOneAndUpdate(
      { channelName: req.params.channelName },
      { $addToSet: { users: { $each: users } } },
      { new: true }
    );
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

describe('Channel API Integration Tests', () => {
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
    await Channel.deleteMany({});
    await User.deleteMany({});
  });

  test('GET /api/channel should return all channels', async () => {
    // Add test channels
    await Channel.create({
      channelName: 'General',
      isPublic: true,
      users: ['user1', 'user2'],
      messageIds: []
    });
    
    await Channel.create({
      channelName: 'Random',
      isPublic: true,
      users: ['user1'],
      messageIds: []
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/channel')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.length).toBe(2);
    expect(response.body[0].channelName).toBe('General');
    expect(response.body[1].channelName).toBe('Random');
  });

  test('GET /api/channel/:channelName should return a specific channel', async () => {
    // Add test channel
    await Channel.create({
      channelName: 'Engineering',
      isPublic: false,
      users: ['engineer1', 'engineer2'],
      messageIds: []
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/channel/Engineering')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.channelName).toBe('Engineering');
    expect(response.body.public).toBe(false);
    expect(response.body.users).toContain('engineer1');
    expect(response.body.users).toContain('engineer2');
  });

  test('POST /api/channel should create a new channel', async () => {
    const channelData = {
      channelName: 'NewChannel',
      isPublic: true
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/channel')
      .send(channelData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body.channelName).toBe('NewChannel');
    expect(response.body.public).toBe(true);
    
    // Verify channel was created in the database
    const channel = await Channel.findOne({ channelName: 'NewChannel' });
    expect(channel).not.toBeNull();
    expect(channel.channelName).toBe('NewChannel');
  });

  test('PUT /api/channel/:channelName should add users to a channel', async () => {
    // Create a channel
    await Channel.create({
      channelName: 'General',
      isPublic: true,
      users: ['user1'],
      messageIds: []
    });
    
    // Update data
    const updateData = {
      users: ['user2', 'user3']
    };
    
    // Make API request
    const response = await request(app)
      .put('/api/channel/General')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Check response
    expect(response.body.channelName).toBe('General');
    expect(response.body.users).toContain('user1');
    expect(response.body.users).toContain('user2');
    expect(response.body.users).toContain('user3');
    
    // Verify in database
    const channel = await Channel.findOne({ channelName: 'General' });
    expect(channel.users).toHaveLength(3);
    expect(channel.users).toContain('user1');
    expect(channel.users).toContain('user2');
    expect(channel.users).toContain('user3');
  });
});
