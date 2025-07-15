const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createOrUpdateNotification } = require("./notificationController");
const { updateContentEmbedding } = require("./exploreController");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Post oluşturma
exports.createPost = async (req, res) => {
  try {
    const { description, user, type } = req.body;
    let image = req.body.image;
    let video = req.body.video;
    let thumbnail = req.body.thumbnail;
    if (req.file) {
      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) {
        image = `/uploads/${req.file.filename}`;
      } else if (mime.startsWith("video/")) {
        video = `/uploads/${req.file.filename}`;
      }
    }
    if (!image && !video)
      return res.status(400).json({ message: "Image or video required" });
    if (!user)
      return res.status(400).json({ message: "User information required" });
    const post = await Post.create({
      user,
      image,
      video,
      description,
      type,
      thumbnail,
    });

    // İçerik embedding'ini oluştur
    try {
      await updateContentEmbedding(post._id);
    } catch (embeddingError) {
      console.error("Embedding oluşturma hatası:", embeddingError);
    }

    res.status(201).json(post);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Post could not be created", error: err.message });
  }
};

// Tüm postları listeleme
exports.getAllPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    let posts;
    if (userId) {
      const user = await require("../models/User").findById(userId);
      if (!user)
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });

      // Takip edilen kullanıcıların postlarını getir (ObjectId tipine çevir, güvenli)
      const followingIds = user.following
        .filter((id) => !!id)
        .map((id) =>
          typeof id === "string" ? mongoose.Types.ObjectId(id) : id
        );
      const followingPosts = await Post.find({
        user: { $in: followingIds },
        archived: false,
      })
        .populate("user", "_id username avatar")
        .sort({ createdAt: -1 });

      // Kendi postlarını da ekle
      const myPosts = await Post.find({ user: userId, archived: false })
        .populate("user", "_id username avatar")
        .sort({ createdAt: -1 });

      // Gizli hesap kontrolü yap
      const filteredPosts = [];

      for (const post of [...followingPosts, ...myPosts]) {
        const postUser = await require("../models/User").findById(
          post.user._id
        );
        if (postUser) {
          const isPrivateAccount = postUser.privateAccount;
          const canViewPost =
            !isPrivateAccount ||
            postUser.followers.some(
              (follower) => follower.toString() === userId
            ) ||
            post.user._id.toString() === userId;

          if (canViewPost) {
            filteredPosts.push(post);
          }
        }
      }

      // Tarihe göre sırala ve tekrar eden postları kaldır
      const uniquePosts = filteredPosts.filter(
        (post, index, self) =>
          index ===
          self.findIndex((p) => p._id.toString() === post._id.toString())
      );

      posts = uniquePosts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      posts = await Post.find({ archived: false })
        .populate("user", "_id username avatar")
        .sort({ createdAt: -1 });
    }
    res.json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Posts could not be retrieved", error: err.message });
  }
};

// Tekil post detayını getirme
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "username name avatar"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Post could not be retrieved", error: err.message });
  }
};

// Postu beğen veya beğenmekten vazgeç
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.body.userId;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);

      // Bildirim oluştur
      try {
        await createOrUpdateNotification(post.user, userId, "like", postId);
      } catch (notificationError) {
        // Bildirim hatası olsa bile like işlemi devam etsin
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    // İçerik embedding'ini güncelle
    try {
      await updateContentEmbedding(postId);
    } catch (embeddingError) {
      console.error("Embedding güncelleme hatası:", embeddingError);
    }

    const populatedPost = await Post.findById(postId).populate(
      "user",
      "username name avatar"
    );
    res.json(populatedPost);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Like operation failed", error: err.message });
  }
};

// Posta yorum ekle
exports.addComment = async (req, res) => {
  try {
    const { userId, text } = req.body;
    const postId = req.params.id;
    if (!text)
      return res.status(400).json({ message: "Comment cannot be empty" });

    // Post'u bul
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({ user: userId, post: postId, text });
    // Yorumu post'a ekle
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    // Bildirim oluştur
    try {
      await createOrUpdateNotification(post.user, userId, "comment", postId);
    } catch (notificationError) {
      // Bildirim hatası olsa bile yorum işlemi devam etsin
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "username avatar"
    );
    res.status(201).json(populatedComment);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Comment could not be added", error: err.message });
  }
};

// Postun yorumlarını getir
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Comments could not be retrieved", error: err.message });
  }
};

// Kullanıcının kendi postlarını getir
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { currentUserId } = req.query; // Gizli hesap kontrolü için

    // Kullanıcıyı bul
    const user = await require("../models/User").findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Gizli hesap kontrolü
    const isPrivateAccount = user.privateAccount;
    const canViewPosts =
      !isPrivateAccount ||
      user.followers.some(
        (follower) => follower.toString() === currentUserId
      ) ||
      userId === currentUserId;

    if (!canViewPosts) {
      return res.json([]); // Boş array dön, frontend gizli hesap mesajını gösterecek
    }

    const posts = await Post.find({ user: userId })
      .populate("user", "username name avatar")
      .sort({ createdAt: -1 });
    // comments alanını sadece sayı olarak dön
    const postsWithCommentCount = posts.map((post) => ({
      ...post.toObject(),
      comments: Array.isArray(post.comments) ? post.comments.length : 0,
    }));
    res.json(postsWithCommentCount);
  } catch (err) {
    res.status(500).json({
      message: "User posts could not be retrieved",
      error: err.message,
    });
  }
};

// Postu sil (ve ilişkili yorumları sil)
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    // Sadece kendi postunu silebilsin
    if (!req.user || String(post.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own reel" });
    }
    // Sadece reel ise silinsin
    if (post.type !== "reel") {
      return res.status(400).json({ message: "Only reel can be deleted" });
    }
    // Dosya silme işlemleri
    const deleteFile = (filePath) => {
      return new Promise((resolve) => {
        if (filePath && filePath.startsWith("/uploads/")) {
          const fullPath = path.join(__dirname, "..", filePath);
          fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (!err) {
              fs.unlink(fullPath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error("Dosya silinemedi:", fullPath, unlinkErr);
                }
                resolve();
              });
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    };
    // Video ve görsel dosyalarını sil
    await Promise.all([deleteFile(post.image), deleteFile(post.video)]);
    // Kullanıcıların kaydedilenlerinden çıkar
    const User = require("../models/User");
    await User.updateMany({ saved: postId }, { $pull: { saved: postId } });
    // Mesajlardan çıkar
    const Message = require("../models/Message");
    await Message.updateMany(
      { post: postId },
      { $unset: { post: "" }, $set: { text: "Content deleted" } }
    );
    // Embedding ve davranışları sil
    const ContentEmbedding = require("../models/ContentEmbedding");
    const UserBehavior = require("../models/UserBehavior");
    await ContentEmbedding.deleteMany({ contentId: postId });
    await UserBehavior.deleteMany({ contentId: postId });
    if (typeof global.clearPostCache === "function") {
      await global.clearPostCache(postId);
    }
    // Postu ve yorumlarını sil
    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });
    res.json({ message: "Reel and related data deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Reel could not be deleted", error: err.message });
  }
};

// Postu arşivleyecek bir endpoint ekle
exports.archivePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { archived } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (archived === false) {
      post.archived = false;
      post.archivedAt = null;
      await post.save();
      return res.json({ message: "Post archived" });
    } else {
      post.archived = true;
      post.archivedAt = new Date();
      await post.save();
      return res.json({ message: "Post archived" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Post could not be archived", error: err.message });
  }
};

// Yorumu beğen veya beğenmekten vazgeç
exports.toggleCommentLike = async (req, res) => {
  try {
    const userId = req.body.userId;
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const index = comment.likes.indexOf(userId);
    if (index === -1) {
      comment.likes.push(userId);
      // Bildirim oluştur
      await createOrUpdateNotification(
        comment.user,
        userId,
        "like",
        null,
        commentId
      );
    } else {
      comment.likes.splice(index, 1);
    }
    await comment.save();

    const populatedComment = await Comment.findById(commentId).populate(
      "user",
      "username avatar"
    );
    res.json(populatedComment);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Comment like operation failed", error: err.message });
  }
};
