// Lỗi nghiệp vụ có mã lỗi và mã HTTP; lớp API chuyển thành JSON { code, message }.
class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

const badRequest = (code, message, fields) => new AppError(400, code, message, fields);
const unauthorized = (code, message) => new AppError(401, code, message);
const forbidden = (message = 'Không đủ quyền thực hiện thao tác này') => new AppError(403, 'FORBIDDEN', message);
const notFound = (code, message) => new AppError(404, code, message);
const conflict = (code, message) => new AppError(409, code, message);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
