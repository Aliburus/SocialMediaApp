const express = require("express");
const router = express.Router();
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
  getNotifications,
  acceptFollowRequest,
  rejectFollowRequest,
} = require("../controllers/userController");
const storyController = require("../controllers/storyController");

router.post("/register", register);
router.post("/login", login);
router.post("/update-profile", updateProfile);
router.get("/profile/:userId", getProfile);
router.post("/stories", storyController.createStory);
router.get("/stories", storyController.getAllStories);
router.post("/stories/:id/view", storyController.viewStory);
router.post("/save", savePost);
router.get("/saved/:userId", getSavedPosts);
router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);
router.get("/search", searchUsers);
router.post("/send-follow-request", sendFollowRequest);
router.post("/cancel-follow-request", cancelFollowRequest);
router.get("/notifications/:userId", getNotifications);
router.post("/accept-follow-request", acceptFollowRequest);
router.post("/reject-follow-request", rejectFollowRequest);

module.exports = router;
