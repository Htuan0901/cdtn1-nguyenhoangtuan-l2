// Ghi VÍ DỤ THẬT cho docs/api-docs.md (Bài tập 3 · S1): gọi đủ 17 endpoint trên hệ thống ĐANG CHẠY,
// chép nguyên request / response vào giữa các cặp dấu <!-- vd:X --> … <!-- /vd:X --> trong tài liệu.
// Chạy từ gốc repo, sau khi docker compose up:   node src/backend/scripts/api-examples.js
// Chỉ dùng HTTP (fetch có sẵn của Node 20), không cần CSDL, không cần npm install.
// Token trong ví dụ được thay bằng "eyJ…(redacted)", mật khẩu bằng "<sample password>": không có secret nào vào tài liệu.
// Mỗi lần chạy tạo thêm 3 khách hàng mẫu "API Example …" (2 bị xoá lại trong ví dụ DELETE).
const fs = require('fs');
const path = require('path');

const BASE = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const PASSWORD = 'Mekong@2026';               // mật khẩu tài khoản MẪU của seed (migration 003), không phải secret
const DOC = path.join(__dirname, '..', '..', '..', 'docs', 'api-docs.md');
const REDACTED = 'eyJ…(redacted)';

function redact(v) {
  if (Array.isArray(v)) return v.map(redact);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'token' ? REDACTED : k === 'password' && x === PASSWORD ? '<sample password>' : redact(x)]));
  }
  return v;
}

async function call(method, url, { token, body, who } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { method, url, who, body, status: res.status, data, token };
}

function render(x) {
  const lines = [`${x.method} ${x.url}`];
  if (x.token) lines.push(`Authorization: Bearer <JWT of ${x.who}>`);
  if (x.body !== undefined) lines.push('Content-Type: application/json', '', JSON.stringify(redact(x.body)));
  const out = ['```http', ...lines, '```', `Response \`${x.status}\``];
  if (x.data === null) out.push('_(no body)_');
  else out.push('```json', JSON.stringify(redact(x.data), null, 2), '```');
  return out.join('\n');
}

const examples = {};   // id → { ok: [...], err: [...] }
const problems = [];
function keep(id, kind, x, expect) {
  if (x.status !== expect) problems.push(`${id} ${kind}: ${x.method} ${x.url} → ${x.status}, mong đợi ${expect} ${JSON.stringify(x.data)}`);
  (examples[id] ||= { ok: [], err: [] })[kind].push(x);
  return x;
}

const today = (d = 0) => new Date(Date.now() + 7 * 3600e3 + d * 864e5).toISOString().slice(0, 10);

async function main() {
  const stamp = Date.now().toString().slice(-8);
  keep('health', 'ok', await call('GET', '/health'), 200);

  const login = keep('login', 'ok', await call('POST', '/api/auth/login', { body: { username: 'nv01', password: PASSWORD } }), 200);
  keep('login', 'err', await call('POST', '/api/auth/login', { body: { username: 'nv01', password: 'wrong-password' } }), 401);
  const nv = login.data && login.data.token;
  if (!nv) throw new Error(`Không đăng nhập được nv01 (${login.status}) – hệ thống đã chạy và nạp dữ liệu mẫu chưa?`);
  const ql = (await call('POST', '/api/auth/login', { body: { username: 'ql01', password: PASSWORD } })).data.token;
  const nv2 = (await call('POST', '/api/auth/login', { body: { username: 'nv02', password: PASSWORD } })).data.token;
  const A = { token: nv, who: 'nv01' }; const Q = { token: ql, who: 'ql01' };

  keep('lookup', 'ok', await call('POST', '/api/customers/lookup', { ...A, body: { phone: '+84 901 234 567' } }), 200);
  keep('lookup', 'err', await call('POST', '/api/customers/lookup', { ...A, body: { phone: '09012' } }), 400);

  keep('list-customers', 'ok', await call('GET', '/api/customers?q=0901%20234%20567', A), 200);
  keep('list-customers', 'err', await call('GET', '/api/customers?page=10001', A), 400);

  keep('get-customer', 'ok', await call('GET', '/api/customers/1', Q), 200);
  keep('get-customer', 'err', await call('GET', '/api/customers/999999', A), 404);

  const phone = `09${stamp}`;
  const cust = keep('create-customer', 'ok', await call('POST', '/api/customers', { ...A, body: { fullName: 'API Example Customer', phone } }), 201).data;
  keep('create-customer', 'err', await call('POST', '/api/customers', { ...A, body: { fullName: 'Duplicate Phone', phone } }), 409);

  keep('update-customer', 'ok', await call('PATCH', `/api/customers/${cust.customerId}`, { ...A, body: { fullName: 'API Example Customer (edited)' } }), 200);
  keep('update-customer', 'err', await call('PATCH', `/api/customers/${cust.customerId}`, { ...A, body: {} }), 400);

  const dev = keep('register-device', 'ok', await call('POST', '/api/devices', { ...A, body: {
    customerId: cust.customerId, serialImei: `API-EX-${stamp}`, modelName: 'Mekong X5', purchaseDate: today(-30), warrantyMonths: 12 } }), 201).data;
  keep('register-device', 'err', await call('POST', '/api/devices', { ...A, body: { customerId: cust.customerId, serialImei: 'MM-IMEI-000123' } }), 409);

  keep('get-device', 'ok', await call('GET', `/api/devices/${dev.deviceId}`, A), 200);
  keep('get-device', 'err', await call('GET', '/api/devices/999999', A), 404);

  keep('update-device', 'ok', await call('PATCH', `/api/devices/${dev.deviceId}`, { ...A, body: { warrantyMonths: 24 } }), 200);
  keep('update-device', 'err', await call('PATCH', `/api/devices/${dev.deviceId}`, { ...A, body: { serialImei: 'NEW-SERIAL' } }), 400);

  keep('categories', 'ok', await call('GET', '/api/issue-categories', A), 200);
  keep('categories', 'err', await call('GET', '/api/issue-categories'), 401);

  const t = keep('create-ticket', 'ok', await call('POST', '/api/tickets', { ...A, body: {
    customerId: cust.customerId, deviceId: dev.deviceId, issueDesc: 'Pin tụt nhanh, máy nóng khi sạc', categoryCode: 'PIN' } }), 201).data;
  keep('create-ticket', 'err', await call('POST', '/api/tickets', { ...A, body: {
    customerId: cust.customerId, deviceId: dev.deviceId, issueDesc: '   ', categoryCode: 'LOA' } }), 400);
  const code = encodeURIComponent(t.ticketCode);

  keep('list-tickets', 'ok', await call('GET', `/api/tickets?q=${code}`, A), 200);
  keep('list-tickets', 'err', await call('GET', '/api/tickets?status=DONE', A), 400);

  keep('get-ticket', 'ok', await call('GET', `/api/tickets/${code}`, A), 200);
  keep('get-ticket', 'err', await call('GET', `/api/tickets/${code}`, { token: nv2, who: 'nv02 (centre TT-CT02)' }), 403);

  // Xét duyệt: cần một phiếu "Chờ xác minh" → thiết bị không có ngày mua
  const dev2 = (await call('POST', '/api/devices', { ...A, body: { customerId: cust.customerId, serialImei: `API-EX-${stamp}-B`, modelName: 'Mekong A3' } })).data;
  const t2 = (await call('POST', '/api/tickets', { ...A, body: {
    customerId: cust.customerId, deviceId: dev2.deviceId, issueDesc: 'Màn hình sọc ngang, khách không còn hoá đơn', categoryCode: 'MAN_HINH' } })).data;
  const code2 = encodeURIComponent(t2.ticketCode);
  keep('review', 'ok', await call('POST', `/api/tickets/${code2}/review`, { ...Q, body: { decision: 'CHAP_NHAN', note: 'Khách cung cấp tin nhắn xác nhận đơn hàng' } }), 200);
  keep('review', 'err', await call('POST', `/api/tickets/${code2}/review`, { ...Q, body: { decision: 'KHONG_CHAP_NHAN', note: 'Xét lại' } }), 409);

  const spare = (await call('POST', '/api/devices', { ...A, body: { customerId: cust.customerId, serialImei: `API-EX-${stamp}-C`, modelName: 'Mekong A3' } })).data;
  keep('delete-device', 'err', await call('DELETE', `/api/devices/${spare.deviceId}`, A), 403);
  keep('delete-device', 'ok', await call('DELETE', `/api/devices/${spare.deviceId}`, Q), 204);

  const tmp = (await call('POST', '/api/customers', { ...A, body: { fullName: 'API Example Temporary', phone: `08${stamp}` } })).data;
  keep('delete-customer', 'ok', await call('DELETE', `/api/customers/${tmp.customerId}`, Q), 204);
  keep('delete-customer', 'err', await call('DELETE', `/api/customers/${cust.customerId}`, Q), 409);

  // Ghi vào tài liệu
  const when = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  let doc = fs.readFileSync(DOC, 'utf8');
  for (const [id, ex] of Object.entries(examples)) {
    const block = [
      `<!-- vd:${id} -->`,
      `**Real example** – captured ${when} (UTC+7) by \`node src/backend/scripts/api-examples.js\` against \`docker compose\`.`,
      '',
      '*Success*',
      ...ex.ok.map(render),
      ...(ex.err.length ? ['', '*Error*', ...ex.err.map(render)] : []),
      `<!-- /vd:${id} -->`,
    ].join('\n');
    const re = new RegExp(`<!-- vd:${id} -->[\\s\\S]*?<!-- /vd:${id} -->`);
    if (!re.test(doc)) { problems.push(`không tìm thấy dấu <!-- vd:${id} --> trong docs/api-docs.md`); continue; }
    doc = doc.replace(re, () => block);
  }
  fs.writeFileSync(DOC, doc);
  const n = Object.values(examples).reduce((s, e) => s + e.ok.length + e.err.length, 0);
  console.log(`Đã ghi ${n} ví dụ thật cho ${Object.keys(examples).length} endpoint vào docs/api-docs.md (${when}).`);
  if (problems.length) { console.log('CẢNH BÁO – mã HTTP khác mong đợi:'); problems.forEach((p) => console.log('  ✗', p)); process.exitCode = 1; }
  else console.log('Mọi request trả đúng mã HTTP mong đợi ✓');
}

main().catch((e) => { console.error('✗', e.message); process.exitCode = 1; });
