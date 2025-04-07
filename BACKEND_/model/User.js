// Filename - model/User.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema

var User = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    },
    role:{
        type:String
    },
    channels: {
        type:[String]
    },
    userDMs: [{
    	recipientUser: {
    		type:String
    	},
    	messageIds:[{
    		type: mongoose.Schema.Types.ObjectId,
    		ref: 'Message' //Reference to the Message model
    		}]
    	}],
    userStatus:{
        type: String
    },
    lastActivateAt: {
        type: Date  
    }
 })

//remove password when transforming to JSON. Don't want to send back to clients with password
User.methods.toJSON= function(){
    var obj=this.toObject();
    delete obj.password;
    delete obj._id;
    return obj;
}

//this is mongodb collection
module.exports = mongoose.model('users', User)
    
