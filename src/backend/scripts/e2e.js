// Buổi 10 – chạy LUỒNG CHÍNH end-to-end qua HTTP, đúng thứ tự giao diện M2 → M3 → M1 gọi API,
// trên DỮ LIỆU MẪU THẬT đã nạp bằng npm run seed. Mỗi bước in đầu vào → đầu ra; bước nào sai thì dừng.
// Cần backend đang chạy (npm start). Cách dùng: npm run e2e
const { config } = require('../src/config');

const BASE = `http://localhost:${config.port}/api`;
const PASSWORD = 'Mekong@2026';
const PHONE = '0881 010 061';         // dòng đầu customers_raw.csv – Lê Bảo Tâm (dữ liệu mẫu của học phần)
const SERIAL = `E2E-${Date.now() % 1e8}`; // thiết bị mới mỗi lần chạy → chạy lại nhiều lần được
let step = 0;

async function call(title, method, path, { token, body, expect }) {
  step += 1;
  const t0 = Date.now();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(10000), // không chờ quá 10 giây (không "treo")
  });
  const data = await res.json().catch(() => null);
  const ok = res.status === expect;
  console.log(`${ok ? '✓' : '✗'} Bước ${step}. ${title}`);
  const shown = body && JSON.stringify({ ...body, ...(body.password && { password: '***' }) }); // không in mật khẩu
  console.log(`    ${method} ${path}${shown ? ` ${shown}` : ''}`);
  console.log(`    → HTTP ${res.status} (${Date.now() - t0} ms)`);
  if (!ok) {
    console.log(`    Mong đợi HTTP ${expect}, nhận:`, data);
    throw new Error(`Luồng đứt ở bước ${step}: ${title}`);
  }
  return data;
}

(async () => {
  console.log(`Luồng chính UC04 → UC08 → UC07 → UC06 trên ${BASE}\n`);
  const nv = await call('Nhân viên tiếp nhận đăng nhập', 'POST', '/auth/login',
    { body: { username: 'nv01', password: PASSWORD }, expect: 200 });
  console.log(`    ${nv.staff.fullName} · ${nv.staff.centerCode}`);

  const cus = await call('Tra cứu khách hàng theo SĐT (UC01, QT-02)', 'POST', '/customers/lookup',
    { token: nv.token, body: { phone: PHONE }, expect: 200 });
  console.log(`    ${cus.fullName} · ${cus.phone} · ${cus.devices.length} thiết bị đã có`);

  await call('Tra cứu Serial/IMEI chưa có (UC03)', 'POST', '/devices',
    { token: nv.token, body: { customerId: cus.customerId, serialImei: SERIAL }, expect: 404 });
  const dev = await call('Ghi nhận thiết bị mới KHÔNG có ngày mua (UC03)', 'POST', '/devices', {
    token: nv.token, expect: 201,
    body: { customerId: cus.customerId, serialImei: SERIAL, modelName: 'Mekong A5', warrantyMonths: 12 },
  });

  const cats = await call('Lấy danh mục nhóm sự cố (UC05)', 'GET', '/issue-categories', { token: nv.token, expect: 200 });
  console.log(`    ${cats.items.map((c) => c.code).join(', ')}`);

  const t = await call('Tạo phiếu bảo hành (UC04)', 'POST', '/tickets', {
    token: nv.token, expect: 201,
    body: { customerId: cus.customerId, deviceId: dev.deviceId, issueDesc: 'pin tụt nhanh, máy nóng khi sạc', categoryCode: 'PIN' },
  });
  console.log(`    ${t.ticketCode} · ${t.status} · ${t.warrantyResult} · hạn ${t.dueAt}`);
  const code = encodeURIComponent(t.ticketCode);

  const detail = await call('Xem chi tiết phiếu vừa tạo (UC08)', 'GET', `/tickets/${code}`, { token: nv.token, expect: 200 });
  console.log(`    ${detail.customerName} · ${detail.device.serialImei} · lịch sử: ${detail.history.map((h) => h.toStatus).join(' → ')}`);

  const ql = await call('Quản lý trung tâm đăng nhập', 'POST', '/auth/login',
    { body: { username: 'ql01', password: PASSWORD }, expect: 200 });
  const reviewed = await call('Quản lý xét duyệt: chấp nhận bảo hành (UC07)', 'POST', `/tickets/${code}/review`, {
    token: ql.token, expect: 200, body: { decision: 'CHAP_NHAN', note: 'Khách cung cấp tin nhắn xác nhận đơn hàng' },
  });
  console.log(`    ${reviewed.status} · ${reviewed.warrantyResult} · ${reviewed.history.length} dòng lịch sử`);

  const list = await call('Phiếu mới xuất hiện trong danh sách trung tâm (UC06)', 'GET', `/tickets?q=${code}`,
    { token: nv.token, expect: 200 });
  if (list.items[0]?.ticketCode !== t.ticketCode) throw new Error('Không thấy phiếu vừa tạo trong danh sách');
  console.log(`    ${list.items[0].ticketCode} · ${list.items[0].status} · ${list.items[0].phone}`);

  console.log(`\nKẾT LUẬN: luồng chính chạy END-TO-END ${step}/${step} bước, không lỗi.`);
})().catch((e) => {
  console.error(`\nKẾT LUẬN: THẤT BẠI – ${e.cause?.code === 'ECONNREFUSED' ? 'backend chưa chạy (npm start)' : e.message}`);
  process.exitCode = 1;
});
