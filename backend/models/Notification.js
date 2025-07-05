const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "mention"],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Grup bildirimleri için
    groupId: {
      type: String, // "post_like_123" veya "comment_like_456" formatında
    },
    // Son 3 kullanıcının bilgileri
    recentUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Toplam beğeni sayısı
    totalCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Grup ID oluşturma için index
notificationSchema.index({ groupId: 1, recipient: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
