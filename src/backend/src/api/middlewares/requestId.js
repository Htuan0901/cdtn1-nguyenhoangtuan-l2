// Gắn mã tra cứu (requestId) cho mỗi request: có trong mọi dòng log và trong header X-Request-Id.
// Lỗi 5xx đưa mã này cho người dùng để báo lại; kỹ sư dùng mã để tìm đúng dòng log.
const crypto = require('crypto');

function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  req.requestId = typeof incoming === 'string' && /^[\w-]{6,64}$/.test(incoming) ? incoming : crypto.randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = { requestId };
