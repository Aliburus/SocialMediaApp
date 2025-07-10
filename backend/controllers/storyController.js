const Story = require("../models/Story");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

exports.createStory = async (req, res) => {
  try {
    const { user } = req.body;
    let image = req.body.image;
    let video = req.body.video;

    console.log("Story create - req.body:", req.body);
    console.log("Story create - req.file:", req.file);
    console.log("Story create - req.files:", req.files);

    if (req.file) {
      const mime = req.file.mimetype;
      console.log("Story create - mime type:", mime);
      console.log("Story create - filename:", req.file.filename);
      if (mime.startsWith("image/")) {
        image = `/uploads/${req.file.filename}`;
        console.log("Story create - image path:", image);
      } else if (mime.startsWith("video/")) {
        video = `/uploads/${req.file.filename}`;
        console.log("Story create - video path:", video);
      }
    }

    // Video dosyası varsa ama video alanı boşsa, dosya adından kontrol et
    if (!video && req.file && req.file.filename) {
      const filename = req.file.filename.toLowerCase();
      if (
        filename.includes(".mp4") ||
        filename.includes(".mov") ||
        filename.includes(".avi")
      ) {
        video = `/uploads/${req.file.filename}`;
        console.log("Story create - video path from filename:", video);
      }
    }

    console.log("Story create - final image:", image);
    console.log("Story create - final video:", video);

    if (!user || (!image && !video))
      return res.status(400).json({ message: "Eksik veri" });

    const story = await Story.create({ user, image, video });
    console.log("Story create - created story:", story);

    // Eğer video alanı boşsa ama dosya varsa, güncelle
    if (!story.video && req.file && req.file.filename) {
      const filename = req.file.filename.toLowerCase();
      if (
        filename.includes(".mp4") ||
        filename.includes(".mov") ||
        filename.includes(".avi")
      ) {
        story.video = `/uploads/${req.file.filename}`;
        await story.save();
        console.log("Story create - updated story with video:", story);
      }
    }

    res.status(201).json(story);
  } catch (err) {
    console.error("Story create error:", err);
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

    // Dosya silme işlemleri
    const deleteFile = (filePath) => {
      return new Promise((resolve) => {
        if (filePath && filePath.startsWith("/uploads/")) {
          const fullPath = path.join(__dirname, "..", filePath);
          fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (!err) {
              fs.unlink(fullPath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(
                    "Story dosyası silinemedi:",
                    fullPath,
                    unlinkErr
                  );
                } else {
                  console.log("Story dosyası başarıyla silindi:", fullPath);
                }
                resolve();
              });
            } else {
              console.log("Story dosyası bulunamadı:", fullPath);
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    };

    // Image ve video dosyalarını sil
    await Promise.all([deleteFile(story.image), deleteFile(story.video)]);

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

// Story görünme istatistiklerini getir
exports.getStoryStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId)
      return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const stories = await Story.find({ user: userId, archived: false });

    const stats = {
      totalStories: stories.length,
      totalViews: 0,
      uniqueViewers: new Set(),
      storiesWithViews: 0,
    };

    stories.forEach((story) => {
      const viewers = story.viewers || [];
      stats.totalViews += viewers.length;
      viewers.forEach((viewer) => stats.uniqueViewers.add(viewer.toString()));
      if (viewers.length > 0) stats.storiesWithViews++;
    });

    res.json({
      ...stats,
      uniqueViewers: Array.from(stats.uniqueViewers).length,
    });
  } catch (err) {
    res.status(500).json({
      message: "Story istatistikleri getirilemedi",
      error: err.message,
    });
  }
};
