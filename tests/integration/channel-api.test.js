const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../../model/User');

// Create a minimal Express application for testing
const app = express();
app.use(express.json());

// User API routes
app.get('/api/user', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/getuser/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/:username', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/userDMs/:recipientUser', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.recipientUser });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('User API Integration Tests', () => {
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
    await User.deleteMany({});
  });

  test('GET /api/user should return all users', async () => {
    // Add test users
    await User.create({
      username: 'testuser1',
      password: 'password1',
      role: 'NormalUser',
      channels: ['General'],
      userStatus: 'online'
    });
    
    await User.create({
      username: 'testuser2',
      password: 'password2',
      role: 'NormalUser',
      channels: ['General'],
      userStatus: 'offline'
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/user')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.length).toBe(2);
    expect(response.body[0].username).toBe('testuser1');
    expect(response.body[1].username).toBe('testuser2');
  });

  test('GET /api/user/getuser/:username should return user by username', async () => {
    // Add test user
    await User.create({
      username: 'specificuser',
      password: 'password123',
      role: 'NormalUser',
      channels: ['General', 'Random'],
      userStatus: 'online'
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/user/getuser/specificuser')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.username).toBe('specificuser');
    expect(response.body.role).toBe('NormalUser');
    expect(response.body.channels).toContain('General');
    expect(response.body.channels).toContain('Random');
    expect(response.body.userStatus).toBe('online');
  });

  test('GET /api/user/getuser/:username should return 404 for non-existent user', async () => {
    // Make API request for non-existent user
    const response = await request(app)
      .get('/api/user/getuser/nonexistentuser')
      .expect('Content-Type', /json/)
      .expect(404);
    
    expect(response.body.error).toBe('User not found');
  });

  test('PUT /api/user/:username should update user data', async () => {
    // Add test user
    await User.create({
      username: 'updateuser',
      password: 'oldpassword',
      role: 'NormalUser',
      channels: ['General'],
      userStatus: 'offline'
    });
    
    // Update data
    const updateData = {
      role: 'Admin',
      userStatus: 'online',
      channels: ['General', 'Admin']
    };
    
    // Make API request
    const response = await request(app)
      .put('/api/user/updateuser')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.username).toBe('updateuser');
    expect(response.body.role).toBe('Admin');
    expect(response.body.userStatus).toBe('online');
    expect(response.body.channels).toContain('Admin');
    
    // Verify in database
    const updatedUser = await User.findOne({ username: 'updateuser' });
    expect(updatedUser.role).toBe('Admin');
    expect(updatedUser.userStatus).toBe('online');
  });

  test('GET /api/user/userDMs/:recipientUser should return user DMs', async () => {
    // Create a message ID for reference
    const messageId = new mongoose.Types.ObjectId();
    
    // Add test user with DMs
    await User.create({
      username: 'dmuser',
      password: 'password123',
      role: 'NormalUser',
      userDMs: [{
        recipientUser: 'recipient',
        messageIds: [messageId]
      }]
    });
    
    // Make API request
    const response = await request(app)
      .get('/api/user/userDMs/dmuser')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body.username).toBe('dmuser');
    expect(response.body.userDMs).toHaveLength(1);
    expect(response.body.userDMs[0].recipientUser).toBe('recipient');
    expect(response.body.userDMs[0].messageIds).toHaveLength(1);
  });
