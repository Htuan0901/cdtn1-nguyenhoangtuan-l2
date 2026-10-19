// AuthMiddleware: xác thực JWT và gắn ngữ cảnh người gọi (staffId, role, centerCode) – NFR4.
const jwt = require('jsonwebtoken');
const { config } = require('../../config');
const { AppError, forbidden } = require('../../business/errors');

function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'UNAUTHORIZED', 'Thiếu JWT trong header Authorization'));
  try {
    const p = jwt.verify(token, config.jwtSecret);
    req.ctx = { staffId: p.staffId, role: p.role, centerCode: p.centerCode, fullName: p.fullName };
    return next();
  } catch {
    return next(new AppError(401, 'UNAUTHORIZED', 'JWT không hợp lệ hoặc đã hết hạn'));
  }
}

const requireRole = (...roles) => (req, _res, next) =>
  (roles.includes(req.ctx.role) ? next() : next(forbidden()));

module.exports = { authenticate, requireRole };
