const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); 
const path = require('path');

const conversationRoute = require("./routes/conversation");
const messageRoute = require("./routes/message");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const port = process.env.PORT || 3000;

const uri = "mongodb+srv://islemgharbi:sloma28302380@cluster0.m0nfpub.mongodb.net/messenger?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB database'))
  .catch(error => console.error('MongoDB connection error:', error));

app.use(express.json());  // Middleware to parse JSON request bodies
app.use(cors({
  origin: "http://localhost:4200", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute(io));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

let onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('userId', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys())); // Notify all clients of the new online users list
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys())); // Notify all clients of the updated online users list
    console.log('A user disconnected');
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data); 
   
  });

  socket.on('stopTyping', (data) => {
    socket.broadcast.emit('stopTyping', data);  // Notify other clients that this user stopped typing
  });

  socket.on('sendMessage', (message) => {
    io.emit('receiveMessage', message);  // Broadcast the message to all connected clients
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
