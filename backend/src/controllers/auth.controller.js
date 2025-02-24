import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  //checking if its an existing username
  const { username, password, isAdminCheckbox, admin_pass } = req.body;
  const existingUsername = await User.findOne({ username: req.body.username });
  if (existingUsername) {
    return res.status(400).render("signup", {
      error: "Username already exists. Please try a different username.",
    });
  }

  // Check if the user is trying to register as an admin
  const isAdmin = isAdminCheckbox === "on"; // Checkbox value is 'on' when checked
  console.log(isAdminCheckbox);
  // Validate admin password if the user claims to be an admin
  if (isAdmin) {
    const correctAdminPassword = "PETERGRIFFIN2025";
    if (admin_pass !== correctAdminPassword) {
      // If the admin password is incorrect, render the register page with an error message
      return res.status(400).render("register", {
        error: "Incorrect admin password. Please try again.",
      });
    }
  }
  console.log(isAdmin);

  //hashing the password for security reasons
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //creating new user
  try {
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: isAdmin ? "Admin" : "NormalUser", // Set role based on admin status
      channels: ["HomeChannel", "ApeChannel"],
    });

    if (newUser) {
      //generate  JWT token
      generateToken(newUser._id, res);
      await newUser.save();
      res
        .status(201)
        .json({ message: "User created, please log in", redirect: "/login" });
    } else {
      res.status(400).json({ message: "invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render("register", {
      error: "An error occurred during registration. Please try again.",
    });
  }
};

export const login = async(req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: req.body.username });
    if(!user){
        return res.status(400).json({message:"Invalid credentials"})
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if(!isPasswordCorrect){
        return res.status(400).json({message:"Invalid credentials"})
    }

    generateToken(user._id, res)

    res.redirect("/channels");

  } catch (error) {
    console.log("error in login controller", error.message);
    res.status(500).json({message:"internal server error"});

  }
};

export const logout = (req, res) => {
  try{
    res.cookie("jwt", "", {maxAge:0});//immediately finished the session
    res.status(200).json({ message: "log out successful"});
  }catch(error){
    console.log("error in logout controller", error.message);
    res.status(500).json({message: "Internal server error in logout controller"});
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};