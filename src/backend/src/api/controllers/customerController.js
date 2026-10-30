const { customerService, deviceService } = require('../../container');
const { phoneFor, deviceItem } = require('../presenters/ticketPresenter');
const { createLogger } = require('../../logger');

const log = createLogger('customer');

const customerBody = async (c, role) => ({
  customerId: c.id,
  fullName: c.full_name,
  phone: phoneFor(c.phone, role),
  devices: (await deviceService.listByCustomer(c.id)).map(deviceItem), // để M2/M4 chọn thiết bị đã có
});

// E1 – POST /api/customers/lookup
async function lookup(req, res) {
  const c = await customerService.lookupByPhone(req.body.phone);
  res.json(await customerBody(c, req.ctx.role));
}

// E2 – POST /api/customers
async function create(req, res) {
  const c = await customerService.createCustomer(req.body);
  log.info({ requestId: req.requestId, customerId: c.id, staffId: req.ctx.staffId }, 'đã tạo khách hàng');
  res.status(201).json(await customerBody(c, req.ctx.role));
}

// E9 – GET /api/customers?q=&page=
async function list(req, res) {
  const r = await customerService.listCustomers(req.query);
  res.json({
    page: r.page, pageSize: r.pageSize, total: r.total,
    items: r.items.map((c) => ({
      customerId: c.id, fullName: c.full_name, phone: phoneFor(c.phone, req.ctx.role),
      deviceCount: c.device_count, ticketCount: c.ticket_count,
    })),
  });
}

// E10 – GET /api/customers/:id
async function detail(req, res) {
  const c = await customerService.getCustomer(Number(req.params.id));
  res.json(await customerBody(c, req.ctx.role));
}

// E11 – PATCH /api/customers/:id
async function update(req, res) {
  const c = await customerService.updateCustomer(Number(req.params.id), req.body);
  log.info({ requestId: req.requestId, customerId: c.id, staffId: req.ctx.staffId, fields: Object.keys(req.body) }, 'đã sửa khách hàng');
  res.json(await customerBody(c, req.ctx.role));
}

// E12 – DELETE /api/customers/:id (chỉ Quản lý)
async function remove(req, res) {
  const id = Number(req.params.id);
  await customerService.deleteCustomer(id);
  log.info({ requestId: req.requestId, customerId: id, staffId: req.ctx.staffId }, 'đã xoá khách hàng');
  res.status(204).end();
}

module.exports = { lookup, create, list, detail, update, remove };
