const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

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

      // Alıcıya okunmamış mesaj sayısını güncelle
      try {
        const Conversation = require("./models/Conversation");
        const Message = require("./models/Message");

        const conversations = await Conversation.find({ users: receiverId });
        const conversationIds = conversations.map((conv) => conv._id);

        const unreadCount = await Message.countDocuments({
          conversation: { $in: conversationIds },
          receiver: receiverId,
          seenAt: null,
        });

        io.to(receiverSocketId).emit("unread_count_update", {
          unreadCount,
          userId: receiverId,
        });
      } catch (error) {
        console.error("Unread count update error:", error);
      }
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

  // Mesajları görüldü olarak işaretle
  socket.on("mark_messages_seen", async (data) => {
    const { userId, conversationId } = data;

    try {
      // Conversation'daki diğer kullanıcıyı bul
      const Conversation = require("./models/Conversation");
      const conversation = await Conversation.findById(conversationId);

      if (conversation) {
        const otherUserId = conversation.users.find(
          (id) => id.toString() !== userId
        );

        if (otherUserId) {
          // Diğer kullanıcının socket ID'sini bul
          const otherUserSocketId = connectedUsers.get(otherUserId.toString());

          if (otherUserSocketId) {
            // Diğer kullanıcıya mesajların görüldüğünü bildir
            io.to(otherUserSocketId).emit("messages_seen", {
              conversationId,
              seenBy: userId,
              timestamp: new Date(),
            });

            // Diğer kullanıcıya okunmamış mesaj sayısını güncelle
            const conversations = await Conversation.find({
              users: otherUserId,
            });
            const conversationIds = conversations.map((conv) => conv._id);

            const Message = require("./models/Message");
            const unreadCount = await Message.countDocuments({
              conversation: { $in: conversationIds },
              receiver: otherUserId,
              seenAt: null,
            });

            io.to(otherUserSocketId).emit("unread_count_update", {
              unreadCount,
              userId: otherUserId,
            });
          }
        }
      }
    } catch (error) {
      console.error("Mark messages seen error:", error);
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
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Socket.io server aktif`);
});
