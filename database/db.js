const mongoose=require("mongoose");//to use mongoose library to have the function to retrieve the data from the database
const User=require("../model/User"); //similar to include file but simultaneously the class (.h file like cpp)

const MONGO_URI= 'mongodb://localhost:27017/';//url in the database '/db' the database is called db  

//Function to create the default admin user if not exists
async function createDefaultAdmin(){
    try{
        const admin=await User.findOne({username: 'admin'});//if there is one 

        if(!admin){
            //Create new admin if one doesn't exist
            const newAdmin=new User({
                username:'admin',
                password:'admin',
                role: 'admin'
            });
            await newAdmin.save();//save the admin data
            console.log('Default admin user created.');
        }else{
            console.log('Admin user already exists.');
        }
       
    }
    catch(error){
            console.error('Error checking or creating admin user:', error);//error in case something goes wrong
    }
}


mongoose.connect(MONGO_URI,{//URI is an address
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{//when the connection is established, the default admin is created
    console.log('Connected to MongoDB');
    createDefaultAdmin();
})
.catch((error)=>{//if any error in mongodb
    console.error('Error connecting to MongoDB:', error);
});