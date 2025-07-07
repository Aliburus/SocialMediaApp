const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    seenAt: { type: Date, default: null },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  },
  { timestamps: true }
);

// Performans için index'ler
messageSchema.index({ createdAt: -1 }); // Tarih sıralaması için

module.exports = mongoose.model("Message", messageSchema);
