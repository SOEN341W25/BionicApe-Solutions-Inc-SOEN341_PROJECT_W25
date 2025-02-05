// Filename - App.js (server)

//=====================
// REQUIRES (INCLUDES)
//=====================
const express = require("express");
const session =require('express-session');//routing api library
const path=require('path');//include path library for combining path together

require('./database/db');   
const User = require("./model/User");
const Channel = require("./model/Channel");
const bcrypt = require("bcrypt");
//============================
//SETUP EXPRESS
//============================

let app = express();

//Set up static file serving
app.use(express.static(path.join(__dirname,'public')));

app.set("view engine", "ejs");//setup view engine ejs
app.set('views', path.join(__dirname, 'views'));
var bodyParser=require('body-parser')//support data payload for post requests
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));


//====================
//SETUP USER SESSION MIDDLEWARE
//====================
app.use(session({
  secret: 'chathaven-key',
  resave:false,
  saveUninitialized: true
}));

//=====================
// MAIN PAGE ROUTES
//=====================

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
  res.render("secret");
});

app.get("/adminPage", isLoggedIn, async function (req, res) {
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




//=====================
// REST API FOR DATA
//=====================

//HTTP FOR USER
app.get("/api/user/:username", async function (req, res){
  user=await User.findOne({username: req.params.username});
  res.status(200).json(user);
});

app.get("/api/user", async function (req,res){
  users=await User.find({});
  res.status(200).json(users);

});

//HTTP FOR CHANNEL
//This one retrieves single channel by channel name
app.get("/api/channel/:channelName",async function (req, res){
  channel=await Channel.findOne({channelName: req.params.channelName});
  res.status(200).json(channel);
});
//This one gets all channels (good for admin)
app.get("/api/channel", async function (req,res){
  channels=await Channel.find({});
  res.status(200).json(channels);
});
//This gets all channels by username (good for users)
app.get("/api/channel/user/:username", async function(req, res){
  channels=await Channel.find({users:req.params.username});
  res.status(200).json(channels);
});

//This one creates a channel by username (good for admin page)
app.post("/api/channel", async function (req, res){
  console.log("Inside post channel"+req.body.channelName);
  const channel = await Channel.findOne({channelName: req.body.channelName});
if(!channel)
{
  const newChannel = await Channel.create({
    channelName: req.body.channelName
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
  channel=await Channel.findOneAndUpdate({channelName: req.params.channelName},{users:req.body.users});
  res.status(200).json(channel);
});
//This one deletes the channel by channel name
app.delete("/api/channel/:channelName", async function (req, res){
  channel=await Channel.deleteOne({channelName: req.params.channelName});
  res.status(200).json(channel);
});











//=====================
// AUTHENTICATE PAGE ROUTES
//=====================

// Showing home page
app.get("", function (req, res) {
  res.render("home");
});

// Showing register form
app.get("/register", function (req, res) {
res.render("register");
});

//Showing login form
app.get("/login", function (req, res) {
  res.render("login");
});

//Handling user logout 
app.get("/logout", function (req, res) {
  console.log("Current session destroyed: "+ req.session.user)
  req.session.destroy()//to destroy the whole session
  res.redirect('/');

});

// Handling user signup
app.post('/register', async (req, res) => {
  const existingUsername = await User.findOne({username: req.body.username});
  if (existingUsername) {
    return res.status(400).render("signup", { error: "Username already exists. Please try a different username." });
  }

  // Check if the user is trying to register as an admin
  const isAdmin = isAdminCheckbox === 'on'; // Checkbox value is 'on' when checked

  // Validate admin password if the user claims to be an admin
  if (isAdmin) {
      const correctAdminPassword = "PETERGRIFFIN2025";
      if (admin_pass !== correctAdminPassword) {
          // If the admin password is incorrect, render the register page with an error message
          return res.status(400).render('register', { error: "Incorrect admin password. Please try again." });
      }
  }

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
          res.status(200).json({status:"Logged in"})// ask user to change html page
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


//Function used to check if session is still valid
function isLoggedIn(req, res, next) {
  const sessionUser=req.session.user || 'No session set';
  if(req.session.user){
    console.log("Current session variable: "+sessionUser)
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

//=====================
// START SERVER LISTENER
//=====================
let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});
