const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  trackUserBehavior,
  getExploreFeed,
  submitFeedback,
} = require("../controllers/exploreController");

// Keşfet feed'ini getir
router.get("/feed", authenticateToken, getExploreFeed);

// Kullanıcı davranışını kaydet
router.post("/track", authenticateToken, trackUserBehavior);

// Kullanıcı geri bildirimi
router.post("/feedback", authenticateToken, submitFeedback);

module.exports = router;
