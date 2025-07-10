const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String },
    video: { type: String },
    timestamp: { type: Date, default: Date.now },
    isViewed: { type: Boolean, default: false },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
