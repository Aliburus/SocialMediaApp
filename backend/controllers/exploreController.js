const UserBehavior = require("../models/UserBehavior");
const ContentEmbedding = require("../models/ContentEmbedding");
const UserEmbedding = require("../models/UserEmbedding");
const Post = require("../models/Post");
const User = require("../models/User");

// Davranış ağırlıkları
const BEHAVIOR_WEIGHTS = {
  like: 1.0,
  comment: 2.0,
  save: 3.0,
  view: 0.5,
  profile_visit: 1.5,
  story_view: 0.8,
  search: 1.2,
  follow: 2.5,
};

// Kullanıcı davranışını kaydet
const trackUserBehavior = async (req, res) => {
  try {
    console.log("trackUserBehavior req.body:", req.body);
    console.log("trackUserBehavior req.user:", req.user);
    const { contentId, behaviorType, duration = 0, metadata = {} } = req.body;
    const userId = req.user.userId || req.user._id || req.user.id;

    // Post var mı kontrolü
    const post = await Post.findById(contentId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "İçerik bulunamadı" });
    }

    const weight = BEHAVIOR_WEIGHTS[behaviorType] || 1.0;

    const behavior = new UserBehavior({
      userId,
      contentId,
      behaviorType,
      weight,
      duration,
      metadata,
    });

    if (behaviorType === "save") {
      console.log("[SAVE] Kullanıcı:", userId, "içeriği kaydetti:", contentId);
    }
    if (behaviorType === "profile_visit") {
      console.log(
        "[PROFILE VISIT] Kullanıcı:",
        userId,
        "profili ziyaret etti:",
        contentId
      );
    }
    console.log(
      `[BEHAVIOR] userId: ${userId}, type: ${behaviorType}, contentId: ${contentId}, weight: ${weight}, duration: ${duration}`
    );

    await behavior.save();

    // Kullanıcı embedding'ini güncelle
    await updateUserEmbedding(userId);

    res.status(200).json({ success: true, message: "Davranış kaydedildi" });
  } catch (error) {
    console.error("Davranış kaydetme hatası:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Kullanıcı embedding'ini güncelle
const updateUserEmbedding = async (userId) => {
  try {
    // Son 30 günlük davranışları al
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const behaviors = await UserBehavior.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo },
    }).populate("contentId");

    if (behaviors.length === 0) return;

    // Basit embedding oluştur (128 boyutlu)
    const embedding = new Array(128).fill(0);
    const interests = new Set();
    const categories = new Set();

    behaviors.forEach((behavior) => {
      if (!behavior.contentId) return; // Silinmiş post'u atla
      const weight = behavior.weight;
      // Basit hash-based embedding
      const contentHash = behavior.contentId._id.toString();
      for (let i = 0; i < 128; i++) {
        const hash = contentHash.charCodeAt(i % contentHash.length);
        embedding[i] += (hash % 100) * weight;
      }
      // İlgi alanları ve kategoriler
      if (behavior.contentId.description) {
        const words = behavior.contentId.description.toLowerCase().split(" ");
        words.forEach((word) => {
          if (word.length > 3) interests.add(word);
        });
      }
    });

    // Embedding'i normalize et
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      for (let i = 0; i < 128; i++) {
        embedding[i] /= magnitude;
      }
    }

    // Kullanıcı embedding'ini güncelle veya oluştur
    await UserEmbedding.findOneAndUpdate(
      { userId },
      {
        embeddingVector: embedding,
        interests: Array.from(interests).slice(0, 20),
        categories: Array.from(categories).slice(0, 10),
        lastUpdated: new Date(),
        behaviorCount: behaviors.length,
        averageEngagement:
          behaviors.reduce((sum, b) => sum + b.weight, 0) / behaviors.length,
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Embedding güncelleme hatası:", error);
  }
};

// Keşfet feed'ini getir
const getExploreFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Kullanıcı embedding'ini al
    const userEmbedding = await UserEmbedding.findOne({ userId });

    if (!userEmbedding) {
      // İlk kez kullanıyorsa popüler içerikleri göster
      const popularPosts = await Post.find({ type: "reel" })
        .populate("user", "username avatar")
        .sort({ likes: -1, createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return res.status(200).json({
        success: true,
        posts: popularPosts,
        hasMore: popularPosts.length === limit,
      });
    }

    // Benzerlik hesaplama için tüm içerik embedding'lerini al
    const contentEmbeddings = await ContentEmbedding.find().populate({
      path: "contentId",
      match: { type: "reel" },
      populate: { path: "user", select: "username avatar" },
    });

    // Cosine similarity hesapla
    const similarities = contentEmbeddings.map((content) => {
      const similarity = cosineSimilarity(
        userEmbedding.embeddingVector,
        content.embeddingVector
      );
      return {
        post: content.contentId,
        similarity,
        popularity: content.popularity,
        freshness: content.freshness,
      };
    });

    // Sıralama faktörleri
    // Çeşitlilik için aynı kullanıcıdan arka arkaya içerik gelmesin
    const userSeen = new Set();
    const sortedPosts = similarities
      .filter(
        (item) =>
          item.post &&
          item.post.type === "reel" &&
          !item.post.user._id.equals(userId)
      )
      .sort((a, b) => {
        const scoreA =
          a.similarity * 0.4 + a.popularity * 0.2 + a.freshness * 0.15;
        const scoreB =
          b.similarity * 0.4 + b.popularity * 0.2 + b.freshness * 0.15;
        return scoreB - scoreA;
      })
      .filter((item) => {
        // Çeşitlilik: aynı kullanıcıdan arka arkaya içerik gelmesin
        if (userSeen.has(item.post.user._id.toString())) return false;
        userSeen.add(item.post.user._id.toString());
        return true;
      })
      .slice(skip, skip + limit)
      .map((item) => item.post);

    res.status(200).json({
      success: true,
      posts: sortedPosts,
      hasMore: sortedPosts.length === limit,
    });
  } catch (error) {
    console.error("Keşfet feed hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Cosine similarity hesaplama
const cosineSimilarity = (vectorA, vectorB) => {
  if (vectorA.length !== vectorB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// İçerik embedding'ini oluştur/güncelle
const updateContentEmbedding = async (postId) => {
  try {
    const post = await Post.findById(postId);
    if (!post) return;

    // Basit embedding oluştur
    const embedding = new Array(128).fill(0);
    const tags = new Set();
    const hashtags = new Set();

    // Caption'dan kelimeleri çıkar
    if (post.description) {
      const words = post.description.toLowerCase().split(" ");
      words.forEach((word, index) => {
        if (word.length > 3) {
          tags.add(word);
          // Basit hash-based embedding
          for (let i = 0; i < 128; i++) {
            const hash = word.charCodeAt(i % word.length);
            embedding[i] += (hash % 100) * (1 + index * 0.1);
          }
        }
      });
    }

    // Hashtag'leri çıkar
    const hashtagRegex = /#(\w+)/g;
    const matches = post.description?.match(hashtagRegex) || [];
    matches.forEach((hashtag) => {
      hashtags.add(hashtag.slice(1));
    });

    // Embedding'i normalize et
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    if (magnitude > 0) {
      for (let i = 0; i < 128; i++) {
        embedding[i] /= magnitude;
      }
    }

    // Popülerlik skoru hesapla
    const popularity =
      (post.likes?.length || 0) * 1 + (post.comments?.length || 0) * 2;

    // Güncellik skoru hesapla
    const ageInDays = (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0.1, 1 - ageInDays / 30);

    await ContentEmbedding.findOneAndUpdate(
      { contentId: postId },
      {
        embeddingVector: embedding,
        tags: Array.from(tags).slice(0, 20),
        hashtags: Array.from(hashtags).slice(0, 10),
        popularity,
        freshness,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("İçerik embedding güncelleme hatası:", error);
  }
};

// Kullanıcı geri bildirimi
const submitFeedback = async (req, res) => {
  try {
    const { contentId, feedbackType, reason } = req.body;
    const userId = req.user.id;

    // Geri bildirimi kaydet
    const behavior = new UserBehavior({
      userId,
      contentId,
      behaviorType: feedbackType === "hide" ? "view" : "view",
      weight: feedbackType === "hide" ? -1 : 0.1,
      metadata: { feedbackType, reason },
    });

    await behavior.save();

    // FeedbackType 'hide' ise ilgili içeriğin popularity ve freshness değerini azalt
    if (feedbackType === "hide") {
      const embedding = await ContentEmbedding.findOne({ contentId });
      if (embedding) {
        embedding.popularity = Math.max(0, (embedding.popularity || 0) - 5);
        embedding.freshness = Math.max(0.1, (embedding.freshness || 1) * 0.5);
        await embedding.save();
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Geri bildirim kaydedildi" });
  } catch (error) {
    console.error("Geri bildirim hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

module.exports = {
  trackUserBehavior,
  getExploreFeed,
  updateContentEmbedding,
  submitFeedback,
};
