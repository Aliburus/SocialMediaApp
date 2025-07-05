const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    read: { type: Boolean, default: false },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    story: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
