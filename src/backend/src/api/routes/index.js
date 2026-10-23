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

router.post('/customers/lookup', validate('lookupCustomer'), wrap(customerController.lookup));
router.post('/customers', requireRole('NV_TIEP_NHAN'), validate('createCustomer'), wrap(customerController.create));
router.post('/devices', requireRole('NV_TIEP_NHAN'), validate('registerDevice'), wrap(deviceController.registerOrFind));
router.get('/issue-categories', wrap(categoryController.list));

router.post('/tickets', requireRole('NV_TIEP_NHAN'), validate('createTicket'), wrap(ticketController.create));
router.get('/tickets', validate('listTickets', 'query'), wrap(ticketController.list));
router.get('/tickets/:ticketCode', wrap(ticketController.detail));
router.post('/tickets/:ticketCode/review', requireRole('QL_TRUNG_TAM'), validate('reviewTicket'), wrap(ticketController.review));

module.exports = router;
