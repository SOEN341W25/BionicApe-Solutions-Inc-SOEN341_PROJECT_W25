const express = require('express');
const router = express.Router();
const User = require('../model/User');
const { isLoggedIn, isAdminCheck } = require('../middleware/auth');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:username', isLoggedIn, async (req, res) => {
    try {
        const username = req.session.user;
        const isAdmin = await isAdminCheck(username);
        
        // Only admins can update other users, or users can update themselves
        if (req.params.username !== username && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update user' });
        }
        
        const { role, userStatus, channels } = req.body;
        
        // Only admins can change roles
        if (role && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to change role' });
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { username: req.params.username },
            { 
                ...(role && { role }),
                ...(userStatus && { userStatus }),
                ...(channels && { channels })
            },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's direct messages
router.get('/userDMs/:username', isLoggedIn, async (req, res) => {
    try {
        const username = req.session.user;
        
        // Users can only view their own DMs
        if (req.params.username !== username) {
            const isAdmin = await isAdminCheck(username);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Not authorized to view these messages' });
            }
        }
        
        const user = await User.findOne(
            { username: req.params.username },
            { 'userDMs.messageIds': { $slice: -10 } } // Show the last 10 messages per DM
        ).populate({
            path: 'userDMs.messageIds',
            options: { sort: { 'createdAt': 1 } }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
