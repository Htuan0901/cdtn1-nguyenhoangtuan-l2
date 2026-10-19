// CustomerService – FR1 / UC01: tra cứu khách hàng theo số điện thoại đã chuẩn hoá (QT-02).
const { normalizePhone } = require('../policies/phonePolicy');
const { badRequest, notFound } = require('../errors');

function createCustomerService({ customerRepo }) {
  async function lookupByPhone(rawPhone) {
    const phone = normalizePhone(rawPhone);
    if (!phone) throw badRequest('INVALID_PHONE', 'Số điện thoại không hợp lệ: cần 10 chữ số, bắt đầu bằng 0', ['phone']);
    const customer = await customerRepo.findByPhone(phone);
    if (!customer) throw notFound('CUSTOMER_NOT_FOUND', 'Chưa có khách hàng với số điện thoại này');
    return customer;
  }
  return { lookupByPhone };
}

module.exports = { createCustomerService };
