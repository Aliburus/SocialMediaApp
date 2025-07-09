const mongoose = require("mongoose");

const contentEmbeddingSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    embeddingVector: [{ type: Number, required: true }], // 128 boyutlu vektör
    category: { type: String, default: "general" },
    tags: [{ type: String }],
    hashtags: [{ type: String }],
    popularity: { type: Number, default: 0 }, // Popülerlik skoru
    freshness: { type: Number, default: 1.0 }, // Güncellik skoru
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index'ler
contentEmbeddingSchema.index({ contentId: 1 });
contentEmbeddingSchema.index({ category: 1, popularity: -1 });
contentEmbeddingSchema.index({ tags: 1 });

module.exports = mongoose.model("ContentEmbedding", contentEmbeddingSchema);
