const rateLimitMap = new Map();

module.exports = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika
  const maxRequests = 30;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  const timestamps = rateLimitMap.get(ip).filter((ts) => now - ts < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length > maxRequests) {
    return res
      .status(429)
      .json({ message: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." });
  }
  next();
};
