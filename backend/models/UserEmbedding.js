const mongoose = require("mongoose");

const userEmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    embeddingVector: [{ type: Number, required: true }], // 128 boyutlu vektör
    interests: [{ type: String }], // İlgi alanları
    categories: [{ type: String }], // Tercih ettiği kategoriler
    lastUpdated: { type: Date, default: Date.now },
    behaviorCount: { type: Number, default: 0 }, // Toplam davranış sayısı
    averageEngagement: { type: Number, default: 0 }, // Ortalama etkileşim skoru
  },
  { timestamps: true }
);

// Index'ler
userEmbeddingSchema.index({ userId: 1 });
userEmbeddingSchema.index({ interests: 1 });
userEmbeddingSchema.index({ categories: 1 });

module.exports = mongoose.model("UserEmbedding", userEmbeddingSchema);
