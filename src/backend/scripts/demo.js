// Gọi thử các endpoint chính và in kết quả – chạy khi server đang bật (npm start ở cửa sổ khác).
// Cách dùng: npm run demo     → chụp màn hình kết quả lưu vào docs/anh-ket-qua/
const { config } = require('../src/config');
const { pool } = require('../src/data-access/db');
const { makeToken } = require('./make-token');

const BASE = `http://localhost:${config.port}/api`;

async function call(title, method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  console.log(`\n=== ${title}`);
  console.log(`$ ${method} ${path}${body ? ' ' + JSON.stringify(body) : ''}`);
  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

(async () => {
  const nv = await makeToken('nv01');
  const ql = await makeToken('ql01');
  const nvKhac = await makeToken('nv02');

  await call('1. Tra cứu khách hàng (UC01, FR1)', 'POST', '/customers/lookup', nv, { phone: '+84 901 234 567' });
  await call('2. Tra cứu SĐT không hợp lệ (UC04 – 2a)', 'POST', '/customers/lookup', nv, { phone: '09012' });
  const created = await call('3. Tạo phiếu bảo hành – còn bảo hành (UC04, FR4–FR6)', 'POST', '/tickets', nv,
    { customerId: 1, deviceId: 1, issueDesc: 'Màn hình nhấp nháy khi mở máy', categoryCode: 'MAN_HINH' });
  const pending = await call('4. Tạo phiếu – thiết bị không có ngày mua (UC04 – 8a)', 'POST', '/tickets', nv,
    { customerId: 3, deviceId: 3, issueDesc: 'Không sạc được pin', categoryCode: 'SAC' });
  await call('5. Tạo phiếu thiếu mô tả lỗi (UC04 – 10a)', 'POST', '/tickets', nv,
    { customerId: 1, deviceId: 1, issueDesc: '   ', categoryCode: 'MAN_HINH' });
  await call('6. Danh sách phiếu của trung tâm (UC06, FR8)', 'GET', '/tickets?page=1', nv);
  const code = encodeURIComponent(pending.ticketCode);
  await call('7. Nhân viên trung tâm khác xem phiếu (403 – QT-14)', 'GET', `/tickets/${code}`, nvKhac);
  await call('8. Xét duyệt thiếu ghi chú (UC07 – 5a)', 'POST', `/tickets/${code}/review`, ql, { decision: 'CHAP_NHAN', note: '' });
  await call('9. Quản lý xét duyệt chấp nhận bảo hành (UC07, FR7)', 'POST', `/tickets/${code}/review`, ql,
    { decision: 'CHAP_NHAN', note: 'Khách cung cấp tin nhắn xác nhận đơn hàng' });
  await call('10. Xét duyệt lần hai (UC07 – 6a)', 'POST', `/tickets/${code}/review`, ql, { decision: 'KHONG_CHAP_NHAN', note: 'Thử ghi đè' });
  await call('11. Gọi API không có JWT (401 – NFR4)', 'GET', '/tickets', null);
  console.log(`\nĐã tạo phiếu: ${created.ticketCode}, ${pending.ticketCode}`);
  await pool.end();
})().catch(async (e) => { console.error('Lỗi demo:', e.message, '\n→ Kiểm tra server đã chạy (npm start) chưa.'); await pool.end(); process.exitCode = 1; });
