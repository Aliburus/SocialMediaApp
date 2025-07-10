const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  image: { type: String },
  description: { type: String, required: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  type: { type: String, enum: ["post", "reel"], default: "post" },
  video: { type: String },
  createdAt: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  archivedAt: { type: Date },
});

module.exports = mongoose.model("Post", PostSchema);
