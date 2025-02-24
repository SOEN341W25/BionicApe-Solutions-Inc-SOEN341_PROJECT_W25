// Filename - model/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role:{
        type:String,
    },
    channels: {
        type:[String]
    }
})

const User = mongoose.model("User",userSchema);
 

export default User;