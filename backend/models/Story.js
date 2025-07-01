const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isViewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
