// Buổi 12 – kiểm CRUD đủ 4 thao tác cho HAI thực thể (Khách hàng, Thiết bị) qua HTTP, kể cả các trường hợp bị chặn.
// Tự dọn dữ liệu thử (xoá lại thứ vừa tạo) → chạy lại nhiều lần không để rác. Cần backend đang chạy.
// Cách dùng: npm run crud
const { config } = require('../src/config');

const BASE = `http://localhost:${config.port}/api`;
const PHONE = `09${String(Date.now() % 1e8).padStart(8, '0')}`;
let step = 0;

async function call(title, method, path, { token, body, expect }) {
  step += 1;
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  const ok = res.status === expect;
  const shown = body && JSON.stringify({ ...body, ...(body.password && { password: '***' }) });
  console.log(`${ok ? '✓' : '✗'} ${String(step).padStart(2)}. ${title}`);
  console.log(`     ${method} ${path}${shown ? ` ${shown}` : ''} → HTTP ${res.status}${data?.code ? ` ${data.code}` : ''}`);
  if (!ok) throw new Error(`mong đợi HTTP ${expect}, nhận ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
const login = async (u) => (await call(`Đăng nhập ${u}`, 'POST', '/auth/login', { body: { username: u, password: 'Mekong@2026' }, expect: 200 })).token;

(async () => {
  console.log(`CRUD Khách hàng + Thiết bị trên ${BASE}\n`);
  const nv = await login('nv01');
  const ql = await login('ql01');

  console.log('\n— KHÁCH HÀNG —');
  const c = await call('C  Tạo khách hàng', 'POST', '/customers', { token: nv, body: { fullName: 'Khách Thử CRUD', phone: PHONE }, expect: 201 });
  const cid = c.customerId;
  await call('R  Danh sách, tìm theo SĐT', 'GET', `/customers?q=${PHONE}`, { token: nv, expect: 200 });
  await call('R  Chi tiết', 'GET', `/customers/${cid}`, { token: ql, expect: 200 });
  await call('U  Sửa họ tên', 'PATCH', `/customers/${cid}`, { token: nv, body: { fullName: 'Khách Thử CRUD Đã Sửa' }, expect: 200 });
  await call('U  Đổi sang SĐT của khách khác → bị chặn (QT-01)', 'PATCH', `/customers/${cid}`, { token: nv, body: { phone: '0901234567' }, expect: 409 });

  console.log('\n— THIẾT BỊ —');
  const d = await call('C  Ghi nhận thiết bị', 'POST', '/devices', { token: nv, body: { customerId: cid, serialImei: `CRUD-${PHONE}`, modelName: 'Mekong A3' }, expect: 201 });
  await call('R  Chi tiết', 'GET', `/devices/${d.deviceId}`, { token: nv, expect: 200 });
  await call('U  Sửa ngày mua, số tháng bảo hành', 'PATCH', `/devices/${d.deviceId}`, { token: nv, body: { purchaseDate: '2026-05-01', warrantyMonths: 18 }, expect: 200 });
  await call('U  Sửa Serial/IMEI → bị chặn (QT-03)', 'PATCH', `/devices/${d.deviceId}`, { token: nv, body: { serialImei: 'KHAC' }, expect: 400 });

  console.log('\n— XOÁ (chỉ Quản lý, có ràng buộc) —');
  await call('D  Nhân viên xoá thiết bị → 403', 'DELETE', `/devices/${d.deviceId}`, { token: nv, expect: 403 });
  await call('D  Xoá khách đang có thiết bị → 409', 'DELETE', `/customers/${cid}`, { token: ql, expect: 409 });
  await call('D  Xoá thiết bị đã có phiếu (thiết bị mẫu số 1) → 409', 'DELETE', '/devices/1', { token: ql, expect: 409 });
  await call('D  Xoá thiết bị', 'DELETE', `/devices/${d.deviceId}`, { token: ql, expect: 204 });
  await call('D  Xoá khách hàng', 'DELETE', `/customers/${cid}`, { token: ql, expect: 204 });
  await call('R  Đọc lại sau khi xoá → 404', 'GET', `/customers/${cid}`, { token: ql, expect: 404 });

  console.log(`\nKẾT LUẬN: CRUD 2 thực thể ${step}/${step} bước đúng mã HTTP; dữ liệu thử đã được dọn.`);
})().catch((e) => {
  console.error(`\nKẾT LUẬN: THẤT BẠI ở bước ${step} – ${e.cause?.code === 'ECONNREFUSED' ? 'backend chưa chạy (npm start)' : e.message}`);
  process.exitCode = 1;
});
