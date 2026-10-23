// CORS: cho phép giao diện (chạy ở cổng khác, mặc định http://localhost:5173) gọi API.
// Chỉ mở cho các địa chỉ trong FRONTEND_ORIGIN, không dùng "*" (NFR4).
const { config } = require('../../config');

function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && config.frontendOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
}

module.exports = { cors };
