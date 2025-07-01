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
    const stories = await Story.find()
      .populate("user", "_id username avatar")
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Storyler getirilemedi", error: err.message });
  }
};
