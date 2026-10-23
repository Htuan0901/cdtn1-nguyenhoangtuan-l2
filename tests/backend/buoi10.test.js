// Buổi 10 – 5 unit test cho phần mở rộng (đăng nhập, ghi nhận thiết bị, tạo khách hàng).
// Test lớp NGHIỆP VỤ bằng repository GIẢ – không cần CSDL; đủ ba loại: luồng đúng · giá trị biên · dữ liệu sai.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthService } = require('../../src/backend/src/business/services/authService');
const { createDeviceService } = require('../../src/backend/src/business/services/deviceService');
const { createCustomerService } = require('../../src/backend/src/business/services/customerService');
const { hashPassword } = require('../../src/backend/src/business/policies/passwordPolicy');

const rejects = (p, status, code) => assert.rejects(p, (e) => e.status === status && e.code === code);

/* ---------- AuthService với kho nhân viên giả ---------- */
const STAFF = {
  nv01: { id: 1, username: 'nv01', full_name: 'Trần Thị Bình', role: 'NV_TIEP_NHAN', center_code: 'TT-CT01',
    is_active: true, password_hash: hashPassword('Mekong@2026', 'muoi-co-dinh-cho-test') },
};
function auth() {
  const signed = [];
  const svc = createAuthService({
    staffRepo: { findByUsername: async (u) => STAFF[u] || null },
    signToken: (payload) => { signed.push(payload); return 'jwt-gia'; },
  });
  return { svc, signed };
}

/* ---------- DeviceService với kho thiết bị giả, ghi nhận lệnh insert ---------- */
function devices({ today = '2026-10-23T09:00:00+07:00' } = {}) {
  const inserted = [];
  const svc = createDeviceService({
    now: () => new Date(today),
    customerRepo: { findById: async (id) => ({ 1: { id: 1 }, 2: { id: 2 } }[id] || null) },
    deviceRepo: {
      findBySerial: async (s) => (s === 'MM-IMEI-000123' ? { id: 1, customer_id: 1, serial_imei: s } : null),
      insert: async (d) => { inserted.push(d); return { id: 10, customer_id: d.customerId, ...d }; },
    },
  });
  return { svc, inserted };
}

/* ================= LOẠI 1: LUỒNG ĐÚNG ================= */
test('TC-21 đăng nhập đúng: tên có chữ hoa và khoảng trắng vẫn nhận, trả JWT và hồ sơ, không lộ password_hash', async () => {
  const { svc, signed } = auth();
  const r = await svc.login('  NV01 ', 'Mekong@2026');
  assert.equal(r.token, 'jwt-gia');
  assert.deepEqual(signed[0], { staffId: 1, role: 'NV_TIEP_NHAN', centerCode: 'TT-CT01', fullName: 'Trần Thị Bình' });
  assert.equal(r.staff.username, 'nv01');
  assert.equal(JSON.stringify(r).includes('scrypt'), false);
});

/* ================= LOẠI 2: GIÁ TRỊ BIÊN ================= */
test('TC-22 ngày mua: đúng HÔM NAY được ghi nhận, NGÀY MAI bị từ chối PURCHASE_DATE_IN_FUTURE', async () => {
  const { svc, inserted } = devices();
  const base = { customerId: 1, modelName: 'Mekong A5', warrantyMonths: 12 };
  const r = await svc.registerOrFind({ ...base, serialImei: ' mm-imei-777001 ', purchaseDate: '2026-10-23' });
  assert.equal(r.created, true);
  assert.equal(inserted[0].serialImei, 'MM-IMEI-777001');            // chuẩn hoá chữ hoa, bỏ khoảng trắng
  await rejects(svc.registerOrFind({ ...base, serialImei: 'MM-IMEI-777002', purchaseDate: '2026-10-24' }),
    400, 'PURCHASE_DATE_IN_FUTURE');
  assert.equal(inserted.length, 1);                                     // bản ngày mai KHÔNG được ghi
});

/* ================= LOẠI 3: DỮ LIỆU SAI / LUỒNG NGOẠI LỆ ================= */
test('TC-23 sai mật khẩu và tài khoản không tồn tại trả CÙNG lỗi 401 – không lộ tên đăng nhập nào có thật', async () => {
  const { svc, signed } = auth();
  const a = await svc.login('nv01', 'sai-mat-khau').catch((e) => e);
  const b = await svc.login('khong-ton-tai', 'Mekong@2026').catch((e) => e);
  assert.equal(a.status, 401); assert.equal(a.code, 'INVALID_CREDENTIALS');
  assert.equal(b.status, 401); assert.equal(b.code, 'INVALID_CREDENTIALS');
  assert.equal(a.message, b.message);
  assert.equal(signed.length, 0);                                       // không phát JWT nào
});

test('TC-24 Serial/IMEI đã thuộc khách hàng khác → 409 DEVICE_OWNED_BY_OTHER, không ghi thiết bị (UC04 – 5a)', async () => {
  const { svc, inserted } = devices();
  await rejects(svc.registerOrFind({ customerId: 2, serialImei: 'mm-imei-000123', modelName: 'Mekong X5' }),
    409, 'DEVICE_OWNED_BY_OTHER');
  assert.equal(inserted.length, 0);
  const own = await svc.registerOrFind({ customerId: 1, serialImei: 'MM-IMEI-000123' }); // đúng chủ → dùng lại
  assert.equal(own.created, false);
});

test('TC-25 tạo khách hàng: SĐT "+84 911 222 333" trùng hồ sơ 0911222333 → 409 PHONE_EXISTS; SĐT sai → 400', async () => {
  const inserted = [];
  const svc = createCustomerService({
    customerRepo: {
      findByPhone: async (p) => (p === '0911222333' ? { id: 4, phone: p } : null),
      insert: async (c) => { inserted.push(c); return { id: 5, ...c }; },
    },
  });
  await rejects(svc.createCustomer({ fullName: 'Khách Trùng', phone: '+84 911 222 333' }), 409, 'PHONE_EXISTS'); // QT-01 + QT-02
  await rejects(svc.createCustomer({ fullName: 'Khách Sai', phone: '09012' }), 400, 'INVALID_PHONE');
  assert.equal(inserted.length, 0);
});
