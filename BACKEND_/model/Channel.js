// Filename - model/Channel.js
//create channel
const mongoose = require('mongoose')
const Schema = mongoose.Schema

var Channel = new Schema({//fieldtype: variable type
    channelName: {
        type: String
    },
    messageIds: [
    {type: mongoose.Schema.Types.ObjectId, ref:'Message'}	
    ],
    users: {
        type:[String]
    },
    public: {
        type: Boolean, default:true
    }
})


Channel.method.toJSON= function(){
    var obj=this.toObject();
    delete obj._id;
    return obj;

}

//this is a mongodb collection
module.exports = mongoose.model('channels', Channel)
