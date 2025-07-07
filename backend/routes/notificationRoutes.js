const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} = require("../controllers/notificationController");

// Bildirimleri getir
router.get("/:userId", getNotifications);

// Bildirimi okundu olarak işaretle
router.put("/:id/read", markAsRead);

// Tüm bildirimleri okundu olarak işaretle
router.put("/:userId/read-all", markAllAsRead);

// Bildirimi sil
router.delete("/:id", deleteNotification);

router.get("/:userId/unread-count", getUnreadNotificationCount);

module.exports = router;
