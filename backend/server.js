const express = require("express");

const dotenv = require("dotenv");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const exploreRoutes = require("./routes/exploreRoutes");

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Uploads klasörünü oluştur
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log("File upload attempt:", file.originalname, file.mimetype);
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Sadece resim ve video dosyaları yüklenebilir!"), false);
    }
  },
  limits: {
    fileSize: 300 * 1024 * 1024, // 100MB
  },
});

// Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer middleware'ini global olarak ekle
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

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
app.use("/api/explore", exploreRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Socket.io server aktif`);
});
