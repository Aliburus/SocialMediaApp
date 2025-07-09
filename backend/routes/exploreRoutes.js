const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  trackUserBehavior,
  getExploreFeed,
  submitFeedback,
} = require("../controllers/exploreController");
const rateLimit = require("../middleware/rateLimit");
const antiSpam = require("../middleware/antiSpam");

// Keşfet feed'ini getir
router.get("/feed", authenticateToken, getExploreFeed);

// Kullanıcı davranışını kaydet
router.post(
  "/track",
  authenticateToken,
  rateLimit,
  antiSpam,
  trackUserBehavior
);

// Kullanıcı geri bildirimi
router.post(
  "/feedback",
  authenticateToken,
  rateLimit,
  antiSpam,
  submitFeedback
);

module.exports = router;
