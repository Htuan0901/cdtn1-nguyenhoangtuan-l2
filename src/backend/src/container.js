// Composition root: nơi DUY NHẤT nối lớp ③ (services) với lớp ④ (repositories, CSDL thật).
// Controllers lấy service từ đây; unit test tự tạo service với repository giả.
const { withTransaction } = require('./data-access/db');
const ticketRepo = require('./data-access/repositories/ticketRepository');
const statusLogRepo = require('./data-access/repositories/statusLogRepository');
const customerRepo = require('./data-access/repositories/customerRepository');
const deviceRepo = require('./data-access/repositories/deviceRepository');
const categoryRepo = require('./data-access/repositories/categoryRepository');
const { createSlaPolicy } = require('./business/policies/slaPolicy');
const { createTicketService } = require('./business/services/ticketService');
const { createCustomerService } = require('./business/services/customerService');
const { createCategoryService } = require('./business/services/categoryService');

module.exports = {
  ticketService: createTicketService({
    ticketRepo, statusLogRepo, customerRepo, deviceRepo, categoryRepo, withTransaction, sla: createSlaPolicy(),
  }),
  customerService: createCustomerService({ customerRepo }),
  categoryService: createCategoryService({ categoryRepo }),
};
