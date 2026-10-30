// Middleware lỗi DUY NHẤT (Buổi 11): ánh xạ loại lỗi → mã HTTP + JSON { code, message, fields? }
// và GHI LOG ĐÚNG MỘT LẦN, kèm requestId. Không gửi stack, câu SQL hay tên bảng cho người dùng.
const { AppError } = require('../../business/errors');
const { DataAccessError } = require('../../data-access/errors');
const { createLogger } = require('../../logger');

const log = createLogger('http');
const where = (req) => ({ requestId: req.requestId, method: req.method, path: String(req.originalUrl || req.url).split('?')[0] });

function errorHandler(err, req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    log.info({ ...where(req), status: 400, code: 'INVALID_JSON' }, 'body không phải JSON');
    return res.status(400).json({ code: 'INVALID_JSON', message: 'Body không phải JSON hợp lệ' });
  }
  if (err instanceof AppError) {
    // Lỗi nghiệp vụ / dữ liệu vào: là chuyện bình thường của người dùng → INFO, không phải ERROR
    log.info({ ...where(req), status: err.status, code: err.code, staffId: req.ctx && req.ctx.staffId }, 'từ chối yêu cầu');
    return res.status(err.status).json({ code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) });
  }
  // Lỗi hệ thống: ERROR + ngăn xếp CHỈ trong log; người dùng nhận thông điệp chung + mã tra cứu
  const status = err instanceof DataAccessError && err.code === 'DB_UNAVAILABLE' ? 503 : 500;
  log.error({ ...where(req), status, err, cause: err.cause && { code: err.cause.code, message: err.cause.message } }, 'lỗi hệ thống');
  return res.status(status).json({
    code: 'LOI_HE_THONG',
    message: `Hệ thống đang gặp sự cố. Vui lòng thử lại sau. Mã tra cứu: ${req.requestId}`,
    requestId: req.requestId,
  });
}

function notFoundRoute(_req, res) {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Không có endpoint này' });
}

module.exports = { errorHandler, notFoundRoute };
