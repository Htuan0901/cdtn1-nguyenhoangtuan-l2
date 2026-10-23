// AuthService – đăng nhập nhân viên (Buổi 10, TD-12). Lớp ③: không biết HTTP, không viết SQL.
// Ký JWT được tiêm vào qua signToken để test không cần khoá bí mật thật.
const { badRequest, unauthorized, forbidden } = require('../errors');
const { verifyPassword } = require('../policies/passwordPolicy');

const WRONG = 'Sai tên đăng nhập hoặc mật khẩu';

function createAuthService({ staffRepo, signToken }) {
  async function login(rawUsername, password) {
    const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase() : '';
    const fields = [];
    if (!username) fields.push('username');
    if (typeof password !== 'string' || password.length === 0) fields.push('password');
    if (fields.length) throw badRequest('VALIDATION_ERROR', 'Nhập tên đăng nhập và mật khẩu', fields);

    const staff = await staffRepo.findByUsername(username);
    // Cùng một thông báo cho "không có tài khoản" và "sai mật khẩu" – không lộ tên đăng nhập nào tồn tại
    if (!staff || !verifyPassword(password, staff.password_hash)) throw unauthorized('INVALID_CREDENTIALS', WRONG);
    if (!staff.is_active) throw forbidden('Tài khoản đã bị khoá – liên hệ quản lý trung tâm');

    const profile = { staffId: staff.id, role: staff.role, centerCode: staff.center_code, fullName: staff.full_name };
    return { token: signToken(profile), staff: { ...profile, username: staff.username } };
  }
  return { login };
}

module.exports = { createAuthService };
