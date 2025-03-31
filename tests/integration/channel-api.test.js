// tests/integration/channel-api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Channel = require('../../model/Channel');
const Message = require('../../model/Message');

// Mock express application setup
const app = express();
app.use(express.json());

// Import routes (assuming these exist in your project)
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
    const channel = new Channel(req.body);
    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/channel/:channelName/message', async (req, res) => {
  try {
    const channel = await Channel.findOne({ channelName: req.params.channelName });
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = new Message({
      messageId: req.body.messageId || 0,
      msg: req.body.msg,
      username: req.body.username,
      visible: true
    });
    
    await message.save();
    
    channel.messageIds.push(message._id);
    await channel.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/channel/:channelName', async (req, res) => {
  try {
    const channel = await Channel.findOneAndUpdate(
      { channelName: req.params.channelName },
      req.body,
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

app.delete('/api/channel/:channelName', async (req, res) => {
  try {
    const channel = await Channel.findOneAndDelete({ channelName: req.params.channelName });
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    // Clear the database between tests
    await Channel.deleteMany({});
    await Message.deleteMany({});
  });

  test('GET /api/channel should return all channels', async () => {
    // Add test channels
    await Channel.create({
      channelName: 'general',
      users: ['user1', 'user2'],
      public: true
    });
    
    await Channel.create({
      channelName: 'random',
      users: ['user1', 'user3'],
      public: true
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/channel')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.length).toBe(2);
    expect(response.body[0].channelName).toBe('general');
    expect(response.body[1].channelName).toBe('random');
  });

  test('GET /api/channel/:channelName should return channel with messages', async () => {
    // Create messages
    const message1 = new Message({
      messageId: 1,
      msg: 'Hello channel',
      username: 'user1',
      visible: true
    });
    
    const message2 = new Message({
      messageId: 2,
      msg: 'Second message',
      username: 'user2',
      visible: true
    });
    
    await message1.save();
    await message2.save();
    
    // Add test channel with messages
    await Channel.create({
      channelName: 'general',
      messageIds: [message1._id, message2._id],
      users: ['user1', 'user2'],
      public: true
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/channel/general')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.channelName).toBe('general');
    expect(response.body.messageIds).toHaveLength(2);
    expect(response.body.messageIds[0].msg).toBe('Hello channel');
    expect(response.body.messageIds[1].msg).toBe('Second message');
  });

  test('POST /api/channel should create a new channel', async () => {
    const channelData = {
      channelName: 'newchannel',
      users: ['creator'],
      public: false
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/channel')
      .send(channelData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body.channelName).toBe('newchannel');
    expect(response.body.users).toContain('creator');
    expect(response.body.public).toBe(false);
    
    // Verify in database
    const savedChannel = await Channel.findOne({ channelName: 'newchannel' });
    expect(savedChannel).not.toBeNull();
    expect(savedChannel.channelName).toBe('newchannel');
  });

  test('POST /api/channel/:channelName/message should add a message to a channel', async () => {
    // Create channel
    await Channel.create({
      channelName: 'general',
      users: ['user1', 'user2'],
      public: true
    });
    
    // Message data
    const messageData = {
      messageId: 5,
      msg: 'New message in channel',
      username: 'user1'
    };
    
    // Make API request
    const response = await request(app)
      .post('/api/channel/general/message')
      .send(messageData)
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body.msg).toBe('New message in channel');
    expect(response.body.username).toBe('user1');
    expect(response.body.visible).toBe(true);
    
    // Verify channel has message
    const updatedChannel = await Channel.findOne({ channelName: 'general' }).populate('messageIds');
    expect(updatedChannel.messageIds).toHaveLength(1);
    expect(updatedChannel.messageIds[0].msg).toBe('New message in channel');
  });

  test('PUT /api/channel/:channelName should update channel data', async () => {
    // Create channel
    await Channel.create({
      channelName: 'general',
      users: ['user1'],
      public: true
    });
    
    // Update data
    const updateData = {
      users: ['user1', 'user2', 'user3'],
      public: false
    };
    
    // Make API request
    const response = await request(app)
      .put('/api/channel/general')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.channelName).toBe('general');
    expect(response.body.users).toHaveLength(3);
    expect(response.body.users).toContain('user2');
    expect(response.body.users).toContain('user3');
    expect(response.body.public).toBe(false);
    
    // Verify in database
    const updatedChannel = await Channel.findOne({ channelName: 'general' });
    expect(updatedChannel.public).toBe(false);
    expect(updatedChannel.users).toHaveLength(3);
  });

  test('DELETE /api/channel/:channelName should delete a channel', async () => {
    // Create channel
    await Channel.create({
      channelName: 'deleteme',
      users: ['user1'],
      public: true
    });
    
    // Make API request
    const response = await request(app)
      .delete('/api/channel/deleteme')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    
    // Verify channel is deleted
    const deletedChannel = await Channel.findOne({ channelName: 'deleteme' });
    expect(deletedChannel).toBeNull();
  });
});
