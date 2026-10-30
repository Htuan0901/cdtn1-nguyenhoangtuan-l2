// Lớp ④ – Truy cập dữ liệu: pool kết nối PostgreSQL và tiện ích giao dịch.
// Mọi lỗi của pg đi qua translate() → DataAccessError (DB_UNAVAILABLE | DUPLICATE_KEY | DB_ERROR).
const { Pool } = require('pg');
const { config } = require('../config');
const { translate } = require('./errors');
const { createLogger } = require('../logger');

const log = createLogger('db');
const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000, // CSDL không trả lời → báo lỗi sau 5 giây, không treo request
});

// BUG-10: CSDL khởi động lại khi API đang chạy → kết nối rảnh trong pool phát sự kiện 'error'.
// Không có listener thì Node.js dừng cả tiến trình. Pool tự bỏ kết nối hỏng; ở đây chỉ ghi WARN.
pool.on('error', (err) => log.warn({ err: { code: err.code, message: err.message } }, 'mất một kết nối rảnh tới CSDL – pool sẽ tạo kết nối mới'));

const rawQuery = pool.query.bind(pool);
pool.query = (...args) => rawQuery(...args).catch((err) => { throw translate(err); });

// "executor" là pool (truy vấn lẻ) hoặc tx (đang trong giao dịch); repository nhận executor
// để service quyết định khi nào cần giao dịch.
async function withTransaction(work) {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    throw translate(err);
  }
  const tx = { query: (...args) => client.query(...args).catch((err) => { throw translate(err); }) };
  let broken = null;
  try {
    await tx.query('BEGIN');
    const result = await work(tx);
    await tx.query('COMMIT');
    return result;
  } catch (err) {
    // NFR5: lỗi ở bất kỳ bước nào → không lưu dở. ROLLBACK hỏng (mất kết nối) thì huỷ hẳn kết nối đó.
    await client.query('ROLLBACK').catch((rollbackErr) => { broken = rollbackErr; });
    throw err;
  } finally {
    client.release(broken || undefined);
  }
}

async function ping() {
  await pool.query('SELECT 1');
}

module.exports = { pool, withTransaction, ping };
