const Counters = require('../model/Counters');

// Get next sequence number for message IDs
async function preIncrement(sequenceName) {
    const counter = await Counters.findByIdAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    
    return counter.seq;
}

module.exports = { preIncrement };
