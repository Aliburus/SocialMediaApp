const mongoose = require("mongoose");
const UserBehavior = require("../models/UserBehavior");
const ContentEmbedding = require("../models/ContentEmbedding");
const UserEmbedding = require("../models/UserEmbedding");
const Post = require("../models/Post");
const User = require("../models/User");
require("dotenv").config();

// Veritabanı bağlantısı
mongoose.connect(process.env.MONGODB_URI);

// Test verisi oluştur
const seedExploreData = async () => {
  try {
    console.log("Keşfet test verisi oluşturuluyor...");

    // Kullanıcıları al
    const users = await User.find().limit(10);
    const posts = await Post.find().limit(20);

    if (users.length === 0 || posts.length === 0) {
      console.log("Kullanıcı veya post bulunamadı");
      return;
    }

    // Rastgele davranışlar oluştur
    const behaviors = [];
    const behaviorTypes = ["like", "comment", "save", "view", "profile_visit"];

    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      const randomBehavior =
        behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];

      behaviors.push({
        userId: randomUser._id,
        contentId: randomPost._id,
        behaviorType: randomBehavior,
        weight: Math.random() * 3,
        duration: Math.floor(Math.random() * 60),
        timestamp: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Son 30 gün
      });
    }

    await UserBehavior.insertMany(behaviors);
    console.log(`${behaviors.length} davranış kaydı oluşturuldu`);

    // İçerik embedding'leri oluştur
    const contentEmbeddings = [];
    for (const post of posts) {
      const embedding = new Array(128).fill(0);
      for (let i = 0; i < 128; i++) {
        embedding[i] = Math.random() * 2 - 1; // -1 ile 1 arası
      }

      contentEmbeddings.push({
        contentId: post._id,
        embeddingVector: embedding,
        category: "general",
        tags: ["test", "sample"],
        hashtags: ["#test", "#sample"],
        popularity: Math.floor(Math.random() * 100),
        freshness: Math.random(),
      });
    }

    await ContentEmbedding.insertMany(contentEmbeddings);
    console.log(`${contentEmbeddings.length} içerik embedding'i oluşturuldu`);

    // Kullanıcı embedding'leri oluştur
    const userEmbeddings = [];
    for (const user of users) {
      const embedding = new Array(128).fill(0);
      for (let i = 0; i < 128; i++) {
        embedding[i] = Math.random() * 2 - 1;
      }

      userEmbeddings.push({
        userId: user._id,
        embeddingVector: embedding,
        interests: ["teknoloji", "spor", "müzik"],
        categories: ["general"],
        behaviorCount: Math.floor(Math.random() * 50),
        averageEngagement: Math.random() * 3,
      });
    }

    await UserEmbedding.insertMany(userEmbeddings);
    console.log(`${userEmbeddings.length} kullanıcı embedding'i oluşturuldu`);

    console.log("Test verisi başarıyla oluşturuldu!");
  } catch (error) {
    console.error("Test verisi oluşturma hatası:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedExploreData();
