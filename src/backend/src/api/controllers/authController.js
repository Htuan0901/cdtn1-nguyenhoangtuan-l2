const { authService } = require('../../container');

// E0 – POST /api/auth/login (không cần JWT)
async function login(req, res) {
  const r = await authService.login(req.body.username, req.body.password);
  res.json(r);
}

module.exports = { login };
