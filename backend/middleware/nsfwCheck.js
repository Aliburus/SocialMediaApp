module.exports = (req, res, next) => {
  const nsfwWords = ["nsfw", "porn", "sex", "nude", "xxx", "18+"];
  const checkText = (text) =>
    nsfwWords.some((w) => text && text.toLowerCase().includes(w));

  const description = req.body?.description || "";
  const image = req.body?.image || "";
  const video = req.body?.video || "";
  if (checkText(description) || checkText(image) || checkText(video)) {
    return res.status(400).json({ message: "Uygunsuz içerik tespit edildi." });
  }
  next();
};
