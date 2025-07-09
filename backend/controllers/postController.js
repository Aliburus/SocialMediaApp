const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { createOrUpdateNotification } = require("./notificationController");
const { updateContentEmbedding } = require("./exploreController");

// Post oluşturma
exports.createPost = async (req, res) => {
  try {
    const { image, description, user } = req.body;
    if (!image) return res.status(400).json({ message: "Görsel zorunlu" });
    if (!user)
      return res.status(400).json({ message: "Kullanıcı bilgisi zorunlu" });
    const post = await Post.create({ user, image, description });

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
      .json({ message: "Post oluşturulamadı", error: err.message });
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

      // Takip edilen kullanıcıların postlarını getir
      const followingPosts = await Post.find({ user: { $in: user.following } })
        .populate("user", "_id username avatar")
        .sort({ createdAt: -1 });

      // Kendi postlarını da ekle
      const myPosts = await Post.find({ user: userId })
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
      posts = await Post.find()
        .populate("user", "_id username avatar")
        .sort({ createdAt: -1 });
    }
    res.json(posts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Postlar getirilemedi", error: err.message });
  }
};

// Tekil post detayını getirme
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "username name avatar"
    );
    if (!post) return res.status(404).json({ message: "Post bulunamadı" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Post getirilemedi", error: err.message });
  }
};

// Postu beğen veya beğenmekten vazgeç
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.body.userId;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post bulunamadı" });

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
      .json({ message: "Like işlemi başarısız", error: err.message });
  }
};

// Posta yorum ekle
exports.addComment = async (req, res) => {
  try {
    const { userId, text } = req.body;
    const postId = req.params.id;
    if (!text) return res.status(400).json({ message: "Yorum boş olamaz" });

    // Post'u bul
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post bulunamadı" });

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
    res.status(500).json({ message: "Yorum eklenemedi", error: err.message });
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
      .json({ message: "Yorumlar getirilemedi", error: err.message });
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
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
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
    res
      .status(500)
      .json({ message: "Kullanıcı postları getirilemedi", error: err.message });
  }
};

// Postu sil (ve ilişkili yorumları sil)
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    // Postu sil
    await Post.findByIdAndDelete(postId);
    // Yorumları sil
    await Comment.deleteMany({ post: postId });
    // Like bilgileri post içinde tutuluyorsa zaten silinmiş olur
    res.json({ message: "Post ve ilişkili veriler silindi" });
  } catch (err) {
    res.status(500).json({ message: "Post silinemedi", error: err.message });
  }
};

// Postu arşivleyecek bir endpoint ekle
exports.archivePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { archived } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post bulunamadı" });
    if (archived === false) {
      post.archived = false;
      post.archivedAt = null;
      await post.save();
      return res.json({ message: "Post arşivden çıkarıldı" });
    } else {
      post.archived = true;
      post.archivedAt = new Date();
      await post.save();
      return res.json({ message: "Post arşivlendi" });
    }
  } catch (err) {
    res.status(500).json({ message: "Post arşivlenemedi", error: err.message });
  }
};

// Yorumu beğen veya beğenmekten vazgeç
exports.toggleCommentLike = async (req, res) => {
  try {
    const userId = req.body.userId;
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı" });

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
      .json({ message: "Yorum beğeni işlemi başarısız", error: err.message });
  }
};
