// BACKEND_/tests/mongo-memory-server-mock.js
const MockMongoServer = {
  instance: null,
  
  async start() {
    console.log('Mock MongoDB server started');
    this.instance = {
      getUri: () => 'mongodb://localhost:27017/test-db',
      stop: () => Promise.resolve()
    };
    return this.instance;
  },
  
  getUri() {
    return 'mongodb://localhost:27017/test-db';
  },
  
  async stop() {
    console.log('Mock MongoDB server stopped');
    return Promise.resolve();
  }
};

module.exports = {
  MongoMemoryServer: {
    create: async () => {
      await MockMongoServer.start();
      return MockMongoServer;
    }
  }
};
