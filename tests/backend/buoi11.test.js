// Buổi 11 – test hồi quy cho các lỗi tích hợp đã gỡ (docs/bug-log.md). Không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');

delete process.env.FRONTEND_ORIGIN; // kiểm giá trị MẶC ĐỊNH như trên máy vừa clone
const { cors } = require('../../src/backend/src/api/middlewares/cors');

function preflight(origin) {
  const headers = {}; let status = null; let nextCalled = false;
  const res = {
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
    status(s) { status = s; return this; },
    end() {},
  };
  cors({ method: 'OPTIONS', headers: { origin } }, res, () => { nextCalled = true; });
  return { headers, status, nextCalled };
}

test('TC-28 mở giao diện bằng http://127.0.0.1:5173 vẫn gọi được API; origin lạ không được cấp quyền (BUG-08)', () => {
  assert.equal(preflight('http://localhost:5173').headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(preflight('http://127.0.0.1:5173').headers['access-control-allow-origin'], 'http://127.0.0.1:5173');
  const evil = preflight('http://evil.example');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
  assert.equal(evil.status, 204);
});

test('TC-29 tìm phiếu theo SĐT gõ có khoảng trắng/+84 vẫn khớp SĐT đã chuẩn hoá trong CSDL (BUG-03)', async () => {
  const { createTicketService } = require('../../src/backend/src/business/services/ticketService');
  const seen = [];
  const svc = createTicketService({
    ticketRepo: { search: async (f) => { seen.push(f.q); return { total: 0, rows: [] }; } },
    statusLogRepo: {}, customerRepo: {}, deviceRepo: {}, categoryRepo: {}, withTransaction: async () => {}, sla: {},
  });
  const ctx = { centerCode: 'TT-CT01' };
  await svc.listTickets(ctx, { q: '0901 234 567' });
  await svc.listTickets(ctx, { q: '+84 901 234 567' });
  await svc.listTickets(ctx, { q: ' bh-000123/2026 ' });   // mã phiếu: bỏ khoảng trắng, chữ hoa
  assert.deepEqual(seen, ['0901234567', '0901234567', 'BH-000123/2026']);
});

/* ---------- Logging và xử lý lỗi xuyên lớp ---------- */
const { createLogger } = require('../../src/backend/src/logger');
const { DataAccessError, translate } = require('../../src/backend/src/data-access/errors');
const { AppError } = require('../../src/backend/src/business/errors');
const { errorHandler } = require('../../src/backend/src/api/middlewares/errorHandler');

// Bắt các dòng log ghi ra stdout trong lúc chạy fn
function captureStdout(fn) {
  const lines = []; const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    if (String(chunk).startsWith('{"time"')) { lines.push(JSON.parse(chunk)); return true; }
    return orig(chunk, ...rest);
  };
  try { fn(); } finally { process.stdout.write = orig; }
  return lines;
}
function callHandler(err) {
  const res = { statusCode: null, body: null, status(s) { this.statusCode = s; return this; }, json(b) { this.body = b; return this; } };
  const req = { requestId: 'abc12345', method: 'GET', originalUrl: '/api/tickets?q=0901234567', ctx: { staffId: 1 } };
  const logs = captureStdout(() => errorHandler(err, req, res, () => {}));
  return { res, logs };
}

test('TC-30 CSDL mất kết nối → 503 LOI_HE_THONG kèm mã tra cứu; đúng MỘT dòng ERROR có requestId, không lộ SĐT trong query (BUG-09)', () => {
  const pgErr = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
  const { res, logs } = callHandler(translate(pgErr));
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'LOI_HE_THONG');
  assert.match(res.body.message, /Mã tra cứu: abc12345/);
  assert.equal(JSON.stringify(res.body).includes('ECONNREFUSED'), false);   // không lộ chi tiết kỹ thuật
  assert.equal(logs.length, 1);
  assert.equal(logs[0].level, 'ERROR');
  assert.equal(logs[0].requestId, 'abc12345');
  assert.equal(logs[0].path, '/api/tickets');                                // bỏ query chứa SĐT
});

test('TC-31 lỗi nghiệp vụ (409) ghi mức INFO, không ghi ERROR; lỗi lạ không rõ nguồn → 500', () => {
  const a = callHandler(new AppError(409, 'ALREADY_REVIEWED', 'Phiếu đã được xét duyệt'));
  assert.equal(a.res.statusCode, 409);
  assert.deepEqual(a.logs.map((l) => l.level), ['INFO']);
  const b = callHandler(new TypeError('x is undefined'));
  assert.equal(b.res.statusCode, 500);
  assert.deepEqual(b.logs.map((l) => l.level), ['ERROR']);
});

test('TC-32 logger: có thời điểm +07:00, mức, ngữ cảnh; tự che mật khẩu, token, SĐT; tôn trọng LOG_LEVEL', () => {
  const lines = [];
  const log = createLogger('test', { sink: (l) => lines.push(JSON.parse(l)), level: 'info' });
  log.debug({}, 'không được ghi ở mức info');
  log.info({ ticketCode: 'BH-000001/2026', password: 'Mekong@2026', headers: { authorization: 'Bearer eyJ' }, phone: '0901234567' }, 'thử');
  assert.equal(lines.length, 1);
  assert.match(lines[0].time, /\+07:00$/);
  assert.equal(lines[0].level, 'INFO');
  assert.equal(lines[0].ticketCode, 'BH-000001/2026');
  const raw = JSON.stringify(lines[0]);
  assert.equal(/Mekong@2026|eyJ|0901234567/.test(raw), false);
});

test('TC-33 dịch lỗi pg ở lớp dữ liệu: mất kết nối → DB_UNAVAILABLE, trùng khoá 23505 → DUPLICATE_KEY, còn lại → DB_ERROR', () => {
  assert.equal(translate(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })).code, 'DB_UNAVAILABLE');
  assert.equal(translate(Object.assign(new Error('x'), { code: '57P01' })).code, 'DB_UNAVAILABLE');
  assert.equal(translate(Object.assign(new Error('dup'), { code: '23505' })).code, 'DUPLICATE_KEY');
  const other = translate(Object.assign(new Error('syntax'), { code: '42601' }));
  assert.ok(other instanceof DataAccessError);
  assert.equal(other.code, 'DB_ERROR');
  assert.equal(other.cause.code, '42601');   // giữ nguyên nhân gốc để ghi log
});

test('TC-34 pool phát sự kiện error (CSDL khởi động lại) → API KHÔNG chết, chỉ ghi WARN (BUG-10)', () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://u:p@127.0.0.1:1/x'; // không kết nối thật
  const { pool } = require('../../src/backend/src/data-access/db');
  assert.ok(pool.listenerCount('error') >= 1);
  const logs = captureStdout(() => pool.emit('error', Object.assign(new Error('terminating connection'), { code: '57P01' })));
  assert.deepEqual(logs.map((l) => l.level), ['WARN']);
});
