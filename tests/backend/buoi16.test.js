// Buổi 15–16 · Bài tập 3 – test hồi quy cho BUG-14 (bộ test không chạy được trong container)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseEnv, loadEnv } = require('../../src/backend/scripts/load-env');

const ROOT = path.join(__dirname, '..', '..');

test('TC-47 load-env đọc KEY=VALUE như --env-file: bỏ dòng trống, chú thích, dấu nháy, xuống dòng CRLF (BUG-14)', () => {
  const v = parseEnv('# chú thích\r\nPORT=3000\r\n\r\nJWT_SECRET="abc def"\nLOG_LEVEL=\'info\'\nFRONTEND_ORIGIN=http://a,http://b\nKHONG_HOP_LE\n');
  assert.deepEqual(v, { PORT: '3000', JWT_SECRET: 'abc def', LOG_LEVEL: 'info', FRONTEND_ORIGIN: 'http://a,http://b' });
});

test('TC-48 load-env: KHÔNG có tệp .env thì không lỗi; biến do docker compose truyền vào không bị ghi đè (BUG-14)', () => {
  const env = { DATABASE_URL: 'tu-docker-compose' };
  assert.deepEqual(loadEnv(path.join(os.tmpdir(), `khong-co-${process.pid}.env`), env), { loaded: false, file: path.join(os.tmpdir(), `khong-co-${process.pid}.env`) });
  const f = path.join(os.tmpdir(), `co-${process.pid}.env`);
  fs.writeFileSync(f, 'DATABASE_URL=tu-tep\nPORT=3001\n');
  try {
    assert.equal(loadEnv(f, env).loaded, true);
    assert.equal(env.DATABASE_URL, 'tu-docker-compose'); // môi trường thắng tệp
    assert.equal(env.PORT, '3001');
  } finally { fs.unlinkSync(f); }
});

test('TC-49 đóng gói: image chứa đủ test, dữ liệu mẫu, tài liệu và KHÔNG chứa .env; npm script không phụ thuộc --env-file (BUG-14)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'backend', 'package.json'), 'utf8'));
  for (const [name, cmd] of Object.entries(pkg.scripts)) assert.ok(!cmd.includes('--env-file'), `script ${name} còn --env-file`);
  if (fs.existsSync(path.join(ROOT, '.dockerignore'))) {
    // Trên máy dev / CI: kiểm cấu hình đóng gói
    const ignore = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
    assert.ok(ignore.includes('.env'), '.dockerignore phải loại .env');
    for (const x of ['tests', 'docs', 'data', 'src']) assert.ok(!ignore.includes(x), `.dockerignore không được loại ${x}/`);
    const df = fs.readFileSync(path.join(ROOT, 'src', 'backend', 'Dockerfile'), 'utf8');
    assert.match(df, /WORKDIR \/repo\/src\/backend/);
    assert.match(df, /COPY .*tests \/repo\/tests/);
  } else {
    // Bên trong container: bố cục giống repo và không có secret
    for (const x of ['tests/backend', 'data/mau', 'docs', 'src/backend/node_modules']) assert.ok(fs.existsSync(path.join(ROOT, x)), `thiếu ${x}`);
    assert.ok(!fs.existsSync(path.join(ROOT, '.env')), 'image không được chứa .env');
  }
});
