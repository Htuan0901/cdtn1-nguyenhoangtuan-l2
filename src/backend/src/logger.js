// Logger có cấu trúc (Buổi 11): mỗi dòng MỘT sự kiện dạng JSON ra stdout, có thời điểm (+07:00), mức, ngữ cảnh.
// - Mức lấy từ biến môi trường LOG_LEVEL (debug | info | warn | error | silent), mặc định info.
// - Tự CHE trường nhạy cảm (mật khẩu, token, số điện thoại, chuỗi kết nối) kể cả khi lỡ truyền vào.
// - Không dùng thư viện ngoài (không thêm phụ thuộc chỉ để ghi log).
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const SENSITIVE = /pass(word)?|token|authorization|secret|phone|sodienthoai|database_?url|cookie/i;
const MASK = '[ĐÃ CHE]';

const vnTime = (d = new Date()) => new Date(d.getTime() + 7 * 3600e3).toISOString().replace('Z', '+07:00');

function redact(value, depth = 0) {
  if (value instanceof Error) {
    return { name: value.name, code: value.code, message: value.message, stack: value.stack };
  }
  if (!value || typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) ? MASK : redact(v, depth + 1)]));
}

function createLogger(name, { sink = (line) => process.stdout.write(`${line}\n`), level } = {}) {
  const threshold = () => LEVELS[level || process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;
  const write = (lvl) => (ctx, msg) => {
    if (LEVELS[lvl] < threshold()) return;
    const context = typeof ctx === 'string' ? {} : redact(ctx || {});
    sink(JSON.stringify({ time: vnTime(), level: lvl.toUpperCase(), logger: name, msg: typeof ctx === 'string' ? ctx : msg, ...context }));
  };
  return { debug: write('debug'), info: write('info'), warn: write('warn'), error: write('error') };
}

module.exports = { createLogger, redact, vnTime };
