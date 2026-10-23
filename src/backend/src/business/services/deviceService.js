// DeviceService – UC03 / FR3: tra cứu hoặc ghi nhận thiết bị theo Serial/IMEI (QT-03).
const { badRequest, notFound, conflict } = require('../errors');

const VN_OFFSET_MS = 7 * 3600e3;
const todayVn = (d) => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

function createDeviceService({ deviceRepo, customerRepo, now = () => new Date() }) {
  // Trả về { device, created }: created = false nếu Serial/IMEI đã có và thuộc đúng khách hàng
  async function registerOrFind(input) {
    const customer = await customerRepo.findById(input.customerId);
    if (!customer) throw notFound('CUSTOMER_NOT_FOUND', 'Không tìm thấy khách hàng');
    const serial = input.serialImei.trim().toUpperCase();

    const existing = await deviceRepo.findBySerial(serial);
    if (existing) {
      if (existing.customer_id !== customer.id) {                                   // UC04 – 5a, QT-03
        throw conflict('DEVICE_OWNED_BY_OTHER', 'Serial/IMEI đã thuộc khách hàng khác – không thể liên kết');
      }
      return { device: existing, created: false };
    }
    if (!input.modelName || !input.modelName.trim()) {
      throw notFound('DEVICE_NOT_FOUND', 'Chưa có thiết bị với Serial/IMEI này – nhập Tên model để ghi nhận mới');
    }
    if (input.purchaseDate && input.purchaseDate > todayVn(now())) {                 // ngày mua không ở tương lai
      throw badRequest('PURCHASE_DATE_IN_FUTURE', 'Ngày mua không được lớn hơn ngày hiện tại', ['purchaseDate']);
    }
    try {
      const device = await deviceRepo.insert({
        customerId: customer.id, serialImei: serial, modelName: input.modelName.trim(),
        purchaseDate: input.purchaseDate || null,                                     // trống → Chưa xác minh (QT-05)
        warrantyMonths: input.warrantyMonths ?? 12,
      });
      return { device, created: true };
    } catch (err) {
      // Hai nhân viên ghi nhận cùng Serial/IMEI cùng lúc → ràng buộc UNIQUE của CSDL chặn bản thứ hai
      if (err.code === '23505') throw conflict('DEVICE_OWNED_BY_OTHER', 'Serial/IMEI vừa được ghi nhận – tra cứu lại');
      throw err;
    }
  }

  const listByCustomer = (customerId) => deviceRepo.findByCustomer(customerId);

  return { registerOrFind, listByCustomer };
}

module.exports = { createDeviceService };
