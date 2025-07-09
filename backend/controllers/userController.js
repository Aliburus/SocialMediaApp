const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createOrUpdateNotification } = require("./notificationController");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../utils/validate");
const Post = require("../models/Post");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Story = require("../models/Story");
const Comment = require("../models/Comment");

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

exports.register = async (req, res) => {
  try {
    const { name, username, email, password, avatar } = req.body;
    const validationError = validateRegisterInput({
      name,
      username,
      email,
      password,
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: "Email zaten kayıtlı" });
    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ message: "Kullanıcı adı zaten kayıtlı" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      avatar: avatar || undefined,
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: "Kayıt başarısız", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    const validationError = validateLoginInput({ emailOrUsername, password });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Şifre hatalı" });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Giriş başarısız", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, username, avatar, bio, privateAccount } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (privateAccount !== undefined)
      updateData.privateAccount = privateAccount;
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser)
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      email: updatedUser.email,
      privateAccount: updatedUser.privateAccount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Profil güncellenemedi", error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.query;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    let isFollowing = false;
    let isFollowedBy = false;
    let isRequestedByMe = false;
    let isRequestedByOther = false;
    if (currentUserId) {
      isFollowing = user.followers
        .map((id) => id.toString())
        .includes(currentUserId.toString());
      isFollowedBy = user.following
        .map((id) => id.toString())
        .includes(currentUserId.toString());
      isRequestedByMe = user.pendingFollowRequests
        .map((id) => id.toString())
        .includes(currentUserId.toString());
      // Benim pending listemde bu user varsa, o bana istek göndermiştir
      const me = await User.findById(currentUserId);
      isRequestedByOther =
        me &&
        me.pendingFollowRequests
          .map((id) => id.toString())
          .includes(userId.toString());
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      email: user.email,
      followers: user.followers,
      following: user.following,
      followersCount: Array.isArray(user.followers) ? user.followers.length : 0,
      followingCount: Array.isArray(user.following) ? user.following.length : 0,
      pendingFollowRequests: user.pendingFollowRequests,
      sentFollowRequests: user.sentFollowRequests,
      privateAccount: user.privateAccount,
      isFollowing,
      isFollowedBy,
      isRequestedByMe,
      isRequestedByOther,
      isPrivate: user.privateAccount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Profil getirilemedi", error: err.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const { userId, postId } = req.body;

    if (!userId || !postId)
      return res.status(400).json({ message: "Eksik veri" });
    const user = await User.findById(userId);
    const post = await Post.findById(postId);
    if (!user || !post)
      return res
        .status(404)
        .json({ message: "Kullanıcı veya post bulunamadı" });

    // User'ın saved dizisi
    const userIndex = user.saved.indexOf(postId);
    if (userIndex === -1) {
      user.saved.push(postId);
    } else {
      user.saved.splice(userIndex, 1);
    }
    // Post'un savedBy dizisi
    const postIndex = post.savedBy.indexOf(userId);
    if (postIndex === -1) {
      post.savedBy.push(userId);
    } else {
      post.savedBy.splice(postIndex, 1);
    }
    await user.save();
    await post.save();

    res.json({ saved: user.saved, savedBy: post.savedBy });
  } catch (err) {
    console.error("[savePost] Hata:", err);
    res
      .status(500)
      .json({ message: "Kaydetme işlemi başarısız", error: err.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "saved",
      populate: { path: "user", select: "_id username avatar" },
    });
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json(user.saved);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Kaydedilenler getirilemedi", error: err.message });
  }
};

// Takip et
exports.followUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    if (!userId || !targetUserId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    if (userId === targetUserId) {
      return res.status(400).json({ message: "Kendini takip edemezsin" });
    }
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (!user.following.includes(targetUserId)) {
      user.following.push(targetUserId);
    }
    if (!targetUser.followers.includes(userId)) {
      targetUser.followers.push(userId);
    }

    // Takip bildirimi gönder
    await createOrUpdateNotification(targetUserId, userId, "follow");

    await user.save();
    await targetUser.save();
    res.json({ following: user.following, followers: targetUser.followers });
  } catch (err) {
    console.error(`[followUser] Hata:`, err);
    res
      .status(500)
      .json({ message: "Takip işlemi başarısız", error: err.message });
  }
};

// Takipten çıkar
exports.unfollowUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    if (userId === targetUserId) {
      return res.status(400).json({ message: "Kendini takipten çıkaramazsın" });
    }
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    user.following = user.following.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== userId
    );
    targetUser.pendingFollowRequests = targetUser.pendingFollowRequests.filter(
      (id) => id.toString() !== userId
    );
    // Bildirimi sil
    await Notification.deleteMany({
      recipient: targetUserId,
      sender: userId,
      type: { $in: ["follow", "follow_request"] },
    });
    await user.save();
    await targetUser.save();
    res.json({ following: user.following, followers: targetUser.followers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takipten çıkarma başarısız", error: err.message });
  }
};

// Username'e göre kullanıcı arama (tüm kullanıcılar içinde)
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json([]);
    // Tüm kullanıcılar içinde username'e göre arama
    const users = await User.find({
      username: { $regex: q, $options: "i" },
    }).select(
      "_id username fullName avatar bio followers following isVerified pendingFollowRequests sentFollowRequests"
    );
    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Kullanıcılar aranamadı", error: err.message });
  }
};

// Takip isteği gönder
exports.sendFollowRequest = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    // Zaten istek varsa tekrar ekleme
    if (!targetUser.pendingFollowRequests.includes(userId)) {
      targetUser.pendingFollowRequests.push(userId);
    }
    if (!user.sentFollowRequests.includes(targetUserId)) {
      user.sentFollowRequests.push(targetUserId);
    }
    await targetUser.save();
    await user.save();
    // Aynı follow_request bildirimi yoksa oluştur
    const existingNotif = await Notification.findOne({
      recipient: targetUserId,
      sender: userId,
      type: "follow_request",
    });
    if (!existingNotif) {
      await createOrUpdateNotification(
        targetUserId,
        userId,
        "follow_request",
        null,
        null
      );
    }
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takip isteği gönderilemedi", error: err.message });
  }
};

// Takip isteğini iptal et
exports.cancelFollowRequest = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    const targetUser = await User.findById(targetUserId);
    const user = await User.findById(userId);
    if (!targetUser || !user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    targetUser.pendingFollowRequests = targetUser.pendingFollowRequests.filter(
      (id) => id.toString() !== userId
    );
    // Bildirimi sil (sadece ilgili follow_request)
    await Notification.deleteMany({
      recipient: targetUserId,
      sender: userId,
      type: "follow_request",
    });
    await targetUser.save();
    user.sentFollowRequests = user.sentFollowRequests.filter(
      (id) => id.toString() !== targetUserId
    );
    await user.save();
    res.json({
      pendingFollowRequests: targetUser.pendingFollowRequests,
      sentFollowRequests: user.sentFollowRequests,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takip isteği iptal edilemedi", error: err.message });
  }
};

// Test endpoint - kullanıcının gizli hesap ayarını değiştir
exports.togglePrivateAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    user.privateAccount = !user.privateAccount;
    await user.save();

    // Veritabanından tekrar kontrol et
    const updatedUser = await User.findById(userId);

    // Profil verisini de kontrol et
    const profileData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      email: updatedUser.email,
      followers: updatedUser.followers,
      following: updatedUser.following,
      followersCount: Array.isArray(updatedUser.followers)
        ? updatedUser.followers.length
        : 0,
      followingCount: Array.isArray(updatedUser.following)
        ? updatedUser.following.length
        : 0,
      pendingFollowRequests: updatedUser.pendingFollowRequests,
      sentFollowRequests: updatedUser.sentFollowRequests,
      privateAccount: updatedUser.privateAccount,
    };

    res.json({
      message: `Hesap ${user.privateAccount ? "gizli" : "açık"} yapıldı`,
      privateAccount: user.privateAccount,
      dbCheck: updatedUser.privateAccount,
      profileData: profileData,
    });
  } catch (err) {
    res.status(500).json({ message: "İşlem başarısız", error: err.message });
  }
};

// Takip isteğini kabul et
exports.acceptFollowRequest = async (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    if (!userId || !requesterId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);
    if (!user || !requester) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    // pendingFollowRequests listesinden çıkar
    user.pendingFollowRequests = user.pendingFollowRequests.filter(
      (id) => id.toString() !== requesterId
    );
    // followers ve following güncelle (idempotent)
    if (!user.followers.includes(requesterId)) {
      user.followers.push(requesterId);
    }
    if (!requester.following.includes(userId)) {
      requester.following.push(userId);
    }
    // user'ın following'inde requesterId varsa ekleme (karşılıklı takip için)
    if (!user.following.includes(requesterId)) {
      // user.following.push(requesterId); // Burası eklenmemeli, sadece karşı taraf takip ediyor
    }
    // requester'ın followers'ında userId varsa ekleme
    if (!requester.followers.includes(userId)) {
      // requester.followers.push(userId); // Burası eklenmemeli, sadece tek taraflı takip
    }
    // requester'ın sentFollowRequests listesinden userId'yi çıkar
    requester.sentFollowRequests = requester.sentFollowRequests.filter(
      (id) => id.toString() !== userId
    );

    // Eski takip isteği bildirimini güncelle (silme)
    await Notification.findOneAndUpdate(
      {
        recipient: userId,
        sender: requesterId,
        type: "follow_request",
      },
      {
        type: "follow",
      },
      { new: true }
    );

    // Takip isteği kabul edildiğinde, isteği atan kişiye bildirim oluştur (her durumda)
    await createOrUpdateNotification(requesterId, userId, "follow", null, null);

    await user.save();
    await requester.save();
    res.json({ followers: user.followers, following: requester.following });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takip isteği kabul edilemedi", error: err.message });
  }
};

// Takip isteğini reddet
exports.rejectFollowRequest = async (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    if (!userId || !requesterId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    user.pendingFollowRequests = user.pendingFollowRequests.filter(
      (id) => id.toString() !== requesterId
    );
    // Bildirimi sil
    await Notification.deleteMany({
      recipient: userId,
      sender: requesterId,
      type: { $in: ["follow", "follow_request"] },
    });
    await user.save();
    res.json({ pendingFollowRequests: user.pendingFollowRequests });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takip isteği reddedilemedi", error: err.message });
  }
};

// Kullanıcının DM listesini getir
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({ users: userId })
      .populate({
        path: "users",
        select: "_id username avatar",
      })
      .populate({
        path: "lastMessage",
        populate: [
          { path: "sender", select: "_id username avatar" },
          { path: "receiver", select: "_id username avatar" },
          { path: "post", select: "_id" },
          { path: "story", select: "_id" },
        ],
      })
      .sort({ updatedAt: -1 });

    // Karşıdaki kullanıcıyı bul
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.users.find((u) => u._id.toString() !== userId);

        // Bu conversation'daki okunmamış mesaj sayısını hesapla
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver: userId,
          seenAt: null,
        }).maxTimeMS(5000); // 5 saniye timeout

        // Son mesaj metnini belirle
        let lastMessageText = "";

        if (conv.lastMessage) {
          const senderUsername =
            conv.lastMessage?.sender?.username ||
            (conv.lastMessage?.sender &&
            typeof conv.lastMessage.sender === "string"
              ? conv.lastMessage.sender
              : "") ||
            "Bilinmeyen";
          if (conv.lastMessage.text) {
            lastMessageText = conv.lastMessage.text;
          } else if (conv.lastMessage.post) {
            lastMessageText = `${senderUsername}'dan gönderi gönderildi`;
          } else if (conv.lastMessage.story) {
            lastMessageText = `${senderUsername}'dan hikaye gönderildi`;
          }
        }

        const mapped = {
          id: conv._id,
          user: otherUser,
          lastMessage: lastMessageText,
          time: conv.lastMessage?.createdAt || conv.updatedAt,
          lastMessageType: conv.lastMessage?.post
            ? "post"
            : conv.lastMessage?.story
            ? "story"
            : "text",
          unreadCount: unreadCount,
        };

        return mapped;
      })
    );

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "DM listesi getirilemedi", error: err.message });
  }
};

// İki kullanıcı arasındaki conversation'ı ve mesajları getir
exports.getConversationMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    // Conversation bul veya oluştur
    let conversation = await Conversation.findOne({
      users: { $all: [userId, otherUserId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        users: [userId, otherUserId],
      });
    }
    // Mesajları getir
    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "_id username avatar")
      .populate({
        path: "post",
        select: "_id image description user",
        populate: {
          path: "user",
          select: "_id username avatar",
        },
      })
      .populate({
        path: "story",
        select: "_id image user createdAt archived",
        populate: {
          path: "user",
          select: "_id username avatar",
        },
      });

    res.json({ conversationId: conversation._id, messages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Mesajlar getirilemedi", error: err.message });
  }
};

// Mesaj gönder
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, postId, storyId } = req.body;

    if (!senderId || !receiverId || (!text && !postId && !storyId)) {
      return res.status(400).json({ message: "Eksik veri" });
    }

    // Alıcının mesaj gizliliği kontrolü
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Alıcı bulunamadı" });
    }

    if (receiver.onlyFollowersCanMessage) {
      const sender = await User.findById(senderId);
      if (!receiver.followers.includes(senderId)) {
        return res.status(403).json({
          message: "Bu kullanıcı sadece takipçilerinden mesaj kabul ediyor",
        });
      }
    }

    // Conversation bul veya oluştur
    let conversation = await Conversation.findOne({
      users: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        users: [senderId, receiverId],
      });
    }

    // Mesaj oluştur
    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      text: text ? text.trim() : undefined,
      post: postId || undefined,
      story: storyId || undefined,
      readBy: [senderId], // Sadece gönderen mesajı okumuş sayılır
    });

    // Conversation'ın son mesajını güncelle
    conversation.lastMessage = message._id;
    await conversation.save();

    // Mesajı populate ile getir
    const populatedMessage = await Message.findById(message._id)
      .populate("sender receiver", "_id username avatar")
      .populate({
        path: "post",
        select: "_id image description user",
        populate: {
          path: "user",
          select: "_id username avatar",
        },
      })
      .populate({
        path: "story",
        select: "_id image user createdAt archived",
        populate: {
          path: "user",
          select: "_id username avatar",
        },
      });

    res.json(populatedMessage);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Mesaj gönderilemedi", error: err.message });
  }
};

// Kullanıcının arkadaş listesini getir (takip ettikleri ve edenler birleşimi)
exports.getUserFriends = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId)
      .populate("following", "_id username avatar")
      .populate("followers", "_id username avatar");
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    // Arkadaşlar: takip ettiklerin ve edenlerin birleşimi (tekrar edenler tek)
    const all = [...user.following, ...user.followers];
    const unique = [];
    const seen = new Set();
    for (const u of all) {
      if (!seen.has(u._id.toString())) {
        unique.push(u);
        seen.add(u._id.toString());
      }
    }
    res.json(unique);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Arkadaşlar getirilemedi", error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Eski şifre yanlış" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Yeni şifre en az 6 karakter olmalı" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Şifre başarıyla değiştirildi" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Şifre değiştirilemedi", error: err.message });
  }
};

exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    res.json(
      user.notificationSettings || {
        push: true,
        comment: true,
        follow: true,
      }
    );
  } catch (err) {
    res
      .status(500)
      .json({ message: "Bildirim ayarları getirilemedi", error: err.message });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { push, comment, follow } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    user.notificationSettings = { push, comment, follow };
    await user.save();
    res.json({ message: "Bildirim ayarları güncellendi" });
  } catch (err) {
    res.status(500).json({
      message: "Bildirim ayarları güncellenemedi",
      error: err.message,
    });
  }
};

// Mesaj gizliliği güncelle
exports.updateMessagePrivacy = async (req, res) => {
  try {
    const { userId, onlyFollowersCanMessage } = req.body;
    if (!userId) return res.status(400).json({ message: "Eksik veri" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    user.onlyFollowersCanMessage = !!onlyFollowersCanMessage;
    await user.save();
    res.json({ onlyFollowersCanMessage: user.onlyFollowersCanMessage });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Mesaj gizliliği güncellenemedi", error: err.message });
  }
};

// Mesajları görüldü olarak işaretle
exports.markMessagesAsSeen = async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId } = req.body;

    if (!userId || !conversationId) {
      return res.status(400).json({ message: "Eksik veri" });
    }

    // Conversation'ın geçerli olup olmadığını kontrol et
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation bulunamadı" });
    }

    // Kullanıcının bu conversation'da olup olmadığını kontrol et
    if (!conversation.users.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Bu conversation'a erişim izniniz yok" });
    }

    // Bu kullanıcıya gönderilen ve henüz görülmemiş mesajları bul ve güncelle
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        seenAt: null,
      },
      {
        seenAt: new Date(),
      }
    );

    // Güncellenen mesajları getir
    const updatedMessages = await Message.find({
      conversation: conversationId,
      receiver: userId,
      seenAt: { $ne: null },
    }).populate("sender receiver", "_id username avatar");

    res.json({
      message: "Mesajlar görüldü olarak işaretlendi",
      updatedCount: result.modifiedCount,
      messages: updatedMessages,
    });
  } catch (err) {
    console.error("Mark messages as seen error:", err);
    res.status(500).json({
      message: "Mesajlar görüldü olarak işaretlenemedi",
      error: err.message,
    });
  }
};

// Okunmamış mesaj sayısını getir
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Kullanıcı ID gerekli" });
    }

    // Farklı conversationId'leri distinct olarak bul
    const unreadConversations = await Message.distinct("conversation", {
      receiver: userId,
      seenAt: null,
    });

    res.json({
      unreadCount: unreadConversations.length,
      userId,
    });
  } catch (err) {
    console.error("Get unread message count error:", err);
    res.status(500).json({
      message: "Okunmamış mesaj sayısı getirilemedi",
      error: err.message,
    });
  }
};

// DM (conversation) ve içindeki tüm mesajları sil
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;
    if (!conversationId || !userId) {
      return res.status(400).json({ message: "Eksik veri" });
    }
    // Conversation kontrolü
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation bulunamadı" });
    }
    if (!conversation.users.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Bu conversation'a erişim izniniz yok" });
    }
    // Mesajları sil
    await Message.deleteMany({ conversation: conversationId });
    // Conversation'ı sil
    await Conversation.findByIdAndDelete(conversationId);
    res.json({ message: "DM ve tüm mesajlar silindi" });
  } catch (err) {
    res.status(500).json({ message: "DM silinemedi", error: err.message });
  }
};
