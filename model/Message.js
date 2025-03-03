// Filename - model/Message.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema

var Message = new Schema({
    messageId: {
        type:Number, default:0
    },
    msg: {
        type: String
    },
    visible: {
        type:Boolean, default:true
    },
    username:{
        type: String
    }
})


module.exports = mongoose.model('Message', Message)
