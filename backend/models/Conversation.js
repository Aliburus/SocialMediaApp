const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

// Performans için index'ler
conversationSchema.index({ users: 1 }); // Kullanıcı conversation'ları için
conversationSchema.index({ updatedAt: -1 }); // Tarih sıralaması için

module.exports = mongoose.model("Conversation", conversationSchema);
