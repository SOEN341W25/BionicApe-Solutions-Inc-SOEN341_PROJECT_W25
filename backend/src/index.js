import express  from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js"
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);


app.listen(3000, ()=>{
    console.log("server is running on 3000");
    connectDB();
});