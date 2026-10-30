// Nạp DỮ LIỆU MẪU THẬT của học phần (data/mau/*.csv) vào CSDL – Buổi 10, bước 5 "chạy trên dữ liệu thật".
// Dữ liệu đi qua ĐÚNG lớp nghiệp vụ (CustomerService, DeviceService, TicketService) nên mọi quy tắc
// QT-01..QT-06 được áp dụng như khi nhân viên nhập trên giao diện; dòng vi phạm bị loại và được đếm.
// Chạy lại nhiều lần KHÔNG nhân đôi dòng (khoá nghiệp vụ: số điện thoại, Serial/IMEI, thiết bị + mô tả lỗi).
// Cách dùng: npm run seed
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/data-access/db');
const { customerService, deviceService, ticketService } = require('../src/container');
const staffRepo = require('../src/data-access/repositories/staffRepository');
const customerRepo = require('../src/data-access/repositories/customerRepository');
const { normalizePhone } = require('../src/business/policies/phonePolicy');

// Mặc định data/mau ở thư mục gốc repo; trong Docker image đặt bằng biến SEED_DATA_DIR
const DATA_DIR = process.env.SEED_DATA_DIR || path.join(__dirname, '..', '..', '..', 'data', 'mau');
const TICKETS_PER_CENTER = 60;
const CENTER_OF = { 1: { code: 'TT-CT01', staff: 'nv01' }, 2: { code: 'TT-CT02', staff: 'nv02' } }; // center_id trong CSV
const MODELS = ['Mekong A3', 'Mekong A5', 'Mekong X5', 'Mekong S2', 'Mekong Note 11', 'Mekong Tab 10'];

// Đọc CSV có hỗ trợ dấu ngoặc kép (địa chỉ chứa dấu phẩy)
function readCsv(file) {
  const text = fs.readFileSync(path.join(DATA_DIR, file), 'utf8').replace(/^﻿/, '');
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head.map((h, j) => [h, (r[j] ?? '').trim()])));
}

// "  hoàng bảo nhung " → "Hoàng Bảo Nhung"
const cleanName = (s) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
  .split(' ').map((w) => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1)).join(' ');

// Ba định dạng ngày có trong orders: dd/mm/yyyy · d-m-yy · yyyy.mm.dd → YYYY-MM-DD (sai → null)
function parseDate(s) {
  let m; let y; let mo; let d;
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s))) [, d, mo, y] = m;
  else if ((m = /^(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(s))) { [, d, mo, y] = m; y = `20${y}`; } else if ((m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(s))) [, y, mo, d] = m;
  else return null;
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  return dt.getUTCMonth() + 1 === Number(mo) && dt.getUTCDate() === Number(d) ? iso : null;
}

const count = () => ({ doc: 0, nap: 0, daCo: 0, loai: {}, ghiChu: {} });
const reject = (c, reason) => { c.loai[reason] = (c.loai[reason] || 0) + 1; };

async function ensureCustomer(fullName, rawPhone, c) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return reject(c, 'SĐT không chuẩn hoá được (QT-02)');
  if (!fullName) return reject(c, 'Thiếu họ tên');
  const existing = await customerRepo.findByPhone(phone);
  if (existing) { c.daCo += 1; return existing; }
  const created = await customerService.createCustomer({ fullName: cleanName(fullName), phone });
  c.nap += 1;
  return created;
}

async function main() {
  const kq = { khach: count(), donHang: count(), thietBi: count(), phieu: count() };

  // 1) Khách hàng từ customers_raw.csv (khoá nghiệp vụ: số điện thoại đã chuẩn hoá – QT-01)
  for (const r of readCsv('customers_raw.csv')) {
    kq.khach.doc += 1;
    await ensureCustomer(r.ho_ten, r.so_dien_thoai, kq.khach);
  }

  // 2) Đơn hàng → khách hàng + thiết bị đã mua (ngày mua = ngày đơn hàng; khoá: Serial/IMEI)
  const devices = [];
  for (const r of readCsv('orders_2024_2026.csv')) {
    kq.donHang.doc += 1;
    const customer = await ensureCustomer(r.ten_khach, r.so_dien_thoai, kq.donHang);
    if (!customer) continue;
    kq.thietBi.doc += 1;
    const purchaseDate = parseDate(r.ngay);
    if (!purchaseDate) { // vẫn nạp, để trống ngày mua → phiếu của thiết bị này sẽ "Chờ xác minh" (QT-05)
      kq.thietBi.ghiChu.thieuNgay = (kq.thietBi.ghiChu.thieuNgay || 0) + 1;
    }
    try {
      const { device, created } = await deviceService.registerOrFind({
        customerId: customer.id,
        serialImei: `IMEI-${r.ma_cua_hang}-${String(r.order_id).padStart(5, '0')}`,
        modelName: MODELS[Number(r.order_id) % MODELS.length],
        purchaseDate,
        warrantyMonths: 12,
      });
      if (created) kq.thietBi.nap += 1; else kq.thietBi.daCo += 1;
      devices.push(device);
    } catch (e) { reject(kq.thietBi, e.code || e.message); }
  }

  // 3) Phiếu bảo hành từ issue_descriptions.csv – tạo qua TicketService (QT-04, QT-05, QT-06, QT-A1, QT-A2)
  const staff = {};
  for (const [id, c] of Object.entries(CENTER_OF)) {
    const s = await staffRepo.findByUsername(c.staff);
    staff[id] = { staffId: s.id, role: s.role, centerCode: s.center_code };
  }
  const taken = { 1: 0, 2: 0 };
  let k = 0;
  for (const r of readCsv('issue_descriptions.csv')) {
    const center = CENTER_OF[r.center_id];
    if (!center || taken[r.center_id] >= TICKETS_PER_CENTER) continue; // chỉ 2 trung tâm có nhân viên mẫu
    kq.phieu.doc += 1;
    taken[r.center_id] += 1;
    const device = devices[k % devices.length]; k += 1;
    const { rows } = await pool.query('SELECT 1 FROM ticket WHERE device_id = $1 AND issue_desc = $2', [device.id, r.issue_desc]);
    if (rows.length) { kq.phieu.daCo += 1; continue; }
    try {
      await ticketService.createTicket(staff[r.center_id], {
        customerId: device.customer_id, deviceId: device.id, issueDesc: r.issue_desc, categoryCode: r.issue_category,
      });
      kq.phieu.nap += 1;
    } catch (e) { reject(kq.phieu, e.code || e.message); }
  }

  console.log('Nguồn: data/mau/customers_raw.csv · orders_2024_2026.csv · issue_descriptions.csv');
  console.table(Object.fromEntries(Object.entries(kq).map(([k2, v]) => [k2, {
    'đọc': v.doc, 'nạp mới': v.nap, 'đã có (bỏ qua)': v.daCo,
    'bị loại': Object.values(v.loai).reduce((a, b) => a + b, 0),
  }])));
  for (const [k2, v] of Object.entries(kq)) {
    for (const [reason, n] of Object.entries(v.loai)) console.log(`  ${k2}: loại ${n} dòng – ${reason}`);
  }
  if (kq.thietBi.ghiChu.thieuNgay) {
    console.log(`  thietBi: ${kq.thietBi.ghiChu.thieuNgay} thiết bị có ngày mua không đọc được → nạp với ngày mua trống (phiếu "Chờ xác minh")`);
  }
  const { rows } = await pool.query(`SELECT (SELECT count(*) FROM customer) AS khach, (SELECT count(*) FROM device) AS thiet_bi,
    (SELECT count(*) FROM ticket) AS phieu, (SELECT count(*) FROM ticket_status_log) AS lich_su`);
  console.log('Tổng trong CSDL:', rows[0]);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => pool.end());
