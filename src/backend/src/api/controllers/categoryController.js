const { categoryService } = require('../../container');

// E4 – GET /api/issue-categories
async function list(_req, res) {
  const rows = await categoryService.listActive();
  res.json({ items: rows.map((r) => ({ code: r.code, name: r.name, defaultPriority: r.default_priority })) });
}

module.exports = { list };
