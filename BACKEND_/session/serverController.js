const session =require('express-session');//routing api library

const sessionMiddleware = session({
    secret: 'chathaven-key',
    resave:false,
    saveUninitialized: true
  })

  //
  const wrap= expressMiddleware =>(socket, next)=>
    expressMiddleware(socket.request, {}, next);

  module.exports ={sessionMiddleware, wrap};
