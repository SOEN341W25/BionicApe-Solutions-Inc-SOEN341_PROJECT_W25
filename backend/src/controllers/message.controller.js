import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserID = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserID },
    }).select("-password"); //find all users except the one that is logged in
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getMessages = async (req, res) => {
    try {
      const { id: userToChatId } = req.params; //gets the id of the person that is going to chat
      const myId = req.user._id;//id of person sending
  
      const messages = await Message.find({//getting the emssages from the database
        $or: [
          { senderId: myId, receiverId: userToChatId },//one or the other (vice versa)
          { senderId: userToChatId, receiverId: myId },
        ],
      });
  
      res.status(200).json(messages);
    } catch (error) {
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
      const { text } = req.body;// getting text or image that the user will send
      const { id: receiverId } = req.params; //getting the id of the person we dont like  
      const senderId = req.user._id;
  
    
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
      });
  
      await newMessage.save();
  
      //to do: realtime functionality where you can see the emssages in real time using socket.io to do here
  
      res.status(201).json(newMessage);
    } catch (error) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
