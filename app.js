// Filename - App.js (server)

//=====================
// REQUIRES (INCLUDES)
//=====================
const express = require("express");
const path=require('path');//include path library for combining path together

const { createServer }= require('node:http');
const { join }=require('node:path');
const { Server }= require('socket.io');


require('./BACKEND_/database/db');   
const User = require("./BACKEND_/model/User");
const Channel = require("./BACKEND_/model/Channel");
const Message = require("./BACKEND_/model/Message");
const Counters = require("./BACKEND_/model/Counters");
const mongoose = require('mongoose')
const { sessionMiddleware, wrap }=require("./BACKEND_/session/serverController");
//const bcrypt = require("bcrypt");
//============================
//SETUP EXPRESS
//============================

let app = express();
const server =createServer(app);
const io= new Server(server);


//Set up static file serving
app.use(express.static(path.join(__dirname,'public')));

app.set("view engine", "ejs");//setup view engine ejs
app.set('views', path.join(__dirname, 'FRONTEND_/views'));
var bodyParser=require('body-parser');//support data payload for post requests
const { channel } = require("diagnostics_channel");
const { truncate, truncateSync } = require("node:fs");
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));


//====================
//SETUP USER SESSION MIDDLEWARE
//====================
app.use(sessionMiddleware);
io.use (wrap(sessionMiddleware));


//=====================
// MAIN PAGE ROUTES
//=====================

// Showing home page
app.get("", function (req, res) {
  res.render("index");
});

app.get("/index", function (req, res) {
  res.render("index");
});


// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
  res.render("secret");
});

app.get("/adminPage", isAdmin, async function (req, res) {
  // retrieve all users and pass it to the html
  var users = await User.find({});//users is the array of users
  console.log(JSON.stringify(users))
  res.render("adminPage",{users});
});


app.get("/editUser", isLoggedIn, async function (req, res) {
  // retrieve all users and pass it to the html
  var user = await User.findOne({ username: req.query.username });
  console.log(JSON.stringify(user))
  res.render("editUser",{user});
});



app.get("/editChannel", isLoggedIn, async function (req, res) {
  // retrieve all users and pass it to the html
  var channel = await Channel.findOne({ channelName: req.query.channelName });
  console.log(JSON.stringify(channel))
  res.render("editChannel",{channel});
});



//=====================
// REST API FOR DATA
//=====================

//HTTP FOR USER
//It should be /api/user/:username
//because in best practice standard rest api, we do not use verbs 
//it should be a link to resources 
app.get("/api/user/getuser/:username", async function (req, res){
  user=await User.findOne({username: req.params.username});
  res.status(200).json(user);
});

//Todo might need to change it
app.put("/api/user/:username", async function (req, res){
  user=await User.findOneAndUpdate({username: req.params.username},{role:req.body.role});
  res.status(200).json(user);
  
});

app.get("/api/user", async function (req,res){
  users=await User.find({});
  res.status(200).json(users);

});



//HTTP FOR CHANNEL
//This one retrieves single channel by channel name
/* app.get("/api/channel/:channelName",async function (req, res){
  let channel=await Channel.findOne({channelName: req.params.channelName});
  res.status(200).json(channel);
}); */
//This one gets all channels (good for admin) 
app.get("/api/channel", async function (req,res){
   let channels=await Channel.find({});
  res.status(200).json(channels);
});

//This one creates a channel by username (good for admin page)
app.post("/api/channel" , async function (req, res){
  console.log("Inside post channel"+req.body.channelName);
  const channel = await Channel.findOne({channelName: req.body.channelName});
if(!channel)
{
  const newChannel = await Channel.create({
    channelName: req.body.channelName,
    users: [req.session.user],
    public: req.body.public=="true"//conversion from string too boolean cause frontend can only have strings as values
  });
  return res.status(200).json(newChannel);
}
else
{
  return res.status(403).json({error: "channel already exists"});
}

});
//This one modifies the channel by providing the username
app.put("/api/channel/:channelName", async function (req,res){
 let channel=await Channel.findOneAndUpdate({channelName: req.params.channelName},{users:req.body.users});
  res.status(200).json(channel);
});
//This one deletes the channel by channel name
app.delete("/api/channel/:channelName", async function (req, res){
  let channel=await Channel.deleteOne({channelName: req.params.channelName});
  res.status(200).json(channel);
});

//This gets all channels by username (good for users), not accesible through postman for now
//user and channel should be swapped since the database retrieves the entity channel.
//Channel should have been first then user
//Most popular website such as fb and all uses me to retrieve the current logged in session
//So it should /api/channel/user/me
app.get("/api/user/channels", isLoggedIn, async function (req, res) {
  const user = req.session.user;
  let adminRole = await isAdminCheck(req.session.user);
  let queryJson = adminRole? {} : {$or:[{users: user}, {public:true}]};
  const channels = await Channel.find(queryJson);
  return res.status(200).json(channels)
});
//querying=searching
//CHAT FEATURE

// get history of channel when select channel
app.get("/api/channel/:channelName", async function (req, res) {
  // check if you are admin, if so, remove the match or {}??
  //let adminRole = await isAdminCheck(req.session.user);
  //let visibleJson = adminRole? {} : {visible: true};



  let channel = await Channel.findOne({channelName:req.params.channelName}, {messageIds: { $slice: -5 }}) // show the last 5 messages
      .populate({
          path:'messageIds', 
          match: {}
          });
  res.status(200).json(channel);
});


app.get("/api/user/userDMs/:username", async function (req, res) {
  let userName=req.session.user;
  let user = await User.findOne({ username: userName }, {'userDMs.messageIds': { $slice: -5 }})// show the last 5 messages
       .populate({
          path:'userDMs.messageIds'
       });
  res.status(200).json(user);
});

async function saveDmToDatabase(senderName, recipientName, message)
{
  let senderUsername = senderName;
  let recipientUsername = recipientName;
  let nextId = await preIncrement("messageId");
  let newMessage = await Message.create({
      messageId: nextId,
      msg: message,
      username: senderUsername
  });

  
  // Find and update the sender's userDMs to push the messageId
  const sender = await User.findOne({ username: senderUsername });
  const recipient = await User.findOne({ username: recipientUsername });

  // Ensure both sender and recipient exist
  if (!sender || !recipient) {
    throw new Error('Sender or recipient not found');
  }

  // Check if the sender already has an entry for the recipient in userDMs
  const senderDM = sender.userDMs.find(dm => dm.recipientUser === recipientUsername);
  if (!senderDM) {
    // If no entry exists, add a new one for the recipient
    sender.userDMs.push({ recipientUser: recipientUsername, messageIds: [newMessage._id] });
  } else {
    // If entry exists, just push the messageId into their messageIds array
    senderDM.messageIds.push(newMessage._id);
  }

  // Check if the recipient already has an entry for the sender in userDMs
  const recipientDM = recipient.userDMs.find(dm => dm.recipientUser === senderUsername);
  if (!recipientDM) {
    // If no entry exists, add a new one for the sender
    recipient.userDMs.push({ recipientUser: senderUsername, messageIds: [newMessage._id] });
  } else {
    // If entry exists, just push the messageId into their messageIds array
    recipientDM.messageIds.push(newMessage._id);
  }

  // Save both users after updating their userDMs
  await sender.save();

  // if you send to yourself, we save it only once
  if(senderUsername != recipientUsername)
  {
    await recipient.save();        
  }

  
  
  return newMessage;
}
async function deleteMessageInDatabase(messageid, visibility){
  let message = await Message.findOneAndUpdate(
    {messageId:messageid},
    {visible: visibility},
    {new:true}//must be the new message
);
return message;
};

async function saveChannelMessageInDatabase(message, user, channelname){
    let nextId = await preIncrement("messageId");
    let newMessage = await Message.create({ // database query
        messageId: nextId,
        msg:message,
        username:user

    });
    await Channel.findOneAndUpdate( // database query
        {channelName:channelname},
        {$push: {messageIds: newMessage._id}}, // push message id to the array of messageIds (newMessage._id this is the OBJECTID)
        {new: true, upsert: true}
    
    );
    return newMessage;
} ;
// usually, you would do global variable and you do ++
// but if you turn off the application, it will restart
// with database, the counter is remembered and the next time you start the application it will continue where it left off

// the sequence name is the name of the counter (for us, we need message id counter in the database)
async function preIncrement(sequenceName) {
      let newCounter = await Counters.findByIdAndUpdate( // database query
          {_id: sequenceName},
          {$inc: {seq: 1}},
          {new: true, upsert: true} // upsert its a fusion of two words: update or insert (create if not exist)
      );
      return newCounter.seq

};







//=====================
// AUTHENTICATE PAGE ROUTES
//=====================

// Showing home page
app.get("", function (req, res) {
  res.render("index");
});

// Showing register form
app.get("/register", function (req, res) {
res.render("register");
});

//Showing login form
app.get("/login", function (req, res) {
  res.render("login");
});

app.get('/channelChatting', function(req, res) {

  if (!req.session.user) {
    return res.redirect('/login'); // Ensure the user is logged in
  }

  res.render('channelChatting', {username: req.session.user }); // Make sure this file exists in the "views" folder
});

app.get('/userDM',function (req, res){
  res.render('userDM'); // Make sure this file exists in the "views" folder
});

//Showing channel form
app.get("/channels", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirect if not logged in
  }

  try {
    const channels = await Channel.find({});
    res.render("channels", { channels,  username: req.session.user  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching channels." });
  }
});

//Handling user logout 
app.get("/logout", function (req, res) {
  console.log("Current session destroyed: "+ req.session.user)
  req.session.destroy()//to destroy the whole session
  res.redirect('/');

});

// Handling user signup
app.post('/register', async (req, res) => {
  const { username, password, isAdminCheckbox, admin_pass } = req.body;
  const existingUsername = await User.findOne({username: req.body.username});
  if (existingUsername) {
    return res.status(400).render("signup", { error: "Username already exists. Please try a different username." });
  }

  // Check if the user is trying to register as an admin
  const isAdmin = isAdminCheckbox === 'on'; // Checkbox value is 'on' when checked
	console.log(isAdminCheckbox);
  // Validate admin password if the user claims to be an admin
  if (isAdmin) {
      const correctAdminPassword = "PETERGRIFFIN2025";
      if (admin_pass !== correctAdminPassword) {
          // If the admin password is incorrect, render the register page with an error message
          return res.status(400).render('register', { error: "Incorrect admin password. Please try again." });
      }
  }
	console.log(isAdmin);
  // If the admin password is correct (or the user is not an admin), proceed with registration
  try {
      const newUser = await User.create({
          username,
          password,
          role: isAdmin ? "Admin" : "NormalUser", // Set role based on admin status
          channels: ["HomeChannel", "ApeChannel"]
      });

      // Redirect to login or another page after successful registration
      res.redirect('/login');
  } catch (error) {
      console.error(error);
      res.status(500).render('register', { error: "An error occurred during registration. Please try again." });
  }
});


//Handling user login
app.post("/login", async (req, res) =>{
  try {
      // check if the user exists
      const user = await User.findOne({ username: req.body.username });
      if (user) {
        //check if password matches
        const result = req.body.password === user.password;
        if (result) {
          req.session.user=req.body.username;//to log in
          console.log("Set Current Session variable:" +req.session.user)
          // res.status(200).json({status:"Logged in"})// ask user to change html page
          if(user.role === "Admin"){
            res.redirect('/adminPage'); 
          }
          else {
            res.redirect('/channels');
          }

        } else {
          res.status(400).json({ error: "password doesn't match" });
        }
      } else {
        res.status(400).json({ error: "User doesn't exist" });
      }
    } catch (error) {
      res.status(400).json({ error });
    }
});






//Function used to check if session is still valid (if the user is logged in)
function isLoggedIn(req, res, next) {
  const sessionUser=req.session.user || 'No session set';
  if(req.session.user){
    console.log("Current session variable: "+sessionUser)
    req.user = sessionUser
    return next();
  }
  console.log("Current session variable: "+sessionUser)
  if(req.url.includes("api"))//if url contains an api, then we send back a JSON and say you are not authorized
  {
    res.status(401).json({error:"Unauthorized"});
  }
  else{
    res.redirect("/login");//not an api call and not authorized, request for a html page so we send them back to the log in page because there not logged in
  }
}

// non middleware
async function isAdminCheck(userName)
{
  const user = await User.findOne({ username: userName});
  let result = false;
  if (user) {
    //check if password matches
     result =  user.role === "Admin";
  }
  return result;
}

async function isAdmin(req,res,next){
  // is logged in
  if(req.session.user){
    const user = await User.findOne({ username: req.session.user });
    if (user) {
      //check if password matches
      const result =  user.role === "Admin";
      if(result)
      {
        console.log("User has admin role ");
        return next();
      }
      else
      {
        console.log("Redirect to channel page for normal users");
        res.redirect("/channel");// channel page for normal users
      }
    }
    else
    {
      console.log("Can't find current user session in database");
      res.redirect("/login");// channel page for normal users
    }
  }
  else
  {
    console.log("User has not logged in");
    res.redirect("/login");
  }

}
//=====================
// WEBSOCKET FUNCTION
//=====================
let usersocketmap = {};
io.on('connection',  async function(socket){
  console.log("connected!")
  let userName=socket.request.session.user;
  usersocketmap[userName] = socket.id;//put the username in the [] and it will return a socket id value
//when you connect, you will have a key of the username and the value will be associated  the socket id (mapping)
//a map is a list of key value
//if admin logs in, it will have a socket id as the value, the key is admin
//key=admin or user, value=socketid, a map is a list of key value
  console.log(usersocketmap[userName]);
  let activeStatus="online";
  let currentTime=new Date();
  let user=await User.findOneAndUpdate({username:userName},{userStatus:activeStatus, lastActivateAt:currentTime},{new:true});
  console.log(user, "this is connect mode");
  io.emit('user status', user);
  

  socket.on('channel message', async (msg, channelName)=>{
    let userName=socket.request.session.user;
    let newMessage= await saveChannelMessageInDatabase(msg, userName, channelName);
      io.emit('channel message',newMessage, channelName);//backend will rebroadcast it to everyone 
      console.log("sending msg! ",JSON.stringify(newMessage))
  });
 

  socket.on('dms to user', async (msg, currentRecipientUser)=>{
    let userName=socket.request.session.user;
    const senderSocketId=usersocketmap[userName];
    const recipientSocketId=usersocketmap[currentRecipientUser];
    console.log(senderSocketId);
    console.log(recipientSocketId);
    let newMessage= await saveDmToDatabase(userName, currentRecipientUser, msg);
    if(senderSocketId)
    {
        io.to(senderSocketId).emit('dms to user', newMessage, currentRecipientUser);//only rebroadcast to the user that was dm
        console.log("sent to sender socket with msg", newMessage, currentRecipientUser);
    }
    else
    {
      console.log("sender socket id does not exist");
    }
  

    if(recipientSocketId && userName != currentRecipientUser)
    {
      io.to(recipientSocketId).emit('dms to user', newMessage, userName);//only rebroadcast to the user that was dm
      console.log("sent to recipient socket with msg", newMessage, userName);
    }
    else
    {
      console.log("recipient socket id does not exist or sending to yourself");
    }

  });


  socket.on('modify channel message', async (messageId, visibility)=>{
    let adminRole = await isAdminCheck(socket.request.session.user);
    if(!adminRole)
    {
      console.log("can't modify channel. not admin");
      return
    }

    let messageToDelete=await deleteMessageInDatabase(messageId, visibility);
      io.emit('modify channel message', messageToDelete, visibility);
      console.log("deleting msg! ", JSON.stringify(messageToDelete))
  })
  socket.on('channel invite', async(userToInvite, inviteToChannel)=>{
    console.log('user got invited');
    let userName= await User.findOne({username:userToInvite});
    let userSession=socket.request.session.user;
    if(userName)
    {
      let channel=await Channel.findOneAndUpdate({channelName:inviteToChannel, users:userSession}, {$push: {users:userToInvite}},{new:true});//new:true, means it gives the updated object
      socket.emit('channel invite', channel, true);//if user exist, we can invite them to the channel
    }
    else{
      socket.emit('channel invite', null, false);//null because we didn't get to send the channel
    }
  })
  socket.on('channel leave', async(leaveCurrentChannel)=>{//leaving channel
    console.log('user has left');
    let userSession=socket.request.session.user;
    let channel=await Channel.findOneAndUpdate({channelName:leaveCurrentChannel, users:userSession}, {$pull: {users:userSession}},{new:true});
    socket.emit('channel leave', true);//userSession: leaving the user himself from channel
  })
  socket.on('disconnect', async ()=>{//sprint 3 feature
    console.log('got disconnect');
    let userName=socket.request.session.user;
   // delete usersocketmap[userName];
    let activeStatus="offline";
    let currentTime=new Date();//the now time/current time the user log off
    let user=await User.findOneAndUpdate({username:userName},{userStatus:activeStatus, lastActivateAt:currentTime},{new:true});//new: true, means it gives the updated object
    console.log(user, "this is the disconnect mode");
    io.emit('user status', user);
  })
});

//=====================
// START SERVER LISTENER
//=====================
let port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log("Server Has Started!");
});
