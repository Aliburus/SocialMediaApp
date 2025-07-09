const mongoose = require("mongoose");

const userBehaviorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    behaviorType: {
      type: String,
      enum: [
        "like",
        "comment",
        "save",
        "view",
        "profile_visit",
        "story_view",
        "search",
        "follow",
      ],
      required: true,
    },
    weight: { type: Number, default: 1.0 },
    duration: { type: Number, default: 0 }, // Görüntüleme süresi (saniye)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index'ler performans için
userBehaviorSchema.index({ userId: 1, timestamp: -1 });
userBehaviorSchema.index({ contentId: 1, behaviorType: 1 });
userBehaviorSchema.index({ userId: 1, behaviorType: 1, timestamp: -1 });

module.exports = mongoose.model("UserBehavior", userBehaviorSchema);
