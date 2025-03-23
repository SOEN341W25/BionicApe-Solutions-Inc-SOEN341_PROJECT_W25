const mongoose = require('mongoose');

beforeAll(async () => {
    // await mongoose.connect('mongodb://localhost:27017/testdb', {
    //     useNewUrlParser: true, 
    //     useUnifiedTopology: true
    // });
    console.log("connect to db");
});

afterAll(async () => {
    // await mongoose.connection.dropDatabase();
    // await mongoose.connection.close();
    console.log("disconnect from db");
});
