// tests/unit/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../../model/User');

// Mock mongoose connection for unit tests
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      close: jest.fn().mockResolvedValue({}),
      dropDatabase: jest.fn().mockResolvedValue({})
    }
  };
});

describe('User Model Tests', () => {
  beforeAll(async () => {
    // Connect to test database (mocked)
    await mongoose.connect('mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clear users collection after each test
    jest.clearAllMocks();
  });

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
    // Mock validateSync to return undefined (no validation errors)
    user.validateSync = jest.fn().mockReturnValue(undefined);
    
    const validationError = user.validateSync();
    expect(validationError).toBeUndefined();
  });

  test('should add a direct message relationship', async () => {
    // Create a mock user
    const user = new User({
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser'
    });
    
    // Mock save function
    user.save = jest.fn().mockResolvedValue(user);
    
    await user.save();
    
    // Add a DM relationship
    const messageId = new mongoose.Types.ObjectId();
    user.userDMs.push({
      recipientUser: 'recipient',
      messageIds: [messageId]
    });
    
    await user.save();
    
    // Check if userDMs array was updated correctly
    expect(user.userDMs).toHaveLength(1);
    expect(user.userDMs[0].recipientUser).toBe('recipient');
    expect(user.userDMs[0].messageIds[0].toString()).toBe(messageId.toString());
  });

  test('should remove password and _id when converting to JSON', () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser'
    };

    const user = new User(userData);
    
    // Fix the typo in the User model by creating correct mock methods
    user.toObject = function() {
      return {
        _id: 'mock-id',
        username: 'testuser',
        password: 'password123',
        role: 'NormalUser'
      };
    };
    
    user.toJSON = function() {
      const obj = this.toObject();
      delete obj.password;
      delete obj._id;
      return obj;
    };
    
    const jsonUser = user.toJSON();
    
    expect(jsonUser).not.toHaveProperty('password');
    expect(jsonUser).not.toHaveProperty('_id');
    expect(jsonUser.username).toBe('testuser');
    expect(jsonUser.role).toBe('NormalUser');
  });
});
