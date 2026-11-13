// Khởi động bản deploy (Render): migrate → nạp dữ liệu mẫu → mở API, giống lệnh `command` của docker-compose.yml.
// Viết bằng Node thay cho `sh -c "a && b && c"` vì nền tảng có thể tách chuỗi lệnh khác Docker Compose (TD-27).
// Bước nào lỗi thì dừng với mã thoát khác 0 – nền tảng báo deploy hỏng, không mở API trên CSDL dở dang.
const { execFileSync } = require('child_process');
const path = require('path');

for (const script of ['migrate.js', 'seed-mau.js']) {
  console.log(`==> node scripts/${script}`);
  execFileSync(process.execPath, [path.join(__dirname, script)], { stdio: 'inherit', env: process.env });
}
console.log('==> node src/server.js');
require('../src/server.js');
