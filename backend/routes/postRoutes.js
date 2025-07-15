const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { archivePost } = require("../controllers/postController");
const nsfwCheck = require("../middleware/nsfwCheck");
const { authenticateToken } = require("../middleware/auth");

// const auth = require('../middleware/auth'); // Auth middleware eklenebilir

// Yorumu beğen veya beğenmekten vazgeç (en üstte olmalı)
router.put("/comments/:commentId/like", postController.toggleCommentLike);
// Kullanıcının kendi postlarını getir
router.get("/user/:userId", postController.getUserPosts);
// Tekil post detayını getir
router.get("/:id", postController.getPostById);
// Tüm postları listele
router.get("/", postController.getAllPosts);
// Post oluştur (auth middleware eklenebilir)
router.post(
  "/",
  /*auth,*/ (req, res, next) => {
    req.upload.single("media")(req, res, next);
  },
  nsfwCheck,
  postController.createPost
);
// Postu beğen veya beğenmekten vazgeç
router.put("/:id/like", postController.toggleLike);
// Posta yorum ekle
router.post("/:id/comments", postController.addComment);
// Postun yorumlarını getir
router.get("/:id/comments", postController.getComments);
// Postu sil
router.delete("/:id", authenticateToken, postController.deletePost);
// Postu arşivleye
router.post("/:id/archive", archivePost);

module.exports = router;
