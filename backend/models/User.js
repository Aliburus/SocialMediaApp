const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmRLRMXynnc7D6-xfdpeaoEUeon2FaU0XtPg&s",
    },
    bio: { type: String, default: "" },
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingFollowRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    sentFollowRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notifications: [
      {
        type: {
          type: String,
          enum: ["follow", "like", "comment"],
          required: true,
        },
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
    notificationSettings: {
      push: { type: Boolean, default: true },
      comment: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
