const { deviceService } = require('../../container');
const { deviceItem } = require('../presenters/ticketPresenter');
const { createLogger } = require('../../logger');

const log = createLogger('device');

// E3 – POST /api/devices: tra cứu theo Serial/IMEI; chưa có và gửi kèm modelName → ghi nhận mới
async function registerOrFind(req, res) {
  const { device, created } = await deviceService.registerOrFind(req.body);
  if (created) log.info({ requestId: req.requestId, deviceId: device.id, customerId: device.customer_id, staffId: req.ctx.staffId }, 'đã ghi nhận thiết bị');
  res.status(created ? 201 : 200).json({ ...deviceItem(device), created });
}

// E13 – GET /api/devices/:id
async function detail(req, res) {
  const d = await deviceService.getDevice(Number(req.params.id));
  res.json({ ...deviceItem(d), customerId: d.customer_id });
}

// E14 – PATCH /api/devices/:id
async function update(req, res) {
  const d = await deviceService.updateDevice(Number(req.params.id), req.body);
  log.info({ requestId: req.requestId, deviceId: d.id, staffId: req.ctx.staffId, fields: Object.keys(req.body) }, 'đã sửa thiết bị');
  res.json({ ...deviceItem(d), customerId: d.customer_id });
}

// E15 – DELETE /api/devices/:id (chỉ Quản lý)
async function remove(req, res) {
  const id = Number(req.params.id);
  await deviceService.deleteDevice(id);
  log.info({ requestId: req.requestId, deviceId: id, staffId: req.ctx.staffId }, 'đã xoá thiết bị');
  res.status(204).end();
}

module.exports = { registerOrFind, detail, update, remove };
