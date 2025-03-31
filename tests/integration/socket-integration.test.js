// tests/integration/socket-integration.test.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Message = require('../../model/Message');
const Channel = require('../../model/Channel');
const User = require('../../model/User');

describe('Socket.io Integration Tests', () => {
  let io, serverSocket, clientSocket, httpServer, mongoServer;
  
  beforeAll(async () => {
    // Set up MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create HTTP server
    const app = express();
    httpServer = createServer(app);
    io = new Server(httpServer);
    
    // Start the server
    await new Promise(resolve => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        clientSocket = new Client(`http://localhost:${port}`);
        
        io.on('connection', (socket) => {
          serverSocket = socket;
          
          // Set up socket event handlers (similar to actual application)
          
          // Channel message handling
          socket.on('channel message', (message, channelName) => {
            const processedMsg = {
              messageId: Date.now(),
              msg: message,
              username: socket.username || 'anonymous',
              visible: true,
              channelName
            };
            
            // Emit to all clients
            io.emit('channel message', processedMsg, channelName);
          });
          
          // Direct message handling
          socket.on('dms to user', (message, recipientUser) => {
            const processedMsg = {
              messageId: Date.now(),
              msg: message,
              username: socket.username || 'anonymous',
              visible: true,
              recipientUser
            };
            
            // Emit to both sender and recipient
            io.emit('dms to user', processedMsg, recipientUser);
          });
          
          // Message modification handling
          socket.on('modify channel message', async (messageId, visible) => {
            // In a real implementation, this would update the message in the database
            const updatedMessage = {
              messageId,
              msg: 'Test message content',
              username: 'testuser',
              visible
            };
            
            // Emit updated message to all clients
            io.emit('modify channel message', updatedMessage, visible);
          });
          
          // Channel invite handling
          socket.on('channel invite', (username, channelName) => {
            // In a real implementation, this would add the user to the channel
            const updatedChannel = {
              channelName,
              users: ['existingUser', username],
              public: false
            };
            
            // Emit result to the client
            socket.emit('channel invite', updatedChannel, true);
          });
          
          // Channel leave handling
          socket.on('channel leave', (channelName) => {
            // In a real implementation, this would remove the user from the channel
            
            // Emit result to the client
            socket.emit('channel leave', true);
          });
        });
        
        clientSocket.on('connect', resolve);
      });
    });
  });
  
  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
    io.close();
    clientSocket.close();
  });
  
  beforeEach(async () => {
    // Clear collections between tests
    await Message.deleteMany({});
    await Channel.deleteMany({});
    await User.deleteMany({});
  });
  
  test('should handle channel message event', (done) => {
    // Set a username for the client socket
    serverSocket.username = 'testuser';
    
    // Listen for the response
    clientSocket.on('channel message', (msg, channelName) => {
      expect(msg.username).toBe('testuser');
      expect(msg.msg).toBe('Hello channel');
      expect(msg.visible).toBe(true);
      expect(channelName).toBe('general');
      done();
    });
    
    // Emit a message event
    clientSocket.emit('channel message', 'Hello channel', 'general');
  });
  
  test('should handle direct message event', (done) => {
    // Set a username for the client socket
    serverSocket.username = 'sender';
    
    // Listen for the response
    clientSocket.on('dms to user', (msg, recipientUser) => {
      expect(msg.username).toBe('sender');
      expect(msg.msg).toBe('Hi there');
      expect(msg.visible).toBe(true);
      expect(msg.recipientUser).toBe('recipient');
      expect(recipientUser).toBe('recipient');
      done();
    });
    
    // Emit a direct message event
    clientSocket.emit('dms to user', 'Hi there', 'recipient');
  });
  
  test('should handle message modification event', (done) => {
    // Listen for the response
    clientSocket.on('modify channel message', (message, visible) => {
      expect(message.messageId).toBe('123');
      expect(message.visible).toBe(false);
      expect(visible).toBe(false);
      done();
    });
    
    // Emit a message modification event (delete a message)
    clientSocket.emit('modify channel message', '123', false);
  });
  
  test('should handle channel invite event', (done) => {
    // Listen for the response
    clientSocket.on('channel invite', (channel, userExists) => {
      expect(channel.channelName).toBe('private-channel');
      expect(channel.users).toContain('invitedUser');
      expect(userExists).toBe(true);
      done();
    });
    
    // Emit a channel invite event
    clientSocket.emit('channel invite', 'invitedUser', 'private-channel');
  });
  
  test('should handle channel leave event', (done) => {
    // Listen for the response
    clientSocket.on('channel leave', (userLeft) => {
      expect(userLeft).toBe(true);
      done();
    });
    
    // Emit a channel leave event
    clientSocket.emit('channel leave', 'channel-to-leave');
  });
});

// tests/unit/socket-handlers.test.js
describe('Socket Event Handler Unit Tests', () => {
  // Mock socket.io
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    username: 'mockuser'
  };
  
  const mockIo = {
    emit: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Channel message handler processes messages correctly', () => {
    // Function to test
    function handleChannelMessage(socket, io, message, channelName) {
      const processedMsg = {
        messageId: Date.now(),
        msg: message,
        username: socket.username || 'anonymous',
        visible: true,
        channelName
      };
      
      io.emit('channel message', processedMsg, channelName);
      return processedMsg;
    }
    
    // Test the function
    const result = handleChannelMessage(mockSocket, mockIo, 'Test message', 'general');
    
    // Verify the result
    expect(result.msg).toBe('Test message');
    expect(result.username).toBe('mockuser');
    expect(result.visible).toBe(true);
    expect(result.channelName).toBe('general');
    
    // Verify io.emit was called correctly
    expect(mockIo.emit).toHaveBeenCalledWith('channel message', result, 'general');
  });
  
  test('Direct message handler processes messages correctly', () => {
    // Function to test
    function handleDirectMessage(socket, io, message, recipientUser) {
      const processedMsg = {
        messageId: Date.now(),
        msg: message,
        username: socket.username || 'anonymous',
        visible: true,
        recipientUser
      };
      
      io.emit('dms to user', processedMsg, recipientUser);
      return processedMsg;
    }
    
    // Test the function
    const result = handleDirectMessage(mockSocket, mockIo, 'Private message', 'recipient');
    
    // Verify the result
    expect(result.msg).toBe('Private message');
    expect(result.username).toBe('mockuser');
    expect(result.visible).toBe(true);
    expect(result.recipientUser).toBe('recipient');
    
    // Verify io.emit was called correctly
    expect(mockIo.emit).toHaveBeenCalledWith('dms to user', result, 'recipient');
  });
  
  test('Message modification handler processes visibility changes correctly', () => {
    // Mock Message model
    const mockMessage = {
      findOne: jest.fn().mockResolvedValue({
        messageId: '123',
        msg: 'Original message',
        username: 'author',
        visible: true,
        save: jest.fn().mockResolvedValue({
          messageId: '123',
          msg: 'Original message',
          username: 'author',
          visible: false
        })
      })
    };
    
    // Function to test
    async function handleModifyMessage(socket, io, messageId, visible, messageModel) {
      try {
        // Find message in database
        const message = await messageModel.findOne({ messageId });
        
        if (!message) {
          return null;
        }
        
        // Update visibility
        message.visible = visible;
        const updatedMessage = await message.save();
        
        // Emit to all clients
        io.emit('modify channel message', updatedMessage, visible);
        
        return updatedMessage;
      } catch (error) {
        console.error('Error modifying message:', error);
        return null;
      }
    }
    
    // Test the function
    return handleModifyMessage(mockSocket, mockIo, '123', false, mockMessage)
      .then(result => {
        // Verify the message was found and updated
        expect(mockMessage.findOne).toHaveBeenCalledWith({ messageId: '123' });
        
        // Verify the result
        expect(result.messageId).toBe('123');
        expect(result.visible).toBe(false);
        
        // Verify io.emit was called correctly
        expect(mockIo.emit).toHaveBeenCalledWith('modify channel message', result, false);
      });
  });
  
  test('Channel invite handler processes invites correctly', () => {
    // Mock Channel model
    const mockChannel = {
      findOne: jest.fn().mockResolvedValue({
        channelName: 'private-channel',
        users: ['existingUser'],
        public: false,
        save: jest.fn().mockResolvedValue({
          channelName: 'private-channel',
          users: ['existingUser', 'newUser'],
          public: false
        })
      })
    };
    
    // Mock User model
    const mockUser = {
      findOne: jest.fn().mockResolvedValue({
        username: 'newUser',
        channels: [],
        save: jest.fn().mockResolvedValue({
          username: 'newUser',
          channels: ['private-channel']
        })
      })
    };
    
    // Function to test
    async function handleChannelInvite(socket, username, channelName, channelModel, userModel) {
      try {
        // Check if user exists
        const user = await userModel.findOne({ username });
        
        if (!user) {
          socket.emit('channel invite', null, false);
          return null;
        }
        
        // Find channel
        const channel = await channelModel.findOne({ channelName });
        
        if (!channel) {
          socket.emit('channel invite', null, true);
          return null;
        }
        
        // Add user to channel if not already there
        if (!channel.users.includes(username)) {
          channel.users.push(username);
          await channel.save();
          
          // Add channel to user's channels list
          if (!user.channels.includes(channelName)) {
            user.channels.push(channelName);
            await user.save();
          }
        }
        
        socket.emit('channel invite', channel, true);
        return channel;
      } catch (error) {
        console.error('Error inviting to channel:', error);
        socket.emit('channel invite', null, true);
        return null;
      }
    }
    
    // Test the function
    return handleChannelInvite(mockSocket, 'newUser', 'private-channel', mockChannel, mockUser)
      .then(result => {
        // Verify the user and channel were found
        expect(mockUser.findOne).toHaveBeenCalledWith({ username: 'newUser' });
        expect(mockChannel.findOne).toHaveBeenCalledWith({ channelName: 'private-channel' });
        
        // Verify the result
        expect(result.channelName).toBe('private-channel');
        expect(result.users).toContain('newUser');
        
        // Verify socket.emit was called correctly
        expect(mockSocket.emit).toHaveBeenCalledWith('channel invite', result, true);
      });
  });
});

// tests/performance/socket-performance.test.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');

describe('Socket.io Performance Tests', () => {
  let io, serverSocket, clientSockets = [], httpServer;
  const numClients = 10; // Number of simultaneous clients to test
  
  beforeAll(async () => {
    // Create HTTP server
    const app = express();
    httpServer = createServer(app);
    io = new Server(httpServer);
    
    // Start the server
    await new Promise(resolve => {
      httpServer.listen(() => {
        const port = httpServer.address().port;
        
        // Set up server socket handlers
        io.on('connection', (socket) => {
          socket.on('channel message', (message, channelName) => {
            // Process message
            const processedMsg = {
              messageId: Date.now(),
              msg: message,
              username: socket.username || 'anonymous',
              visible: true,
              channelName
            };
            
            // Broadcast to all clients
            io.emit('channel message', processedMsg, channelName);
          });
        });
        
        resolve(port);
      });
    });
  });
  
  afterAll(() => {
    // Clean up
    io.close();
    for (const socket of clientSockets) {
      socket.close();
    }
  });
  
  test('should handle multiple concurrent messages efficiently', async () => {
    const port = httpServer.address().port;
    
    // Create multiple client connections
    for (let i = 0; i < numClients; i++) {
      const socket = new Client(`http://localhost:${port}`);
      socket.username = `user${i}`;
      clientSockets.push(socket);
    }
    
    // Wait for all connections to establish
    await Promise.all(clientSockets.map(socket => 
      new Promise(resolve => socket.on('connect', resolve))
    ));
    
    // Prepare to listen for responses
    const receivedMessages = [];
    const receivedPromises = [];
    
    for (let i = 0; i < numClients; i++) {
      receivedPromises.push(new Promise(resolve => {
        clientSockets[i].on('channel message', (msg) => {
          receivedMessages.push(msg);
          if (receivedMessages.length === numClients) {
            resolve();
          }
        });
      }));
    }
    
    // Start performance timing
    const startTime = Date.now();
    
    // Have each client send a message
    for (let i = 0; i < numClients; i++) {
      clientSockets[i].emit('channel message', `Message from client ${i}`, 'performance-test');
    }
    
    // Wait for all messages to be processed
    await Promise.all(receivedPromises);
    
    // End performance timing
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Verify all messages were received
    expect(receivedMessages.length).toBe(numClients);
    
    // Check processing time (this threshold may need adjustment)
    console.log(`Processed ${numClients} concurrent messages in ${processingTime}ms`);
    expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    
    // Calculate average message processing time
    const avgProcessingTime = processingTime / numClients;
    console.log(`Average processing time per message: ${avgProcessingTime}ms`);
    expect(avgProcessingTime).toBeLessThan(100); // Each message should take less than 100ms on average
  }, 10000); // Increase test timeout
});
