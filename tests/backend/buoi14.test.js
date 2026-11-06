// Buổi 14 – test hồi quy cho các lỗi tìm thấy khi chạy test hệ thống (docs/bug-log.md BUG-11…BUG-13). Không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validate } = require('../../src/backend/src/api/middlewares/validator');
const { errorHandler } = require('../../src/backend/src/api/middlewares/errorHandler');

// Gọi middleware validate như Express: trả về lỗi truyền cho next (hoặc undefined nếu hợp lệ)
function runValidate(name, source, data) {
  let passed;
  validate(name, source)({ [source]: data }, {}, (err) => { passed = err; });
  return passed;
}

test('TC-43 GET /tickets: q dạng mảng hoặc đối tượng → 400 VALIDATION_ERROR [q], không tới lớp nghiệp vụ (BUG-12)', () => {
  // Express 4 (query parser "extended"): ?q=a&q=b → ['a','b'];  ?q[x]=1 → { x: '1' }
  for (const q of [['0901234567', 'BH-000001'], { x: '1' }]) {
    const err = runValidate('listTickets', 'query', { q });
    assert.equal(err && err.status, 400);
    assert.deepEqual(err.fields, ['q']);
  }
});

test('TC-44 GET /tickets: q là chuỗi 100 ký tự được nhận, 101 ký tự bị từ chối (biên, BUG-12)', () => {
  assert.equal(runValidate('listTickets', 'query', { q: 'a'.repeat(100) }), undefined);
  assert.deepEqual(runValidate('listTickets', 'query', { q: 'a'.repeat(101) }).fields, ['q']);
});

test('TC-45 body JSON vượt giới hạn 100 KB → 413 PAYLOAD_TOO_LARGE, log INFO thay vì ERROR (BUG-13)', () => {
  // lỗi do express.json (body-parser) ném ra khi body quá lớn
  const err = Object.assign(new Error('request entity too large'), { type: 'entity.too.large', status: 413, statusCode: 413 });
  const res = { statusCode: null, body: null, status(s) { this.statusCode = s; return this; }, json(b) { this.body = b; return this; } };
  const lines = []; const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => (String(chunk).startsWith('{"time"') ? (lines.push(JSON.parse(chunk)), true) : orig(chunk, ...rest));
  try { errorHandler(err, { requestId: 'abc12345', method: 'POST', originalUrl: '/api/customers' }, res, () => {}); } finally { process.stdout.write = orig; }
  assert.equal(res.statusCode, 413);
  assert.equal(res.body.code, 'PAYLOAD_TOO_LARGE');
  assert.equal(lines.length, 1);
  assert.equal(lines[0].level, 'INFO');
});

test('TC-46 không còn mật khẩu / chuỗi kết nối có mật khẩu trong tài liệu và cấu hình đã commit (BUG-11)', () => {
  const ROOT = path.join(__dirname, '..', '..');
  const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []));
  const files = ['README.md', 'docker-compose.yml', '.env.example', ...walk('docs')].filter((f) => fs.existsSync(path.join(ROOT, f)));
  const ok = (pw, f) => pw.startsWith('${') || pw.startsWith('<') || (pw === 'doi_mat_khau_nay' && f === '.env.example');
  const leaks = [];
  for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/postgres(?:ql)?:\/\/[^\s:@/`]+:([^\s@`]+)@/g)) if (!ok(m[1], f)) leaks.push(`${f}:${i + 1}`);
      for (const m of line.matchAll(/(?:POSTGRES|DB)_PASSWORD[=:]\s*([^\s`'"|]+)/g)) if (!ok(m[1], f)) leaks.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(leaks, []);
});
