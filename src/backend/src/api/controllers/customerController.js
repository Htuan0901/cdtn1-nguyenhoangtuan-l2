const { customerService, deviceService } = require('../../container');
const { phoneFor, deviceItem } = require('../presenters/ticketPresenter');

const customerBody = async (c, role) => ({
  customerId: c.id,
  fullName: c.full_name,
  phone: phoneFor(c.phone, role),
  devices: (await deviceService.listByCustomer(c.id)).map(deviceItem), // để M2 chọn thiết bị đã có
});

// E1 – POST /api/customers/lookup
async function lookup(req, res) {
  const c = await customerService.lookupByPhone(req.body.phone);
  res.json(await customerBody(c, req.ctx.role));
}

// E2 – POST /api/customers
async function create(req, res) {
  const c = await customerService.createCustomer(req.body);
  res.status(201).json(await customerBody(c, req.ctx.role));
}

module.exports = { lookup, create };
