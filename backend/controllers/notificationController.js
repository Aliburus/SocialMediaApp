const Notification = require("../models/Notification");
const User = require("../models/User");

// Bildirim oluşturma fonksiyonu
const createOrUpdateNotification = async (
  recipientId,
  senderId,
  type,
  postId = null,
  commentId = null
) => {
  try {
    console.log(`[createOrUpdateNotification] Başlatılıyor:`, {
      recipientId,
      senderId,
      type,
      postId,
      commentId,
    });

    // Parametreleri kontrol et
    if (!recipientId || !senderId || !type) {
      console.log(`[createOrUpdateNotification] Eksik parametreler`);
      return null;
    }

    // String'leri ObjectId'ye çevir
    const recipientIdObj =
      typeof recipientId === "string" ? recipientId : recipientId.toString();
    const senderIdObj =
      typeof senderId === "string" ? senderId : senderId.toString();

    // Kendi kendine bildirim oluşturmasın
    if (recipientIdObj === senderIdObj) {
      console.log(
        `[createOrUpdateNotification] Kendi kendine bildirim oluşturulmaya çalışılıyor`
      );
      return null;
    }

    let groupId = null;
    if (type === "like" && postId) {
      groupId = `post_like_${postId}`;
    } else if (type === "like" && commentId) {
      groupId = `comment_like_${commentId}`;
    }

    if (groupId) {
      // Mevcut grup bildirimini bul
      let existingNotification = await Notification.findOne({
        groupId,
        recipient: recipientIdObj,
        type,
      }).populate("recentUsers", "username avatar");

      if (existingNotification) {
        // Sender zaten var mı kontrol et
        const senderExists = existingNotification.recentUsers.some(
          (user) => user._id.toString() === senderIdObj
        );

        if (!senderExists) {
          // Yeni kullanıcı ekle
          existingNotification.recentUsers.unshift(senderIdObj);

          // Sadece son 3 kullanıcıyı tut
          if (existingNotification.recentUsers.length > 3) {
            existingNotification.recentUsers =
              existingNotification.recentUsers.slice(0, 3);
          }

          existingNotification.totalCount += 1;
          existingNotification.isRead = false;
          await existingNotification.save();
        }
        return existingNotification;
      } else {
        // Yeni grup bildirimi oluştur
        const sender = await User.findById(senderIdObj).select(
          "username avatar"
        );
        const newNotification = new Notification({
          recipient: recipientIdObj,
          sender: senderIdObj,
          type,
          post: postId,
          comment: commentId,
          groupId,
          recentUsers: [senderIdObj],
          totalCount: 1,
        });
        await newNotification.save();
        console.log(
          `[createOrUpdateNotification] Yeni bildirim oluşturuldu:`,
          newNotification._id
        );
        return newNotification;
      }
    } else {
      // Normal bildirim oluştur
      const newNotification = new Notification({
        recipient: recipientIdObj,
        sender: senderIdObj,
        type,
        post: postId,
        comment: commentId,
      });
      await newNotification.save();
      console.log(
        `[createOrUpdateNotification] Yeni bildirim oluşturuldu:`,
        newNotification._id
      );
      return newNotification;
    }
  } catch (error) {
    console.error("Bildirim oluşturma hatası:", error);
  }
};

// Bildirimleri getir
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    // userId'yi ObjectId'ye çevir
    const mongoose = require("mongoose");
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? userId : null;

    if (!userIdObj) {
      return res.json([]);
    }

    // Kullanıcıyı da getir (pendingFollowRequests için)
    const user = await User.findById(userIdObj).select(
      "pendingFollowRequests followers"
    );

    const notifications = await Notification.find({ recipient: userIdObj })
      .populate("sender", "username avatar")
      .populate("recentUsers", "username avatar")
      .populate("post", "image description user")
      .populate("comment", "text")
      .sort({ createdAt: -1 })
      .limit(50);

    // Bildirimleri formatla
    const formattedNotifications = notifications.map((notification) => {
      const baseNotification = {
        id: notification._id,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        timestamp: formatTimestamp(notification.createdAt),
      };

      if (notification.groupId && notification.recentUsers.length > 0) {
        // Grup bildirimi
        const userNames = notification.recentUsers.map((user) => user.username);
        let message = "";

        if (notification.type === "like" && notification.post) {
          if (notification.totalCount === 1) {
            message = `${userNames[0]} gönderini beğendi`;
          } else if (notification.totalCount === 2) {
            message = `${userNames[0]} ve ${userNames[1]} gönderini beğendi`;
          } else if (notification.totalCount === 3) {
            message = `${userNames[0]}, ${userNames[1]} ve ${userNames[2]} gönderini beğendi`;
          } else {
            message = `${userNames[0]}, ${userNames[1]} ve ${
              notification.totalCount - 2
            } kişi daha gönderini beğendi`;
          }
        } else if (notification.type === "like" && notification.comment) {
          if (notification.totalCount === 1) {
            message = `${userNames[0]} yorumunu beğendi`;
          } else if (notification.totalCount === 2) {
            message = `${userNames[0]} ve ${userNames[1]} yorumunu beğendi`;
          } else if (notification.totalCount === 3) {
            message = `${userNames[0]}, ${userNames[1]} ve ${userNames[2]} yorumunu beğendi`;
          } else {
            message = `${userNames[0]}, ${userNames[1]} ve ${
              notification.totalCount - 2
            } kişi daha yorumunu beğendi`;
          }
        }

        return {
          ...baseNotification,
          text: message,
          users: notification.recentUsers,
          totalCount: notification.totalCount,
          post: notification.post,
          comment: notification.comment,
        };
      } else {
        // Normal bildirim
        let message = "";
        switch (notification.type) {
          case "like":
            if (notification.post) {
              message = `${notification.sender.username} gönderini beğendi`;
            } else if (notification.comment) {
              message = `${notification.sender.username} yorumunu beğendi`;
            }
            break;
          case "comment":
            message = `${notification.sender.username} gönderine yorum yaptı`;
            break;
          case "follow":
            message = `${notification.sender.username} seni takip etmeye başladı`;
            break;
          case "follow_request":
            message = `${notification.sender.username} seni takip etmek istiyor`;
            break;
          case "mention":
            message = `${notification.sender.username} seni etiketledi`;
            break;
        }

        // Takip istekleri için status belirle
        let status;
        if (
          notification.type === "follow" ||
          notification.type === "follow_request"
        ) {
          if (
            user.pendingFollowRequests
              .map((id) => id.toString())
              .includes(notification.sender._id.toString())
          ) {
            status = "pending";
          } else if (
            user.followers
              .map((id) => id.toString())
              .includes(notification.sender._id.toString())
          ) {
            status = "accepted";
          }
        }

        return {
          ...baseNotification,
          text: message,
          user: notification.sender,
          post: notification.post,
          comment: notification.comment,
          status,
        };
      }
    });

    res.json(formattedNotifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bildirimler getirilemedi", error: error.message });
  }
};

// Bildirimi okundu olarak işaretle
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ message: "Bildirim okundu olarak işaretlendi" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bildirim güncellenemedi", error: error.message });
  }
};

// Tüm bildirimleri okundu olarak işaretle
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Tüm bildirimler okundu olarak işaretlendi" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bildirimler güncellenemedi", error: error.message });
  }
};

// Bildirimi sil
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: "Bildirim silindi" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bildirim silinemedi", error: error.message });
  }
};

// Zaman formatı
const formatTimestamp = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // saniye

  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} gün önce`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} ay önce`;
  return `${Math.floor(diff / 31536000)} yıl önce`;
};

// Okunmamış bildirim sayısını getir
exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "Kullanıcı ID gerekli" });
    }
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    res.json({ unreadCount, userId });
  } catch (err) {
    console.error("Get unread notification count error:", err);
    res.status(500).json({
      message: "Okunmamış bildirim sayısı getirilemedi",
      error: err.message,
    });
  }
};

// Dışa aktar
exports.createOrUpdateNotification = createOrUpdateNotification;
