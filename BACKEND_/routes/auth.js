const express = require('express');
const router = express.Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Home page
router.get('/', (req, res) => {
    res.render('../FRONTEND_/views/index');
});

router.get('/index', (req, res) => {
    res.render('../FRONTEND_/views/index');
});

// Register page
router.get('/register', (req, res) => {
    res.render('../FRONTEND_/views/register');
});

// Login page
router.get('/login', (req, res) => {
    res.render('../FRONTEND_/views/login');
});

// Chat pages (require login)
router.get('/channels', isLoggedIn, (req, res) => {
    res.render('../FRONTEND_/views/channels', { username: req.session.user });
});

router.get('/userDM', isLoggedIn, (req, res) => {
    res.render('../FRONTEND_/views/userDM', { username: req.session.user });
});

// Admin pages
router.get('/adminPage', isAdmin, async (req, res) => {
    const users = await User.find({});
    res.render('../FRONTEND_/views/adminPage', { users });
});

router.get('/editUser', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ username: req.query.username });
    res.render('../FRONTEND_/views/editUser', { user });
});

router.get('/editChannel', isLoggedIn, async (req, res) => {
    const channel = await Channel.findOne({ channelName: req.query.channelName });
    res.render('../FRONTEND_/views/editChannel', { channel });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, isAdminCheckbox, admin_pass } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).render('register', { 
                error: 'Username already exists. Please try a different username.' 
            });
        }
        
        // Check admin registration
        const isAdmin = isAdminCheckbox === 'on';
        if (isAdmin) {
            const correctAdminPassword = process.env.ADMIN_KEY || 'PETERGRIFFIN2025';
            if (admin_pass !== correctAdminPassword) {
                return res.status(400).render('register', { 
                    error: 'Incorrect admin password. Please try again.' 
                });
            }
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        await User.create({
            username,
            password: hashedPassword,
            role: isAdmin ? 'Admin' : 'NormalUser',
            channels: ['General']
        });
        
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).render('register', { 
            error: 'An error occurred during registration. Please try again.' 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        
        // Set session
        req.session.user = username;
        
        // Redirect based on role
        if (user.role === 'Admin') {
            return res.redirect('/adminPage');
        } else {
            return res.redirect('/channels');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
