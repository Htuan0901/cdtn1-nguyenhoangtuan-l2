// Lớp ④ DỊCH lỗi kỹ thuật của thư viện pg thành lỗi của ứng dụng (Buổi 11 – xử lý lỗi xuyên lớp).
// Không trả mã HTTP, không ghi log ở đây – middleware lỗi làm việc đó MỘT lần.
class DataAccessError extends Error {
  constructor(code, cause) {
    super(code === 'DB_UNAVAILABLE' ? 'Không kết nối được cơ sở dữ liệu' : 'Lỗi truy cập dữ liệu', { cause });
    this.name = 'DataAccessError';
    this.code = code;              // DB_UNAVAILABLE | DUPLICATE_KEY | IN_USE | DB_ERROR
    this.pgCode = cause && cause.code;
  }
}

const UNAVAILABLE = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN',
  '57P01', '57P02', '57P03', '08000', '08001', '08003', '08004', '08006']);

function translate(err) {
  if (err instanceof DataAccessError) return err;
  if (UNAVAILABLE.has(err.code) || /timeout exceeded when trying to connect|Connection terminated/i.test(err.message)) {
    return new DataAccessError('DB_UNAVAILABLE', err);
  }
  if (err.code === '23505') return new DataAccessError('DUPLICATE_KEY', err);
  if (err.code === '23503') return new DataAccessError('IN_USE', err);   // còn dòng khác tham chiếu (khoá ngoại)
  return new DataAccessError('DB_ERROR', err);
}

module.exports = { DataAccessError, translate };
