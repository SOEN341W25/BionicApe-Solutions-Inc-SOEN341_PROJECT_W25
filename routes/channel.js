const express = require('express');
const router = express.Router();
const Channel = require('../model/Channel');
const { isLoggedIn, isAdminCheck } = require('../middleware/auth');

// Get all channels
router.get('/', async (req, res) => {
    try {
        const channels = await Channel.find({});
        res.status(200).json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's channels
router.get('/user', isLoggedIn, async (req, res) => {
    try {
        const username = req.session.user;
        const isAdmin = await isAdminCheck(username);
        
        // Admins see all channels, users see public channels and their own
        const query = isAdmin 
            ? {} 
            : { $or: [{ users: username }, { public: true }] };
            
        const channels = await Channel.find(query);
        res.status(200).json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get channel by name with messages
router.get('/:channelName', async (req, res) => {
    try {
        const channel = await Channel.findOne(
            { channelName: req.params.channelName },
            { messageIds: { $slice: -10 } } // Show the last 10 messages
        ).populate({
            path: 'messageIds',
            options: { sort: { 'createdAt': 1 } }
        });
        
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        res.status(200).json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new channel
router.post('/', isLoggedIn, async (req, res) => {
    try {
        const { channelName, public } = req.body;
        const username = req.session.user;
        
        // Check if channel already exists
        const existingChannel = await Channel.findOne({ channelName });
        if (existingChannel) {
            return res.status(400).json({ error: 'Channel already exists' });
        }
        
        // Create channel
        const newChannel = await Channel.create({
            channelName,
            users: [username],
            public: public === 'true'
        });
        
        res.status(201).json(newChannel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update channel
router.put('/:channelName', isLoggedIn, async (req, res) => {
    try {
        const { users, public } = req.body;
        const username = req.session.user;
        const isAdmin = await isAdminCheck(username);
        
        // Check if user can modify the channel
        const channel = await Channel.findOne({ 
            channelName: req.params.channelName,
            $or: [{ users: username }, { public: true }]
        });
        
        if (!channel && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update channel' });
        }
        
        // Update channel
        const updatedChannel = await Channel.findOneAndUpdate(
            { channelName: req.params.channelName },
            { 
                ...(users && { users }),
                ...(public !== undefined && { public })
            },
            { new: true }
        );
        
        res.status(200).json(updatedChannel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete channel (admin only)
router.delete('/:channelName', isLoggedIn, async (req, res) => {
    try {
        const username = req.session.user;
        const isAdmin = await isAdminCheck(username);
        
        if (!isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete channel' });
        }
        
        const result = await Channel.deleteOne({ channelName: req.params.channelName });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        res.status(200).json({ message: 'Channel deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
