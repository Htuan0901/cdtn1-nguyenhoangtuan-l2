const { authService } = require('../../container');
const { createLogger } = require('../../logger');

const log = createLogger('auth');

// E0 – POST /api/auth/login (không cần JWT)
async function login(req, res) {
  const r = await authService.login(req.body.username, req.body.password);
  log.info({ requestId: req.requestId, staffId: r.staff.staffId, centerCode: r.staff.centerCode }, 'đăng nhập thành công');
  res.json(r);
}

module.exports = { login };
