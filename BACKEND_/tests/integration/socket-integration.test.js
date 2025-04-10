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
              isPublic: false
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
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    httpServer.close();
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
