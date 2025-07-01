const express = require("express");
const router = express.Router();
const {
  register,
  login,
  updateProfile,
  getProfile,
  savePost,
  getSavedPosts,
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

module.exports = router;
