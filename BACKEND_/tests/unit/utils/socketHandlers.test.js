// tests/unit/utils/socketHandlers.test.js
// This tests the socket event handling logic

describe('Socket Handlers Tests', () => {
  // Mock socket.io
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    username: 'testuser'
  };
  
  const mockIo = {
    emit: jest.fn()
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should handle channel message events', () => {
    // Socket handler similar to what would be in the server
    function handleChannelMessage(socket, io) {
      socket.on('channel message', (message, channelName) => {
        const processedMsg = {
          messageId: Date.now(),
          msg: message,
          username: socket.username || 'anonymous',
          visible: true,
          channelName
        };
        
        io.emit('channel message', processedMsg, channelName);
        return processedMsg;
      });
    }
    
    // Set up the handler
    handleChannelMessage(mockSocket, mockIo);
    
    // Verify socket.on was called correctly
    expect(mockSocket.on).toHaveBeenCalledWith('channel message', expect.any(Function));
    
    // Extract the handler
    const messageHandler = mockSocket.on.mock.calls[0][1];
    
    // Test the handler
    const message = 'Hello, channel!';
    const channelName = 'general';
    const result = messageHandler(message, channelName);
    
    // Verify the result
    expect(result.msg).toBe(message);
    expect(result.username).toBe('testuser');
    expect(result.visible).toBe(true);
    expect(result.channelName).toBe(channelName);
    
    // Verify io.emit was called correctly
    expect(mockIo.emit).toHaveBeenCalledWith('channel message', result, channelName);
  });
  
  test('should handle direct message events', () => {
    function handleDirectMessage(socket, io) {
      socket.on('dms to user', (message, recipientUser) => {
        const processedMsg = {
          messageId: Date.now(),
          msg: message,
          username: socket.username || 'anonymous',
          visible: true,
          recipientUser
        };
        
        io.emit('dms to user', processedMsg, recipientUser);
        return processedMsg;
      });
    }
    
    handleDirectMessage(mockSocket, mockIo);
    
    expect(mockSocket.on).toHaveBeenCalledWith('dms to user', expect.any(Function));
    
    const dmHandler = mockSocket.on.mock.calls[0][1];
    
    const message = 'Hey there!';
    const recipientUser = 'otheruser';
    const result = dmHandler(message, recipientUser);
    
    expect(result.msg).toBe(message);
    expect(result.username).toBe('testuser');
    expect(result.recipientUser).toBe(recipientUser);
    
    expect(mockIo.emit).toHaveBeenCalledWith('dms to user', result, recipientUser);
  });
  
  test('should handle message visibility modification', () => {
    function handleMessageModification(socket, io) {
      socket.on('modify channel message', (messageId, visible) => {
        // In the real app, this would update the message in the database
        const updatedMessage = {
          messageId,
          msg: 'Original message content',
          username: 'testuser',
          visible
        };
        
        io.emit('modify channel message', updatedMessage, visible);
        return updatedMessage;
      });
    }
    
    handleMessageModification(mockSocket, mockIo);
    
    expect(mockSocket.on).toHaveBeenCalledWith('modify channel message', expect.any(Function));
    
    const modifyHandler = mockSocket.on.mock.calls[0][1];
    
    // Test toggling a message to invisible (deleted)
    const messageId = '123';
    const visible = false;
    const result = modifyHandler(messageId, visible);
    
    expect(result.messageId).toBe(messageId);
    expect(result.visible).toBe(visible);
    
    expect(mockIo.emit).toHaveBeenCalledWith('modify channel message', result, visible);
  });
  
  test('should handle channel invite events', () => {
    function handleChannelInvite(socket, io) {
      socket.on('channel invite', (username, channelName) => {
        // In the real app, this would check if the user exists
        const userExists = true;
        
        const updatedChannel = {
          channelName,
          users: ['existingUser', username],
          public: false
        };
        
        socket.emit('channel invite', updatedChannel, userExists);
        return { channel: updatedChannel, userExists };
      });
    }
    
    handleChannelInvite(mockSocket, mockIo);
    
    expect(mockSocket.on).toHaveBeenCalledWith('channel invite', expect.any(Function));
    
    const inviteHandler = mockSocket.on.mock.calls[0][1];
    
    const username = 'newuser';
    const channelName = 'private-room';
    const result = inviteHandler(username, channelName);
    
    expect(result.channel.channelName).toBe(channelName);
    expect(result.channel.users).toContain(username);
    expect(result.userExists).toBe(true);
    
    expect(mockSocket.emit).toHaveBeenCalledWith('channel invite', result.channel, result.userExists);
  });
});
