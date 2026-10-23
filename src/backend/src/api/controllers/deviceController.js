const { deviceService } = require('../../container');
const { deviceItem } = require('../presenters/ticketPresenter');

// E3 – POST /api/devices: tra cứu theo Serial/IMEI; chưa có và gửi kèm modelName → ghi nhận mới
async function registerOrFind(req, res) {
  const { device, created } = await deviceService.registerOrFind(req.body);
  res.status(created ? 201 : 200).json({ ...deviceItem(device), created });
}

module.exports = { registerOrFind };
