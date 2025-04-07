const express = require('express');
const router = express.Router();
const Message = require('../model/Message');
const Counters = require('../model/Counters');
const { isLoggedIn, isAdminCheck } = require('../middleware/auth');
const { preIncrement } = require('../utils/messageUtils');

// Get message by ID
router.get('/:messageId', async (req, res) => {
    try {
        const message = await Message.findOne({ messageId: req.params.messageId });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        res.status(200).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new message
router.post('/', isLoggedIn, async (req, res) => {
    try {
        const { msg } = req.body;
        const username = req.session.user;
        
        // Get next message ID
        const nextId = await preIncrement('messageId');
        
        // Create message
        const newMessage = await Message.create({
            messageId: nextId,
            msg,
            username
        });
        
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update message (visibility)
router.put('/:messageId', isLoggedIn, async (req, res) => {
    try {
        const { visible } = req.body;
        const username = req.session.user;
        
        // Get the message
        const message = await Message.findOne({ messageId: req.params.messageId });
        
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        // Check if user can modify the message (owner or admin)
        if (message.username !== username) {
            const isAdmin = await isAdminCheck(username);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Not authorized to update this message' });
            }
        }
        
        // Update message
        const updatedMessage = await Message.findOneAndUpdate(
            { messageId: req.params.messageId },
            { visible },
            { new: true }
        );
        
        res.status(200).json(updatedMessage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
