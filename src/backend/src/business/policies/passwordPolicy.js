// Mật khẩu nhân viên: băm bằng scrypt (có sẵn trong Node.js, không thêm thư viện) – NFR4.
// Định dạng lưu trong staff.password_hash: scrypt$<salt hex>$<hash hex>
const crypto = require('crypto');

const KEY_LEN = 32;

function hashPassword(plain, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(plain, salt, KEY_LEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const actual = crypto.scryptSync(plain, salt, KEY_LEN);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected); // so sánh thời gian hằng
}

module.exports = { hashPassword, verifyPassword };
