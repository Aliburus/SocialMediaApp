const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const postRoutes = require("./routes/postRoutes");

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

connectDB();

// Socket.io bağlantı yönetimi
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("Kullanıcı bağlandı:", socket.id);

  // Kullanıcı giriş yaptığında
  socket.on("user_login", (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`Kullanıcı ${userId} giriş yaptı`);
  });

  // Mesaj gönderme
  socket.on("send_message", async (data) => {
    const { senderId, receiverId, text, conversationId } = data;

    // Alıcının socket ID'sini bul
    const receiverSocketId = connectedUsers.get(receiverId);

    if (receiverSocketId) {
      // Alıcıya mesajı gönder
      io.to(receiverSocketId).emit("new_message", {
        senderId,
        text,
        conversationId,
        timestamp: new Date(),
      });
    }

    // Gönderen kişiye de mesajı geri gönder (onay için)
    socket.emit("message_sent", {
      senderId,
      receiverId,
      text,
      conversationId,
      timestamp: new Date(),
    });
  });

  // Yazıyor... durumu
  socket.on("typing_start", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_typing", { senderId });
    }
  });

  socket.on("typing_stop", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_stopped_typing", { senderId });
    }
  });

  // Bağlantı koptuğunda
  socket.on("disconnect", () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`Kullanıcı ${socket.userId} çıktı`);
    }
    console.log("Kullanıcı bağlantısı koptu:", socket.id);
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Socket.io server aktif`);
});
