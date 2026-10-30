// Buổi 12 – CRUD Khách hàng và Thiết bị (TD-20). Lớp nghiệp vụ + validator, repository GIẢ – không cần CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCustomerService } = require('../../src/backend/src/business/services/customerService');
const { createDeviceService } = require('../../src/backend/src/business/services/deviceService');
const { validate } = require('../../src/backend/src/api/middlewares/validator');

const rejects = (p, status, code) => assert.rejects(p, (e) => e.status === status && e.code === code);
const fields = (name, data, source = 'body') => {
  let err; validate(name, source)({ [source]: data }, {}, (e) => { err = e; });
  return err ? err.fields : [];
};

/* ---------- kho khách hàng / thiết bị giả, ghi nhận lệnh ghi ---------- */
function customers() {
  const db = { 1: { id: 1, full_name: 'Nguyễn Minh Anh', phone: '0901234567' }, 2: { id: 2, full_name: 'Lê Văn Cường', phone: '0933456218' } };
  const devices = { 1: 1 }; const writes = []; let searched = null;
  const repo = {
    findById: async (id) => db[id] || null,
    findByPhone: async (p) => Object.values(db).find((c) => c.phone === p) || null,
    search: async (f) => { searched = f; return { total: 0, rows: [] }; },
    update: async (id, ch) => { writes.push(['update', id, ch]); return { ...db[id], ...(ch.fullName && { full_name: ch.fullName }), ...(ch.phone && { phone: ch.phone }) }; },
    countDevices: async (id) => devices[id] || 0,
    remove: async (id) => { writes.push(['remove', id]); return 1; },
  };
  return { svc: createCustomerService({ customerRepo: repo }), writes, searched: () => searched };
}
function devices() {
  const writes = [];
  const repo = {
    findById: async (id) => (id === 5 ? { id: 5, customer_id: 1, serial_imei: 'MM-1' } : id === 6 ? { id: 6, customer_id: 1 } : null),
    countTickets: async (id) => (id === 5 ? 2 : 0),
    update: async (id, ch) => { writes.push(['update', id, ch]); return { id, ...ch }; },
    remove: async (id) => { writes.push(['remove', id]); return 1; },
  };
  return { svc: createDeviceService({ deviceRepo: repo, customerRepo: {}, now: () => new Date('2026-10-30T09:00:00+07:00') }), writes };
}

/* ================= LUỒNG ĐÚNG ================= */
test('TC-35 sửa khách hàng: SĐT "+84 912 000 111" được chuẩn hoá trước khi lưu, họ tên bỏ khoảng trắng thừa', async () => {
  const { svc, writes } = customers();
  const c = await svc.updateCustomer(2, { fullName: '  Lê Văn Cường  ', phone: '+84 912 000 111' });
  assert.deepEqual(writes, [['update', 2, { fullName: 'Lê Văn Cường', phone: '0912000111' }]]);
  assert.equal(c.phone, '0912000111');
});

test('TC-36 danh sách khách: ô tìm là SĐT thì tìm theo SĐT đã chuẩn hoá, là chữ thì tìm theo họ tên; trang 2 bỏ qua 20 dòng', async () => {
  const a = customers(); await a.svc.listCustomers({ q: '0901 234 567' });
  assert.deepEqual(a.searched(), { phone: '0901234567', name: null, limit: 20, offset: 0 });
  const b = customers(); await b.svc.listCustomers({ q: ' Minh ', page: '2' });
  assert.deepEqual(b.searched(), { phone: null, name: 'Minh', limit: 20, offset: 20 });
});

/* ================= GIÁ TRỊ BIÊN ================= */
test('TC-37 giữ nguyên SĐT của chính mình không bị coi là trùng; số tháng bảo hành 0 và 60 hợp lệ, 61 bị từ chối', async () => {
  const { svc } = customers();
  await svc.updateCustomer(1, { phone: '0901 234 567' });             // trùng với chính khách 1 → được
  assert.deepEqual(fields('updateDevice', { warrantyMonths: 0 }), []);
  assert.deepEqual(fields('updateDevice', { warrantyMonths: 60 }), []);
  assert.deepEqual(fields('updateDevice', { warrantyMonths: 61 }), ['warrantyMonths']);
});

test('TC-38 sửa ngày mua: hôm nay được, ngày mai bị từ chối; chuỗi rỗng = xoá ngày mua (thiết bị thành chưa xác minh)', async () => {
  const { svc, writes } = devices();
  await svc.updateDevice(6, { purchaseDate: '2026-10-30' });
  await rejects(svc.updateDevice(6, { purchaseDate: '2026-10-31' }), 400, 'PURCHASE_DATE_IN_FUTURE');
  await svc.updateDevice(6, { purchaseDate: '' });
  assert.deepEqual(writes.map((w) => w[2].purchaseDate), ['2026-10-30', null]);
});

/* ================= DỮ LIỆU SAI / LUỒNG NGOẠI LỆ ================= */
test('TC-39 đổi SĐT sang số đã thuộc khách khác → 409 PHONE_EXISTS, không ghi gì (QT-01)', async () => {
  const { svc, writes } = customers();
  await rejects(svc.updateCustomer(2, { phone: '0901234567' }), 409, 'PHONE_EXISTS');
  await rejects(svc.updateCustomer(2, { phone: '09012' }), 400, 'INVALID_PHONE');
  await rejects(svc.updateCustomer(404, { fullName: 'X' }), 404, 'CUSTOMER_NOT_FOUND');
  assert.equal(writes.length, 0);
});

test('TC-40 xoá khách đã có thiết bị → 409 CUSTOMER_IN_USE; xoá thiết bị đã có phiếu → 409 DEVICE_IN_USE; không xoá gì', async () => {
  const c = customers();
  await rejects(c.svc.deleteCustomer(1), 409, 'CUSTOMER_IN_USE');
  await c.svc.deleteCustomer(2);                                       // khách chưa có thiết bị → xoá được
  assert.deepEqual(c.writes, [['remove', 2]]);
  const d = devices();
  await rejects(d.svc.deleteDevice(5), 409, 'DEVICE_IN_USE');
  await rejects(d.svc.deleteDevice(99), 404, 'DEVICE_NOT_FOUND');
  assert.equal(d.writes.length, 0);
});

test('TC-41 validator: PATCH rỗng, sửa Serial/IMEI hoặc đổi chủ thiết bị, id không phải số đều bị từ chối 400', () => {
  assert.deepEqual(fields('updateCustomer', {}), ['body']);
  assert.deepEqual(fields('updateDevice', { serialImei: 'X', customerId: 2, modelName: 'A' }), ['serialImei', 'customerId']);
  assert.deepEqual(fields('idParam', { id: 'abc' }, 'params'), ['id']);
  assert.deepEqual(fields('idParam', { id: '99999999999' }, 'params'), ['id']);
  assert.deepEqual(fields('idParam', { id: '2147483647' }, 'params'), []);
});

test('TC-42 khoá ngoại bị vi phạm lúc xoá (có người vừa tạo phiếu) → 409, không phải 500', async () => {
  const { createDeviceService: mk } = require('../../src/backend/src/business/services/deviceService');
  const svc = mk({
    customerRepo: {},
    deviceRepo: {
      findById: async () => ({ id: 6 }), countTickets: async () => 0,
      remove: async () => { const e = new Error('fk'); e.code = 'IN_USE'; throw e; },
    },
  });
  await rejects(svc.deleteDevice(6), 409, 'DEVICE_IN_USE');
});
