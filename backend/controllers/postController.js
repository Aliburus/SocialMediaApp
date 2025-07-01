const Post = require("../models/Post");
const Comment = require("../models/Comment");

// Post oluşturma
exports.createPost = async (req, res) => {
  try {
    const { image, description, user } = req.body;
    if (!image) return res.status(400).json({ message: "Görsel zorunlu" });
    if (!user)
      return res.status(400).json({ message: "Kullanıcı bilgisi zorunlu" });
    const post = await Post.create({ user, image, description });
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
    const posts = await Post.find()
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
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
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
    const comment = await Comment.create({ user: userId, post: postId, text });
    // Yorumu post'a ekle
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
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
