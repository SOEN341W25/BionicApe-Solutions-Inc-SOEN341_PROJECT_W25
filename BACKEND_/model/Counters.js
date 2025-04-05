// Filename - model/Counters.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema

var Counters = new Schema({
    _id: {
        type:String
    },
    seq: {
        type:Number, default:0
    }
})


module.exports = mongoose.model('Counters', Counters)
