import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import getUserRoutes from "./Routes/userRouter";
import getProductRoutes from "./Routes/productRouter";
import initializeDBConnection from "./Config/db";
import cors from "cors";
// import socketIo from './Middleware/socket';
import formatMessage from "./Utils/formatMessage";
import {chatModal} from "./Modal/chatsModal";
import userModal from './Modal/userModal';
import onlineUserModal from "./Modal/onlineUserModal";
const app = express();
const PORT = process.env.PORT || 9000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ credentials: true, origin: true }));
const router = express.Router();

app.use("/user", getUserRoutes(router));
app.use("/product", getProductRoutes(router));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  console.log("New User Logged In with ID " + socket.id);
  //Collect message and insert into database
  
  socket.on("chatMessage", async (data) => {
    //recieves message from client-end along with sender's and reciever's details
    const dataElement = formatMessage(data);
    const chatRes = await chatModal.create(dataElement);
    const fromUser = await userModal.findOne({email: data.fromUser}).populate({ path: 'followers.user', model: 'user'});
    const toUser = await userModal.findOne({email: data.toUser}).populate({ path: 'following.user', model: 'user'});
    const fromIndex = fromUser.followers.findIndex(({user}) => user.email === data.toUser);
    const toIndex =  toUser.following.findIndex(({user}) => user.email === data.fromUser)

    if(fromUser?.followers.length > 0 && fromIndex >= 0){
      fromUser?.followers[fromIndex].message.push(chatRes);
    } else if (fromUser?.followers.length === 0 && fromIndex < 0){
      const user = {
        user: toUser._id,
        message: [chatRes]
      };
      fromUser?.followers.push(user);
    }
    if(toUser?.following.length > 0 && toIndex >=0 ){
      chatRes.unread = false;
      toUser?.following[toIndex].message.push(chatRes);
    } else if(toUser?.following.length === 0 && toIndex < 0){
      const user = {
        user: fromUser._id,
        message: [chatRes]
      }
      toUser?.following.push(user);
    }
    await fromUser.save();
    await toUser.save();
    if(chatRes){
      socket.emit("message", dataElement)
    }
    const onlieUser = await onlineUserModal.findOne({ name: data.toUser });
    if (onlieUser){
      socket.to(onlieUser.ID).emit("message", dataElement);
    }
  console.log("onlineUser",onlieUser)
  });

  socket.on("userDetails", async (data) => {
    //checks if a new user has logged in and recieves the established chat details
    const onlineUser = {
      //forms JSON object for the user details
      ID: socket.id,
      name: data.fromUser,
    };
    await onlineUserModal.create(onlineUser, (err, res) => {
      //inserts the logged in user to the collection of online users
      if (err) throw err;
      console.log(onlineUser.name + " is online...");
    });

    const chat = await chatModal
      .find(
        {
          //finds the entire chat history between the two people
          from: { $in: [data.fromUser, data.toUser] },
          to: { $in: [data.fromUser, data.toUser] },
        },
        { projection: { _id: 0 } }
      )
      if(chat){
        socket.emit("output", chat);
      }
  });
  const userID = socket.id;
  socket.on("disconnect", async () => {
    const myquery = { ID: userID };
    await onlineUserModal.deleteOne(myquery).then((err, res) => {
      //if a user has disconnected, he/she is removed from the online users' collection
      if (err) throw err;
      console.log("User " + userID + "went offline...");
    });
  });
});

server.listen(PORT, async () => {
  try {
    console.log(`Node server started ${PORT}`);
    await initializeDBConnection();
  } catch (err) {
    console.error(err);
  }
});
