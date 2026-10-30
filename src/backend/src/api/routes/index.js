// Định tuyến lớp ② API. Thứ tự: xác thực → kiểm vai trò → kiểm dữ liệu → controller.
const express = require('express');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validator');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const deviceController = require('../controllers/deviceController');
const categoryController = require('../controllers/categoryController');
const ticketController = require('../controllers/ticketController');

// Bọc controller async để lỗi đi tới errorHandler (Express 4 không tự bắt Promise reject).
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = express.Router();

// Endpoint duy nhất không cần JWT
router.post('/auth/login', validate('login'), wrap(authController.login));

router.use(authenticate);

const NV = 'NV_TIEP_NHAN';
const QL = 'QL_TRUNG_TAM';
const id = validate('idParam', 'params');

// Khách hàng – đủ CRUD (TD-20). Xoá chỉ Quản lý; xoá bị chặn nếu khách đã có thiết bị/phiếu.
router.post('/customers/lookup', validate('lookupCustomer'), wrap(customerController.lookup));
router.get('/customers', validate('listCustomers', 'query'), wrap(customerController.list));
router.get('/customers/:id', id, wrap(customerController.detail));
router.post('/customers', requireRole(NV), validate('createCustomer'), wrap(customerController.create));
router.patch('/customers/:id', requireRole(NV, QL), id, validate('updateCustomer'), wrap(customerController.update));
router.delete('/customers/:id', requireRole(QL), id, wrap(customerController.remove));

// Thiết bị – đủ CRUD (TD-20). Xoá chỉ Quản lý; xoá bị chặn nếu thiết bị đã có phiếu.
router.post('/devices', requireRole(NV), validate('registerDevice'), wrap(deviceController.registerOrFind));
router.get('/devices/:id', id, wrap(deviceController.detail));
router.patch('/devices/:id', requireRole(NV, QL), id, validate('updateDevice'), wrap(deviceController.update));
router.delete('/devices/:id', requireRole(QL), id, wrap(deviceController.remove));
router.get('/issue-categories', wrap(categoryController.list));

router.post('/tickets', requireRole(NV), validate('createTicket'), wrap(ticketController.create));
router.get('/tickets', validate('listTickets', 'query'), wrap(ticketController.list));
router.get('/tickets/:ticketCode', wrap(ticketController.detail));
router.post('/tickets/:ticketCode/review', requireRole(QL), validate('reviewTicket'), wrap(ticketController.review));

module.exports = router;
