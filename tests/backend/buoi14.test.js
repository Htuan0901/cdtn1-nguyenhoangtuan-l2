// Buổi 14 – test hồi quy cho các lỗi tìm thấy khi chạy test hệ thống (docs/bug-log.md BUG-11…BUG-13). Không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

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
