// Chuyển mọi lỗi thành JSON thống nhất { code, message, fields? } (docs/api-contract.md mục 1).
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'INVALID_JSON', message: 'Body không phải JSON hợp lệ' });
  }
  if (err.status && err.code) {
    return res.status(err.status).json({ code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) });
  }
  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống, vui lòng thử lại' });
}

function notFoundRoute(_req, res) {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Không có endpoint này' });
}

module.exports = { errorHandler, notFoundRoute };
