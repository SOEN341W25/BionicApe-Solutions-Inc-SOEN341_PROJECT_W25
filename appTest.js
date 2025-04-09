// Main application entry point
 const express = require("express");
 const path = require('path');
 const { createServer } = require('node:http');
 const { Server } = require('socket.io');
 const bodyParser = require('body-parser');
 const mongoose = require('mongoose');
 const Sentiment = require('sentiment');
 
 // Import middleware
 const { sessionMiddleware, wrap } = require("./middleware/session");
 
 // Import database connection
 require('./utils/db');
 
 // Import routes
 const authRoutes = require('./routes/auth');
 const userRoutes = require('./routes/user');
 const channelRoutes = require('./routes/channel');
 const messageRoutes = require('./routes/message');
 
 // Import socket handlers
 const setupSocketHandlers = require('./utils/socketHandlers');
 
 // Initialize app and server
 const app = express();
 const server = createServer(app);
 const io = new Server(server);
 const sentiment = new Sentiment();
 
 // Set up middleware
 app.use(express.static(path.join(__dirname, 'public')));
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: true }));
 app.set("view engine", "ejs");
 app.set('views', path.join(__dirname, 'views'));
 
 // Set up session
 app.use(sessionMiddleware);
 io.use(wrap(sessionMiddleware));
 
 // Set up routes
 app.use('/', authRoutes);
 app.use('/api/users', userRoutes);
 app.use('/api/channels', channelRoutes);
 app.use('/api/messages', messageRoutes);
 
 // Set up socket handlers
 setupSocketHandlers(io, sentiment);
 
 // Start server
 const port = process.env.PORT || 3000;
 server.listen(port, function () {
   console.log(`Server has started on port ${port}!`);
 });
 
 module.exports = { app, server };
