// Buổi 14 – 12 test case HỆ THỐNG chạy thật qua HTTP, đếm bản ghi CSDL trước/sau mỗi test case.
// Mỗi test case tự dựng TIỀN ĐIỀU KIỆN của nó (khách hàng, thiết bị mới) nên chạy lại bao nhiêu lần cũng được.
// Cần backend đang chạy (npm start) và CSDL đã migrate + seed.
//   npm run st            → chạy cả 12 test case
//   npm run st -- ST-05   → chạy MỘT test case (giảng viên chọn để chạy lại tại chỗ)
// Kết quả ghi vào docs/test-report.md; ảnh chụp lưu docs/screenshots/<mã>.png.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Pool } = require('pg');
const { config } = require('../src/config');

const BASE = `http://localhost:${config.port}/api`;
const PASSWORD = 'Mekong@2026';                       // mật khẩu tài khoản MẪU của seed (migration 003), không phải secret
const ROOT = path.join(__dirname, '..', '..', '..');  // thư mục gốc repo
const pool = new Pool({ connectionString: config.databaseUrl, max: 2 });
const uniq = String(Date.now()).slice(-8);           // hậu tố duy nhất cho mỗi lần chạy
let seq = 0;

// ---------- công cụ ----------
async function api(method, url, { token, body, raw } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: raw !== undefined ? raw : body && JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}
const count = async (table) => Number((await pool.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
const counts = async () => ({ ticket: await count('ticket'), log: await count('ticket_status_log'), customer: await count('customer'), device: await count('device') });
const delta = (b, a, k) => `${k} ${b[k]} → ${a[k]} (${a[k] - b[k] >= 0 ? '+' : ''}${a[k] - b[k]})`;
const login = async (u) => (await api('POST', '/auth/login', { body: { username: u, password: PASSWORD } })).data.token;
const todayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const shiftDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const minusYears = (iso, n) => `${Number(iso.slice(0, 4)) - n}${iso.slice(4)}`; // ngày này năm trước (không dùng mã của hệ thống)

async function newCustomer(token) {
  seq += 1;
  const phone = `09${uniq.slice(-6)}${String(seq).padStart(2, '0')}`; // 10 chữ số, bắt đầu 0, không trùng
  const r = await api('POST', '/customers', { token, body: { fullName: `Khách thử ST ${uniq}-${seq}`, phone } });
  if (r.status !== 201) throw new Error(`Không dựng được tiền điều kiện (tạo khách): HTTP ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
}
async function newDevice(token, customerId, purchaseDate) {
  const body = { customerId, serialImei: `ST-${uniq}-${++seq}`, modelName: 'Mekong A5', warrantyMonths: 12, ...(purchaseDate && { purchaseDate }) };
  const r = await api('POST', '/devices', { token, body });
  if (r.status !== 201) throw new Error(`Không dựng được tiền điều kiện (thiết bị): HTTP ${r.status} ${JSON.stringify(r.data)}`);
  return r.data;
}
const ticketBody = (c, d, extra = {}) => ({ customerId: c.customerId, deviceId: d.deviceId, issueDesc: 'Pin tụt nhanh, máy nóng khi sạc', categoryCode: 'PIN', ...extra });
const show = (r) => `${r.status}${r.data && r.data.code ? ` ${r.data.code}` : ''}${r.data && r.data.fields ? ` [${r.data.fields.join(', ')}]` : ''}`;

// ---------- 12 test case ----------
const CASES = [
  {
    id: 'ST-01', type: 'Luồng đúng', prio: 'Cao', title: 'Tạo phiếu cho thiết bị còn bảo hành (UC04 · QT-05 · QT-A1 · QT-15)',
    async run({ nv }) {
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, shiftDays(todayVN(), -30));
      const b = await counts();
      const r = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d) });
      const a = await counts(); const t = r.data || {};
      return {
        pre: `khách ${c.phone} mới · thiết bị ${d.serialImei} mua ${shiftDays(todayVN(), -30)}, BH 12 tháng · đăng nhập nv01`,
        steps: 'POST /api/tickets {customerId, deviceId, issueDesc, categoryCode: PIN} (không gửi priority)',
        expect: '201 · MOI · CON_BAO_HANH · ưu tiên TRUNG_BINH (mặc định nhóm PIN) · SĐT che dạng 09x****xxx · ticket +1 · log +1',
        actual: `${r.status} · ${t.status} · ${t.warrantyResult} · ${t.priority} · ${t.ticketCode} · SĐT ${t.phone} · ${delta(b, a, 'ticket')} · ${delta(b, a, 'log')}`,
        pass: r.status === 201 && t.status === 'MOI' && t.warrantyResult === 'CON_BAO_HANH' && t.priority === 'TRUNG_BINH'
          && /^0\d{2}\*{4}\d{3}$/.test(t.phone) && a.ticket - b.ticket === 1 && a.log - b.log === 1,
      };
    },
  },
  {
    id: 'ST-02', type: 'Luồng đúng', prio: 'Cao', title: 'Thiếu ngày mua → Chờ xác minh → Quản lý chấp nhận (UC04-8a · UC07 · QT-06)',
    async run({ nv, ql }) {
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, null);
      const b = await counts();
      const r1 = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d) });
      const code = encodeURIComponent(r1.data.ticketCode);
      const r2 = await api('POST', `/tickets/${code}/review`, { token: ql, body: { decision: 'CHAP_NHAN', note: 'Khách gửi tin nhắn xác nhận đơn hàng' } });
      const a = await counts(); const t = r2.data || {};
      return {
        pre: `khách ${c.phone} mới · thiết bị ${d.serialImei} KHÔNG có ngày mua`,
        steps: '1. nv01: POST /api/tickets · 2. ql01: POST /api/tickets/{mã}/review {CHAP_NHAN, note}',
        expect: 'B1: 201 CHO_XAC_MINH / CHUA_XAC_MINH · B2: 200 MOI / CON_BAO_HANH, lịch sử 2 dòng · ticket +1 · log +2',
        actual: `B1: ${r1.status} ${r1.data.status} / ${r1.data.warrantyResult} · B2: ${r2.status} ${t.status} / ${t.warrantyResult}, lịch sử ${t.history && t.history.length} dòng · ${delta(b, a, 'ticket')} · ${delta(b, a, 'log')}`,
        pass: r1.status === 201 && r1.data.status === 'CHO_XAC_MINH' && r2.status === 200 && t.status === 'MOI'
          && t.warrantyResult === 'CON_BAO_HANH' && t.history.length === 2 && a.ticket - b.ticket === 1 && a.log - b.log === 2,
      };
    },
  },
  {
    id: 'ST-03', type: 'Giá trị biên', prio: 'Cao', title: 'Tiếp nhận ĐÚNG ngày hết hạn bảo hành → vẫn Còn bảo hành (QT-05, phía trong ranh giới)',
    async run({ nv }) {
      const buy = minusYears(todayVN(), 1); // hết hạn = mua + 12 tháng = HÔM NAY
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, buy);
      const r = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d) });
      return {
        pre: `thiết bị mua ${buy}, BH 12 tháng → hết hạn ${todayVN()} = hôm nay`,
        steps: 'POST /api/tickets hôm nay',
        expect: '201 · CON_BAO_HANH · MOI',
        actual: `${r.status} · ${r.data.warrantyResult} · ${r.data.status} · ${r.data.ticketCode}`,
        pass: r.status === 201 && r.data.warrantyResult === 'CON_BAO_HANH' && r.data.status === 'MOI',
      };
    },
  },
  {
    id: 'ST-04', type: 'Giá trị biên', prio: 'Cao', title: 'Tiếp nhận sau hạn bảo hành 1 ngày → Hết bảo hành (QT-05, phía ngoài ranh giới)',
    async run({ nv }) {
      const buy = shiftDays(minusYears(todayVN(), 1), -1); // hết hạn = HÔM QUA
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, buy);
      const r = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d) });
      return {
        pre: `thiết bị mua ${buy}, BH 12 tháng → hết hạn ${shiftDays(todayVN(), -1)} = hôm qua`,
        steps: 'POST /api/tickets hôm nay',
        expect: '201 · HET_BAO_HANH · phiếu vẫn MOI (vẫn tiếp nhận, sửa có tính phí)',
        actual: `${r.status} · ${r.data.warrantyResult} · ${r.data.status} · ${r.data.ticketCode}`,
        pass: r.status === 201 && r.data.warrantyResult === 'HET_BAO_HANH' && r.data.status === 'MOI',
      };
    },
  },
  {
    id: 'ST-05', type: 'Giá trị biên', prio: 'Trung bình', title: 'Mô tả lỗi 5.000 ký tự được nhận, 5.001 ký tự bị từ chối (api-contract E7)',
    async run({ nv }) {
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, todayVN());
      const b = await counts();
      const r1 = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d, { issueDesc: 'a'.repeat(5000) }) });
      const r2 = await api('POST', '/tickets', { token: nv, body: ticketBody(c, d, { issueDesc: 'a'.repeat(5001) }) });
      const a = await counts();
      return {
        pre: `khách ${c.phone}, thiết bị ${d.serialImei} mới`,
        steps: '1. POST /api/tickets issueDesc = 5.000 ký tự · 2. issueDesc = 5.001 ký tự',
        expect: 'B1: 201 · B2: 400 VALIDATION_ERROR [issueDesc] · ticket +1 (chỉ B1)',
        actual: `B1: ${show(r1)} · B2: ${show(r2)} · ${delta(b, a, 'ticket')}`,
        pass: r1.status === 201 && r2.status === 400 && r2.data.fields.includes('issueDesc') && a.ticket - b.ticket === 1,
      };
    },
  },
  {
    id: 'ST-06', type: 'Dữ liệu sai', prio: 'Cao', title: 'Trường bắt buộc trống / sai enum → 400 nêu rõ trường, KHÔNG ghi gì (UC04-10a)',
    async run({ nv }) {
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, todayVN());
      const b = await counts();
      const r = await api('POST', '/tickets', { token: nv, body: { customerId: c.customerId, deviceId: d.deviceId, issueDesc: '   ', categoryCode: 'LOA' } });
      const a = await counts();
      return {
        pre: `khách ${c.phone}, thiết bị ${d.serialImei} hợp lệ`,
        steps: 'POST /api/tickets {issueDesc: "   ", categoryCode: "LOA"}',
        expect: '400 VALIDATION_ERROR [issueDesc, categoryCode] · ticket +0 · log +0',
        actual: `${show(r)} · ${delta(b, a, 'ticket')} · ${delta(b, a, 'log')}`,
        pass: r.status === 400 && ['issueDesc', 'categoryCode'].every((f) => r.data.fields.includes(f)) && a.ticket === b.ticket && a.log === b.log,
      };
    },
  },
  {
    id: 'ST-07', type: 'Dữ liệu sai', prio: 'Trung bình', title: 'Id / mã không tồn tại → 404, KHÔNG phải 500',
    async run({ nv }) {
      const d = (await pool.query('SELECT id FROM device ORDER BY id LIMIT 1')).rows[0];
      const b = await counts();
      const r1 = await api('POST', '/tickets', { token: nv, body: { customerId: 2147483647, deviceId: d.id, issueDesc: 'thử', categoryCode: 'PIN' } });
      const r2 = await api('GET', '/customers/999999', { token: nv });
      const r3 = await api('GET', `/tickets/${encodeURIComponent('BH-999999/2099')}`, { token: nv });
      const a = await counts();
      return {
        pre: 'không có khách hàng id 2147483647, 999999; không có phiếu BH-999999/2099',
        steps: '1. POST /api/tickets customerId = 2147483647 · 2. GET /api/customers/999999 · 3. GET /api/tickets/BH-999999%2F2099',
        expect: 'B1: 404 CUSTOMER_NOT_FOUND · B2: 404 CUSTOMER_NOT_FOUND · B3: 404 TICKET_NOT_FOUND · ticket +0',
        actual: `B1: ${show(r1)} · B2: ${show(r2)} · B3: ${show(r3)} · ${delta(b, a, 'ticket')}`,
        pass: r1.status === 404 && r1.data.code === 'CUSTOMER_NOT_FOUND' && r2.status === 404 && r3.status === 404
          && r3.data.code === 'TICKET_NOT_FOUND' && a.ticket === b.ticket,
      };
    },
  },
  {
    id: 'ST-08', type: 'Dữ liệu sai', prio: 'Trung bình', title: 'Tham số q gửi dạng mảng / đối tượng → 400, KHÔNG phải 500',
    async run({ nv }) {
      const r1 = await api('GET', '/tickets?q=0901234567&q=BH-000001', { token: nv });
      const r2 = await api('GET', '/tickets?q[x]=1', { token: nv });
      return {
        pre: 'đăng nhập nv01',
        steps: '1. GET /api/tickets?q=0901234567&q=BH-000001 · 2. GET /api/tickets?q[x]=1',
        expect: 'B1: 400 VALIDATION_ERROR [q] · B2: 400 VALIDATION_ERROR [q]',
        actual: `B1: ${show(r1)} · B2: ${show(r2)}`,
        pass: [r1, r2].every((r) => r.status === 400 && r.data.fields && r.data.fields.includes('q')),
      };
    },
  },
  {
    id: 'ST-09', type: 'Dữ liệu sai', prio: 'Thấp', title: 'Body lớn hơn 100 KB → 413, KHÔNG phải 500',
    async run({ nv }) {
      const b = await counts();
      const r = await api('POST', '/customers', { token: nv, body: { fullName: 'a'.repeat(120000), phone: `09${uniq}` } });
      const a = await counts();
      return {
        pre: 'đăng nhập nv01; giới hạn body JSON của API là 100 KB',
        steps: 'POST /api/customers với fullName dài 120.000 ký tự (≈ 117 KB)',
        expect: '413 PAYLOAD_TOO_LARGE · customer +0',
        actual: `${show(r)} · ${delta(b, a, 'customer')}`,
        pass: r.status === 413 && r.data.code === 'PAYLOAD_TOO_LARGE' && a.customer === b.customer,
      };
    },
  },
  {
    id: 'ST-10', type: 'Bảo mật', prio: 'Cao', title: 'Phân quyền: thiếu/giả token → 401; khác trung tâm, sai vai trò → 403 (QT-14, NFR4)',
    async run({ nv, nv2 }) {
      const c = await newCustomer(nv); const d = await newDevice(nv, c.customerId, todayVN());
      const t = (await api('POST', '/tickets', { token: nv, body: ticketBody(c, d) })).data;
      const forged = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdGFmZklkIjoxLCJyb2xlIjoiUUxfVFJVTkdfVEFNIiwiY2VudGVyQ29kZSI6IlRULUNUMDEifQ.';
      const b = await counts();
      const r1 = await api('GET', '/tickets');
      const r2 = await api('GET', '/tickets', { token: forged });
      const r3 = await api('GET', `/tickets/${encodeURIComponent(t.ticketCode)}`, { token: nv2 });
      const r4 = await api('DELETE', `/customers/${c.customerId}`, { token: nv });
      const a = await counts();
      return {
        pre: `nv01 (TT-CT01) vừa tạo phiếu ${t.ticketCode}; nv02 thuộc TT-CT02`,
        steps: '1. GET /api/tickets không token · 2. token giả alg "none" · 3. nv02 GET phiếu của TT-CT01 · 4. nv01 DELETE /api/customers/{id}',
        expect: 'B1: 401 · B2: 401 · B3: 403 FORBIDDEN · B4: 403 FORBIDDEN · customer +0',
        actual: `B1: ${show(r1)} · B2: ${show(r2)} · B3: ${show(r3)} · B4: ${show(r4)} · ${delta(b, a, 'customer')}`,
        pass: r1.status === 401 && r2.status === 401 && r3.status === 403 && r4.status === 403 && a.customer === b.customer,
      };
    },
  },
  {
    id: 'ST-11', type: 'Bảo mật', prio: 'Cao', title: 'Không có mật khẩu / chuỗi kết nối có mật khẩu trong tài liệu repo (phản hồi BT2)',
    async run() {
      const files = ['README.md', 'docker-compose.yml', '.env.example', 'tests/README.md', 'src/backend/README.md', 'src/frontend/README.md'];
      const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []));
      files.push(...walk('docs'));
      const SAMPLE = 'doi_mat_khau_nay'; // giá trị MẪU duy nhất được phép, chỉ trong .env.example
      const ok = (pw, file) => pw.startsWith('${') || pw.startsWith('<') || (pw === SAMPLE && file === '.env.example');
      const found = [];
      for (const f of files.filter((x) => fs.existsSync(path.join(ROOT, x)))) {
        fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((line, i) => {
          for (const m of line.matchAll(/postgres(?:ql)?:\/\/[^\s:@/`]+:([^\s@`]+)@/g)) if (!ok(m[1], f)) found.push(`${f}:${i + 1}`);
          for (const m of line.matchAll(/(?:POSTGRES|DB)_PASSWORD[=:]\s*([^\s`'"|]+)/g)) if (!ok(m[1], f)) found.push(`${f}:${i + 1}`);
        });
      }
      return {
        pre: `quét ${files.length} tệp tài liệu/cấu hình đã commit (README, docs/**/*.md, docker-compose.yml, .env.example)`,
        steps: 'tìm chuỗi postgres://user:MẬT_KHẨU@ và POSTGRES_PASSWORD=giá_trị (bỏ qua ${BIẾN} và giá trị mẫu của .env.example)',
        expect: '0 vị trí lộ mật khẩu',
        actual: `${found.length} vị trí${found.length ? `: ${[...new Set(found)].join(', ')} (không in mật khẩu ra màn hình)` : ''}`,
        pass: found.length === 0,
      };
    },
  },
  {
    id: 'ST-12', type: 'Tái lập', prio: 'Cao', title: 'Chạy lại migrate + seed lần nữa → không lỗi, không nhân đôi dữ liệu (C5)',
    async run() {
      const tables = ['customer', 'device', 'ticket', 'ticket_status_log', 'issue_category', 'staff'];
      const snap = async () => Object.fromEntries(await Promise.all(tables.map(async (t) => [t, await count(t)])));
      const b = await snap();
      const node = (s) => spawnSync(process.execPath, [path.join(__dirname, s)], { env: process.env, encoding: 'utf8' });
      const m = node('migrate.js'); const s = node('seed-mau.js');
      const a = await snap();
      const skipped = (m.stdout.match(/bỏ qua/g) || []).length;
      return {
        pre: 'CSDL đã migrate + seed ít nhất một lần',
        steps: 'chạy lại scripts/migrate.js rồi scripts/seed-mau.js; đếm 6 bảng trước/sau',
        expect: 'migrate mã thoát 0, bỏ qua 3 migration · seed mã thoát 0 · cả 6 bảng +0',
        actual: `migrate thoát ${m.status}, bỏ qua ${skipped} · seed thoát ${s.status} · ${tables.map((t) => `${t} +${a[t] - b[t]}`).join(' · ')}`,
        pass: m.status === 0 && s.status === 0 && skipped === 3 && tables.every((t) => a[t] === b[t]),
      };
    },
  },
];

(async () => {
  const pick = process.argv[2];
  const list = pick ? CASES.filter((c) => c.id === pick.toUpperCase()) : CASES;
  if (!list.length) throw new Error(`Không có test case ${pick}. Có: ${CASES.map((c) => c.id).join(', ')}`);
  const ctx = { nv: await login('nv01'), ql: await login('ql01'), nv2: await login('nv02') };
  if (!ctx.nv) throw new Error('Không đăng nhập được nv01 – đã chạy npm run seed chưa?');
  console.log(`Test hệ thống trên ${BASE} · ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`);
  let pass = 0;
  for (const tc of list) {
    let r;
    try { r = await tc.run(ctx); } catch (e) { r = { pre: '-', steps: '-', expect: '-', actual: `LỖI KHI CHẠY: ${e.message}`, pass: false }; }
    if (r.pass) pass += 1;
    console.log(`━━ ${tc.id} · ${tc.type} · Ưu tiên ${tc.prio} — ${tc.title}`);
    console.log(`   Tiền đk : ${r.pre}`);
    console.log(`   Bước    : ${r.steps}`);
    console.log(`   Mong đợi: ${r.expect}`);
    console.log(`   Thực tế : ${r.actual}`);
    console.log(`   KẾT QUẢ : ${r.pass ? 'PASS' : 'FAIL'}\n`);
  }
  console.log(`TỔNG: ${pass}/${list.length} PASS${pass === list.length ? '' : ` · ${list.length - pass} FAIL – gỡ lỗi và ghi docs/bug-log.md`}`);
  if (pass !== list.length) process.exitCode = 1;
})().catch((e) => {
  console.error(`THẤT BẠI: ${e.cause && e.cause.code === 'ECONNREFUSED' ? 'backend chưa chạy (npm start)' : e.message}`);
  process.exitCode = 1;
}).finally(() => pool.end());
