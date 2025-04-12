const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'NormalUser'],
        default: 'NormalUser'
    },
    channels: {
        type: [String],
        default: []
    },
    userDMs: [{
        recipientUser: {
            type: String,
            required: true
        },
        messageIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }]
    }],
    userStatus: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastActivateAt: {
        type: Date,
        default: Date.now
    },
    autoReplyMessage: {
        type: String,
        default: "I'm currently offline. I’ll get back to you soon!"
    }
    
});

// Remove password when transforming to JSON
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj._id;
    return obj;
};

module.exports = mongoose.model('users', userSchema, 'users');
