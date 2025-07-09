const userActionMap = new Map();

module.exports = (req, res, next) => {
  const userId = req.user && (req.user._id || req.user.id || req.user.userId);
  if (!userId) return next();
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika
  const maxActions = 10;

  if (!userActionMap.has(userId)) {
    userActionMap.set(userId, []);
  }
  const timestamps = userActionMap
    .get(userId)
    .filter((ts) => now - ts < windowMs);
  timestamps.push(now);
  userActionMap.set(userId, timestamps);

  if (timestamps.length > maxActions) {
    return res
      .status(429)
      .json({ message: "Çok fazla işlem. Lütfen daha sonra tekrar deneyin." });
  }
  next();
};
