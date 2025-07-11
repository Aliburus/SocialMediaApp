const express = require("express");
const router = express.Router();
const path = require("path");
const {
  register,
  login,
  updateProfile,
  getProfile,
  savePost,
  getSavedPosts,
  followUser,
  unfollowUser,
  searchUsers,
  sendFollowRequest,
  cancelFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsSeen,
  getUnreadMessageCount,
  getUserFriends,
  changePassword,
  getNotificationSettings,
  updateNotificationSettings,
  togglePrivateAccount,
  deleteConversation,
} = require("../controllers/userController");
const storyController = require("../controllers/storyController");

router.post("/register", register);
router.post("/login", login);
router.post(
  "/update-profile",
  (req, res, next) => {
    req.upload.single("avatar")(req, res, next);
  },
  updateProfile
);
router.get("/profile/:userId", getProfile);
router.post(
  "/stories",
  (req, res, next) => {
    req.upload.single("media")(req, res, next);
  },
  storyController.createStory
);
router.get("/stories", storyController.getAllStories);
router.post("/stories/:id/view", storyController.viewStory);
router.delete("/stories/:id", storyController.deleteStory);
router.post("/stories/:id/archive", storyController.archiveStory);
router.post("/stories/:id/unarchive", storyController.unarchiveStory);
router.get("/stories/archived/:userId", storyController.getArchivedStories);
router.get("/stories/stats/:userId", storyController.getStoryStats);
router.post("/save", savePost);
router.get("/saved/:userId", getSavedPosts);
router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);
router.get("/search", searchUsers);
router.post("/send-follow-request", sendFollowRequest);
router.post("/cancel-follow-request", cancelFollowRequest);
router.post("/accept-follow-request", acceptFollowRequest);
router.post("/reject-follow-request", rejectFollowRequest);
router.get("/:userId/conversations", getUserConversations);
router.get("/:userId/friends", getUserFriends);
router.get(
  "/:userId/conversations/:otherUserId/messages",
  getConversationMessages
);
router.post("/send-message", sendMessage);
router.post("/:userId/mark-messages-seen", markMessagesAsSeen);
router.get("/:userId/unread-count", getUnreadMessageCount);
router.post("/change-password", changePassword);
router.get("/:userId/notification-settings", getNotificationSettings);
router.post("/:userId/notification-settings", updateNotificationSettings);
router.put("/:userId/toggle-private", togglePrivateAccount);
router.post("/delete-conversation", deleteConversation);

module.exports = router;
