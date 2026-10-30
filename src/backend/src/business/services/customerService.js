// CustomerService – FR1 / UC01 tra cứu, FR2 / UC02 tạo khách hàng mới (QT-01, QT-02);
// Buổi 12 (TD-20): đủ CRUD – danh sách, chi tiết, sửa, xoá có ràng buộc.
const { normalizePhone } = require('../policies/phonePolicy');
const { badRequest, notFound, conflict } = require('../errors');

const PAGE_SIZE = 20; // NFR3
const invalidPhone = () => badRequest('INVALID_PHONE', 'Số điện thoại không hợp lệ: cần 10 chữ số, bắt đầu bằng 0', ['phone']);
const phoneExists = () => conflict('PHONE_EXISTS', 'Số điện thoại đã có hồ sơ khách hàng – dùng Tra cứu');

function createCustomerService({ customerRepo }) {
  async function lookupByPhone(rawPhone) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw invalidPhone();
    const customer = await customerRepo.findByPhone(phone);
    if (!customer) throw notFound('CUSTOMER_NOT_FOUND', 'Chưa có khách hàng với số điện thoại này');
    return customer;
  }

  // UC02: số điện thoại là duy nhất (QT-01)
  async function createCustomer({ fullName, phone: rawPhone }) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw invalidPhone();
    if (await customerRepo.findByPhone(phone)) throw phoneExists();
    try {
      return await customerRepo.insert({ fullName: fullName.trim(), phone });
    } catch (err) {
      if (err.code === 'DUPLICATE_KEY') throw phoneExists(); // hai người tạo cùng SĐT cùng lúc
      throw err;
    }
  }

  // Danh sách: ô tìm là SĐT (chuẩn hoá QT-02) hoặc một phần họ tên
  async function listCustomers({ q, page }) {
    const p = Math.max(1, Number(page) || 1);
    const text = (q || '').trim();
    const phone = text ? normalizePhone(text) : null;
    const { total, rows } = await customerRepo.search({
      phone, name: text && !phone ? text : null, limit: PAGE_SIZE, offset: (p - 1) * PAGE_SIZE,
    });
    return { page: p, pageSize: PAGE_SIZE, total, items: rows };
  }

  async function getCustomer(id) {
    const c = await customerRepo.findById(id);
    if (!c) throw notFound('CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng');
    return c;
  }

  // Sửa họ tên và/hoặc SĐT; SĐT mới vẫn phải duy nhất (QT-01)
  async function updateCustomer(id, { fullName, phone: rawPhone }) {
    await getCustomer(id);
    const changes = {};
    if (fullName !== undefined) changes.fullName = fullName.trim();
    if (rawPhone !== undefined) {
      const phone = normalizePhone(rawPhone);
      if (!phone) throw invalidPhone();
      const other = await customerRepo.findByPhone(phone);
      if (other && other.id !== id) throw phoneExists();
      changes.phone = phone;
    }
    try {
      return await customerRepo.update(id, changes);
    } catch (err) {
      if (err.code === 'DUPLICATE_KEY') throw phoneExists();
      throw err;
    }
  }

  // Xoá chỉ khi khách chưa có thiết bị (và vì vậy chưa có phiếu) – phiếu là chứng từ, không mất theo (TD-07)
  async function deleteCustomer(id) {
    await getCustomer(id);
    if (await customerRepo.countDevices(id) > 0) {
      throw conflict('CUSTOMER_IN_USE', 'Khách hàng đã có thiết bị hoặc phiếu bảo hành – không thể xoá');
    }
    try {
      await customerRepo.remove(id);
    } catch (err) {
      if (err.code === 'IN_USE') throw conflict('CUSTOMER_IN_USE', 'Khách hàng vừa được dùng ở thiết bị khác – không thể xoá');
      throw err;
    }
  }

  return { lookupByPhone, createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer };
}

module.exports = { createCustomerService, PAGE_SIZE };
