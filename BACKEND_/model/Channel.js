const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
    channelName: {
        type: String,
        required: true,
        unique: true
    },
    messageIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    users: {
        type: [String],
        default: []
    },
    public: {
        type: Boolean,
        default: true
    }
});

// Remove _id when transforming to JSON
channelSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj._id;
    return obj;
};

module.exports = mongoose.model('channels', channelSchema);
