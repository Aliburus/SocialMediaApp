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
