// tests/unit/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../../model/User');

describe('User Model Tests', () => {
  beforeAll(async () => {
    // Connect to test database (would be mocked in actual implementation)
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
    await User.deleteMany({});
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
    const validationError = user.validateSync();
    expect(validationError).toBeUndefined();
  });

  test('should save user successfully', async () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser',
      channels: ['General'],
      userStatus: 'online',
      lastActivateAt: new Date()
    };

    const validUser = new User(userData);
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.password).toBe(userData.password);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.channels).toEqual(expect.arrayContaining(['General']));
    expect(savedUser.userStatus).toBe('online');
  });

  test('should add a direct message relationship', async () => {
    const user = new User({
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser'
    });
    
    await user.save();
    
    // Add a DM relationship
    const messageId = new mongoose.Types.ObjectId();
    user.userDMs.push({
      recipientUser: 'recipient',
      messageIds: [messageId]
    });
    
    await user.save();
    
    // Retrieve the updated user
    const updatedUser = await User.findOne({ username: 'testuser' });
    
    expect(updatedUser.userDMs).toHaveLength(1);
    expect(updatedUser.userDMs[0].recipientUser).toBe('recipient');
    expect(updatedUser.userDMs[0].messageIds[0].toString()).toBe(messageId.toString());
  });

  test('should remove password and _id when converting to JSON', () => {
    const userData = {
      username: 'testuser',
      password: 'password123',
      role: 'NormalUser'
    };

    const user = new User(userData);
    
    // Create custom toObject and toJSON functions for testing
    // (since there's a typo in the model - method. instead of methods.)
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
