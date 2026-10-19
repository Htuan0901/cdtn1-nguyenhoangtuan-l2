const { customerService } = require('../../container');
const { phoneFor } = require('../presenters/ticketPresenter');

// E1 – POST /api/customers/lookup
async function lookup(req, res) {
  const c = await customerService.lookupByPhone(req.body.phone);
  res.json({ customerId: c.id, fullName: c.full_name, phone: phoneFor(c.phone, req.ctx.role) });
}

module.exports = { lookup };
