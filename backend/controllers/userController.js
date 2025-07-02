const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../utils/validate");
const Post = require("../models/Post");

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
    const { userId, name, username, avatar, bio } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
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
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
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
    console.log(
      "[savePost] userId:",
      userId,
      typeof userId,
      "postId:",
      postId,
      typeof postId
    );
    if (!userId || !postId)
      return res.status(400).json({ message: "Eksik veri" });
    const user = await User.findById(userId);
    const post = await Post.findById(postId);
    if (!user || !post)
      return res
        .status(404)
        .json({ message: "Kullanıcı veya post bulunamadı" });
    console.log(
      "[savePost] Önce user.saved:",
      user.saved,
      "post.savedBy:",
      post.savedBy
    );
    // User'ın saved dizisi
    const userIndex = user.saved.indexOf(postId);
    if (userIndex === -1) {
      user.saved.push(postId);
      console.log("[savePost] Post kaydedildi, user.saved'e eklendi");
    } else {
      user.saved.splice(userIndex, 1);
      console.log("[savePost] Post kaydı kaldırıldı, user.saved'den çıkarıldı");
    }
    // Post'un savedBy dizisi
    const postIndex = post.savedBy.indexOf(userId);
    if (postIndex === -1) {
      post.savedBy.push(userId);
      console.log("[savePost] Kullanıcı post.savedBy'ya eklendi");
    } else {
      post.savedBy.splice(postIndex, 1);
      console.log("[savePost] Kullanıcı post.savedBy'dan çıkarıldı");
    }
    await user.save();
    await post.save();
    console.log(
      "[savePost] Sonra user.saved:",
      user.saved,
      "post.savedBy:",
      post.savedBy
    );
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
    await user.save();
    await targetUser.save();
    res.json({ following: user.following, followers: targetUser.followers });
  } catch (err) {
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
    targetUser.notifications = targetUser.notifications.filter(
      (notif) => !(notif.type === "follow" && notif.from.toString() === userId)
    );
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
    if (userId === targetUserId) {
      return res.status(400).json({ message: "Kendine istek gönderemezsin" });
    }
    const targetUser = await User.findById(targetUserId);
    const user = await User.findById(userId);
    if (!targetUser || !user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    if (!targetUser.pendingFollowRequests.includes(userId)) {
      targetUser.pendingFollowRequests.push(userId);
      // Bildirim ekle
      targetUser.notifications.push({ type: "follow", from: userId });
      await targetUser.save();
    }
    if (!user.sentFollowRequests.includes(targetUserId)) {
      user.sentFollowRequests.push(targetUserId);
      await user.save();
    }
    res.json({
      pendingFollowRequests: targetUser.pendingFollowRequests,
      sentFollowRequests: user.sentFollowRequests,
    });
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
    targetUser.notifications = targetUser.notifications.filter(
      (notif) => !(notif.type === "follow" && notif.from.toString() === userId)
    );
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

// Bildirimleri getir
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("[getNotifications] userId:", userId);
    const user = await User.findById(userId).populate({
      path: "notifications.from",
      select: "_id username avatar",
      populate: [
        { path: "followers", select: "_id" },
        { path: "following", select: "_id" },
      ],
    });
    console.log("[getNotifications] user:", user ? user._id : null);
    if (!user) {
      console.log("[getNotifications] Kullanıcı bulunamadı:", userId);
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    // Bildirimleri zenginleştir
    const notifications = (user.notifications || []).map((notif) => {
      let status;
      if (notif.type === "follow") {
        if (
          user.pendingFollowRequests
            .map((id) => id.toString())
            .includes(notif.from._id.toString())
        ) {
          status = "pending";
        } else if (
          user.followers
            .map((id) => id.toString())
            .includes(notif.from._id.toString())
        ) {
          status = "accepted";
        }
      }
      // followersCount ve followingCount ekle
      const followersCount = Array.isArray(notif.from.followers)
        ? notif.from.followers.length
        : 0;
      const followingCount = Array.isArray(notif.from.following)
        ? notif.from.following.length
        : 0;
      return {
        id:
          notif._id?.toString() ||
          notif.id?.toString() ||
          Math.random().toString(),
        type: notif.type,
        user: {
          ...notif.from._doc,
          followersCount,
          followingCount,
        },
        text:
          notif.type === "follow"
            ? status === "pending"
              ? "seni takip etmek istiyor"
              : "seni takip etmeye başladı"
            : "",
        timestamp: notif.date,
        isRead: notif.read,
        status,
      };
    });
    console.log("[getNotifications] notifications:", notifications);
    res.json(notifications);
  } catch (err) {
    console.error("[getNotifications] Hata:", err);
    res
      .status(500)
      .json({ message: "Bildirimler getirilemedi", error: err.message });
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
    // Bildirim güncelle (opsiyonel: okundu yap)
    user.notifications = user.notifications.map((notif) => {
      if (notif.type === "follow" && notif.from.toString() === requesterId) {
        return { ...notif, read: true };
      }
      return notif;
    });
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
    user.notifications = user.notifications.filter(
      (notif) =>
        !(notif.type === "follow" && notif.from.toString() === requesterId)
    );
    await user.save();
    res.json({ pendingFollowRequests: user.pendingFollowRequests });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Takip isteği reddedilemedi", error: err.message });
  }
};
