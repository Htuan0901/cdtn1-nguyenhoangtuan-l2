// Đọc cấu hình từ biến môi trường (.env ở thư mục gốc repo, nạp bằng node --env-file).
const path = require('path');

const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  slaConfigPath: path.join(__dirname, '..', 'config', 'sla.config.json'),
  pageSize: 20, // NFR3: phân trang 20 dòng tại CSDL
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Địa chỉ giao diện được phép gọi API (CORS) – nhiều địa chỉ cách nhau bằng dấu phẩy
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
};

function assertConfig() {
  const missing = ['databaseUrl', 'jwtSecret'].filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(`Thiếu biến môi trường: ${missing.join(', ')} – xem .env.example`);
  }
}

module.exports = { config, assertConfig };
