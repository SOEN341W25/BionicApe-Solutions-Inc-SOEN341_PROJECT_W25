// Filename - model/Channel.js
//create channel
const mongoose = require('mongoose')
const Schema = mongoose.Schema

var Channel = new Schema({
    channelName: {
        type: String
    },

    users: {
        type:[String]
    }
})


Channel.method.toJSON= function(){
    var obj=this.toObject();
    delete obj._id;
    return obj;

}
module.exports = mongoose.model('Channel', Channel)
