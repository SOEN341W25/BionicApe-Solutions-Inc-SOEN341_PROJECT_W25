const request = require('supertest');
const { app, server } = require('../../app');
const User = require('../model/User');
const Message = require('../model/Message');
const Channel = require('../model/Channel');

describe('User API', () => {

    beforeEach(async () => {
        await User.create({     
            username: "testuser",
            password: "testpassword",
            role: "NormalUser",
            channels: ["TestChannel"],
            userDMs: [{
                recipientUser: "testuser2",
                messageIds:[]
            }],    
            userStatus: "online",        
            lastActivateAt: new Date()
        });
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    test('Get all users', async () => {
        await app.get('/api/user', function(req, res) { //const res = 
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    test('Get user by username', async () => {
        app.get('/api/user/getuser/testuser', function(req, res) {
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username', 'testuser');
        });
    });
});

describe('Message API', () => {

    beforeEach(async () => {
        await Message.create({ 
            messageId: 0,
            msg: 'Hello', 
            visible: true, 
            username: 'testuser' });
    });

    afterEach(async () => {
        await Message.deleteMany({});
    });

    test('Send a message to a channel', async () => {
        app.post('/api/channel/TestChannel/message', function(req, res) {
            expect(res.status).toBe(200);
        });
    });
});

describe('Channel API', () => {

    beforeEach(async () => {
        await Channel.create({ 
            channelName: 'TestChannel', 
            messageIds: [],
            users: [],
            public: true });
    });

    test('Get all channels', async () => {
        app.get('/api/channel', function(req, res) {
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    test('Create new channel', async () => {
        app.post('/api/channel', function(req, res) {
            expect(res.status).toBe(200);
            expect(res.body.channelName).toBe('TestChannel');
        });
    });
});
