const mongoose = require('mongoose');
const User = require('../model/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chathaven';

// Create default admin user if not exists
async function createDefaultAdmin() {
    try {
        const admin = await User.findOne({ username: 'admin' });
        
        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'Admin',
                channels: ['General']
            });
            
            await newAdmin.save();
            console.log('Default admin user created.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error checking or creating admin user:', error);
    }
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        createDefaultAdmin();
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

module.exports = mongoose;
