// BACKEND_/tests/integration/message-api.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('../mongo-memory-server-mock');
const app = require('../../app'); // Adjust if your app.js is in a different location
const Message = require('../../models/Message'); // Adjust if your Message model is in a different location

describe('Message API Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer && typeof mongoServer.stop === 'function') {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Message.deleteMany({});
  });

  test('GET /api/messages should return all messages', async () => {
    // This is a placeholder test
    const response = await request(app).get('/api/messages');
    expect(response.status).toBe(200);
  });
});
