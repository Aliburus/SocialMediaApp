const Story = require("../models/Story");
const User = require("../models/User");

exports.createStory = async (req, res) => {
  try {
    const { user, image } = req.body;
    if (!user || !image) return res.status(400).json({ message: "Eksik veri" });
    const story = await Story.create({ user, image });
    res.status(201).json(story);
  } catch (err) {
    res.status(500).json({ message: "Story eklenemedi", error: err.message });
  }
};

exports.getAllStories = async (req, res) => {
  try {
    const userId = req.query.userId;
    const stories = await Story.find({}).populate("user");
    const now = new Date();
    for (const story of stories) {
      if (
        !story.archived &&
        story.createdAt &&
        now - story.createdAt > 24 * 60 * 60 * 1000
      ) {
        story.archived = true;
        story.archivedAt = now;
        await story.save();
      }
    }
    const filtered = stories.filter((s) => !s.archived);
    const result = filtered.map((s) => {
      const obj = s.toObject();
      if (userId) {
        obj.isViewed = (s.viewers || []).map(String).includes(String(userId));
      }
      return obj;
    });
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Storyler getirilemedi", error: err.message });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story bulunamadı" });
    if (!story.viewers.includes(userId)) {
      story.viewers.push(userId);
      await story.save();
    }
    res.json({
      _id: story._id,
      viewers: story.viewers,
      isViewed: story.viewers.map(String).includes(String(userId)),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Story izlenme kaydedilemedi", error: err.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story bulunamadı" });

    // Sadece story sahibi silebilir
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    await Story.findByIdAndDelete(storyId);
    res.json({ message: "Story başarıyla silindi" });
  } catch (err) {
    res.status(500).json({ message: "Story silinemedi", error: err.message });
  }
};

exports.archiveStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story bulunamadı" });

    // Sadece story sahibi arşivleyebilir
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    story.archived = true;
    story.archivedAt = new Date();
    await story.save();

    res.json({ message: "Story başarıyla arşivlendi" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Story arşivlenemedi", error: err.message });
  }
};

// Arşivlenen story'leri getir
exports.getArchivedStories = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const stories = await Story.find({
      user: userId,
      archived: true,
    }).populate("user");

    const result = stories.map((s) => {
      const obj = s.toObject();
      obj.isViewed = (s.viewers || []).map(String).includes(String(userId));
      return obj;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Arşivlenen storyler getirilemedi",
      error: err.message,
    });
  }
};

// Story'yi arşivden çıkar
exports.unarchiveStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story bulunamadı" });

    // Sadece story sahibi arşivden çıkarabilir
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    // 24 saatten eski ise çıkarılamaz
    const now = new Date();
    const created = story.createdAt || story.timestamp;
    if (now - created > 24 * 60 * 60 * 1000) {
      return res
        .status(400)
        .json({ message: "24 saatten eski story arşivden çıkarılamaz" });
    }

    story.archived = false;
    story.archivedAt = undefined;
    await story.save();

    res.json({ message: "Story arşivden çıkarıldı" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Story arşivden çıkarılamadı", error: err.message });
  }
};
