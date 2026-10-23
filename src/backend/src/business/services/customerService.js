// CustomerService – FR1 / UC01 tra cứu, FR2 / UC02 tạo khách hàng mới (QT-01, QT-02).
const { normalizePhone } = require('../policies/phonePolicy');
const { badRequest, notFound, conflict } = require('../errors');

const invalidPhone = () => badRequest('INVALID_PHONE', 'Số điện thoại không hợp lệ: cần 10 chữ số, bắt đầu bằng 0', ['phone']);

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
    if (await customerRepo.findByPhone(phone)) {
      throw conflict('PHONE_EXISTS', 'Số điện thoại đã có hồ sơ khách hàng – dùng Tra cứu');
    }
    return customerRepo.insert({ fullName: fullName.trim(), phone });
  }

  return { lookupByPhone, createCustomer };
}

module.exports = { createCustomerService };
