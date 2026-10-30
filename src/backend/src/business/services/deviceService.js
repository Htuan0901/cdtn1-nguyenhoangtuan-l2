// DeviceService – UC03 / FR3: tra cứu hoặc ghi nhận thiết bị theo Serial/IMEI (QT-03);
// Buổi 12 (TD-20): đủ CRUD – chi tiết, sửa (không đổi Serial/IMEI, không đổi chủ), xoá khi chưa có phiếu.
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
      if (err.code === 'DUPLICATE_KEY') throw conflict('DEVICE_OWNED_BY_OTHER', 'Serial/IMEI vừa được ghi nhận – tra cứu lại');
      throw err;
    }
  }

  const listByCustomer = (customerId) => deviceRepo.findByCustomer(customerId);

  async function getDevice(id) {
    const d = await deviceRepo.findById(id);
    if (!d) throw notFound('DEVICE_NOT_FOUND', 'Không tìm thấy thiết bị');
    return d;
  }

  // Sửa thông tin mua hàng. Phiếu đã tạo GIỮ kết quả kiểm tra bảo hành lúc tiếp nhận (QT-05 chốt tại thời điểm tạo)
  async function updateDevice(id, { modelName, purchaseDate, warrantyMonths }) {
    await getDevice(id);
    if (purchaseDate && purchaseDate > todayVn(now())) {
      throw badRequest('PURCHASE_DATE_IN_FUTURE', 'Ngày mua không được lớn hơn ngày hiện tại', ['purchaseDate']);
    }
    return deviceRepo.update(id, {
      modelName: modelName === undefined ? undefined : modelName.trim(),
      purchaseDate: purchaseDate === '' ? null : purchaseDate,   // chuỗi rỗng = xoá ngày mua
      warrantyMonths,
    });
  }

  async function deleteDevice(id) {
    await getDevice(id);
    if (await deviceRepo.countTickets(id) > 0) {
      throw conflict('DEVICE_IN_USE', 'Thiết bị đã có phiếu bảo hành – không thể xoá');
    }
    try {
      await deviceRepo.remove(id);
    } catch (err) {
      if (err.code === 'IN_USE') throw conflict('DEVICE_IN_USE', 'Thiết bị vừa được tạo phiếu – không thể xoá');
      throw err;
    }
  }

  return { registerOrFind, listByCustomer, getDevice, updateDevice, deleteDevice };
}

module.exports = { createDeviceService };
