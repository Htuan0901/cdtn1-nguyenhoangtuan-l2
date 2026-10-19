// Phát JWT cho một nhân viên mẫu để gọi thử API (chưa có màn hình đăng nhập – xem TD-08).
// Cách dùng: npm run token -- nv01     (nv01 | ql01 | nv02)
const jwt = require('jsonwebtoken');
const { config } = require('../src/config');
const { pool } = require('../src/data-access/db');
const staffRepository = require('../src/data-access/repositories/staffRepository');

async function makeToken(username) {
  const s = await staffRepository.findByUsername(username);
  if (!s || !s.is_active) throw new Error(`Không có nhân viên đang hoạt động: ${username}`);
  return jwt.sign(
    { staffId: s.id, role: s.role, centerCode: s.center_code, fullName: s.full_name },
    config.jwtSecret,
    { expiresIn: '8h' },
  );
}

module.exports = { makeToken };

if (require.main === module) {
  makeToken(process.argv[2] || 'nv01')
    .then((t) => console.log(t))
    .catch((e) => { console.error(e.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
