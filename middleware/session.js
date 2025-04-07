const session = require('express-session');

const sessionMiddleware = session({
    secret: 'chathaven-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

// Wrap express middleware for socket.io
const wrap = middleware => (socket, next) => 
    middleware(socket.request, {}, next);

module.exports = { sessionMiddleware, wrap };
