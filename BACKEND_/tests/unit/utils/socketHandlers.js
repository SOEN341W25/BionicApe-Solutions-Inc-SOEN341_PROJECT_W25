const User = require('../model/User');
const Channel = require('../model/Channel');
const Message = require('../model/Message');
const { isAdminCheck } = require('../middleware/auth');
const { preIncrement } = require('./messageUtils');

// Map to store active user socket connections
const userSocketMap = {};

// Set up socket handlers
function setupSocketHandlers(io, sentiment) {
    io.on('connection', async function(socket) {
        console.log("Socket connected!");
        const userName = socket.request.session.user;
        
        if (!userName) {
            return;
        }
        
        // Store socket ID for the user
        userSocketMap[userName] = socket.id;
        
        // Update user status to online
        try {
            const user = await User.findOneAndUpdate(
                { username: userName },
                { 
                    userStatus: "online", 
                    lastActivateAt: new Date() 
                },
                { new: true }
            );
            io.emit('user status', user);
        } catch (error) {
            console.error("Error updating user status:", error);
        }
        
        // Handle channel messages
        socket.on('channel message', async (msg, channelName) => {
            try {
                // Analyze sentiment
                const result = sentiment.analyze(msg);
                const sentimentLabel = result.score > 0 ? 'positive' : 
                                      result.score < 0 ? 'negative' : 'neutral';
                
                // Create and save message
                const nextId = await preIncrement("messageId");
                const newMessage = await Message.create({
                    messageId: nextId,
                    msg: msg,
                    username: userName,
                    sentiment: sentimentLabel
                });
                
                // Add message to channel
                await Channel.findOneAndUpdate(
                    { channelName: channelName },
                    { $push: { messageIds: newMessage._id } },
                    { new: true, upsert: true }
                );
                
                // Send message to all clients
                const messageObj = newMessage.toObject();
                messageObj.sentiment = sentimentLabel;
                
                io.emit('channel message', messageObj, channelName);
            } catch (error) {
                console.error("Error sending channel message:", error);
            }
        });
        
        // Handle direct messages
        socket.on('dms to user', async (msg, recipientUsername) => {
            try {
                // Analyze sentiment
                const result = sentiment.analyze(msg);
                const sentimentLabel = result.score > 0 ? 'positive' : 
                                      result.score < 0 ? 'negative' : 'neutral';
                
                // Create and save message
                const nextId = await preIncrement("messageId");
                const newMessage = await Message.create({
                    messageId: nextId,
                    msg: msg,
                    username: userName,
                    sentiment: sentimentLabel
                });
                
                // Add message to sender's DMs
                const sender = await User.findOne({ username: userName });
                let senderDM = sender.userDMs.find(dm => dm.recipientUser === recipientUsername);
                
                if (!senderDM) {
                    sender.userDMs.push({ 
                        recipientUser: recipientUsername, 
                        messageIds: [newMessage._id] 
                    });
                } else {
                    senderDM.messageIds.push(newMessage._id);
                }
                
                await sender.save();
                
                // Add message to recipient's DMs if not sending to self
                if (userName !== recipientUsername) {
                    const recipient = await User.findOne({ username: recipientUsername });
                    
                    if (recipient) {
                        let recipientDM = recipient.userDMs.find(dm => dm.recipientUser === userName);
                        
                        if (!recipientDM) {
                            recipient.userDMs.push({ 
                                recipientUser: userName, 
                                messageIds: [newMessage._id] 
                            });
                        } else {
                            recipientDM.messageIds.push(newMessage._id);
                        }
                        
                        await recipient.save();
                    }
                }
                
                // Send message to sender
                const messageObj = newMessage.toObject();
                messageObj.sentiment = sentimentLabel;
                
                const senderSocketId = userSocketMap[userName];
                if (senderSocketId) {
                    io.to(senderSocketId).emit('dms to user', messageObj, recipientUsername);
                }
                
                // Send message to recipient if not sending to self
                if (userName !== recipientUsername) {
                    const recipientSocketId = userSocketMap[recipientUsername];
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('dms to user', messageObj, userName);
                    }
                }
            } catch (error) {
                console.error("Error sending direct message:", error);
            }
        });
        
        // Handle message modification (delete/restore)
        socket.on('modify channel message', async (messageId, visible) => {
            try {
                // Check if user is admin
                const isAdmin = await isAdminCheck(userName);
                
                if (!isAdmin) {
                    console.log("Not an admin, cannot modify message");
                    return;
                }
                
                // Update message visibility
                const message = await Message.findOneAndUpdate(
                    { messageId: messageId },
                    { visible: visible },
                    { new: true }
                );
                
                if (message) {
                    io.emit('modify channel message', message, visible);
                }
            } catch (error) {
                console.error("Error modifying message:", error);
            }
        });
        
        // Handle channel invites
        socket.on('channel invite', async (userToInvite, channelName) => {
            try {
                // Check if user exists
                const user = await User.findOne({ username: userToInvite });
                
                if (!user) {
                    socket.emit('channel invite', null, false);
                    return;
                }
                
                // Add user to channel
                const channel = await Channel.findOneAndUpdate(
                    { channelName: channelName, users: userName },
                    { $addToSet: { users: userToInvite } },
                    { new: true }
                );
                
                socket.emit('channel invite', channel, true);
            } catch (error) {
                console.error("Error inviting user to channel:", error);
                socket.emit('channel invite', null, false);
            }
        });
        
        // Handle leaving a channel
        socket.on('channel leave', async (channelName) => {
            try {
                // Remove user from channel
                await Channel.findOneAndUpdate(
                    { channelName: channelName, users: userName },
                    { $pull: { users: userName } },
                    { new: true }
                );
                
                socket.emit('channel leave', true);
            } catch (error) {
                console.error("Error leaving channel:", error);
                socket.emit('channel leave', false);
            }
        });
        
        // Handle disconnect
        socket.on('disconnect', async () => {
            try {
                // Update user status to offline
                const user = await User.findOneAndUpdate(
                    { username: userName },
                    { 
                        userStatus: "offline", 
                        lastActivateAt: new Date() 
                    },
                    { new: true }
                );
                
                // Remove from active users
                delete userSocketMap[userName];
                
                io.emit('user status', user);
            } catch (error) {
                console.error("Error handling disconnect:", error);
            }
        });
    });
}

module.exports = setupSocketHandlers;
