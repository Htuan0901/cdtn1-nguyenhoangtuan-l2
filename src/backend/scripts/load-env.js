// Nạp ../../.env (gốc repo) NẾU CÓ – dùng cho mọi script npm (BUG-14).
// Thay cờ --env-file của Node: cờ đó dừng chương trình khi không có tệp, nên trong container
// (không có .env, biến môi trường do docker compose truyền vào) các lệnh npm run st / e2e / crud không chạy được.
// Quy tắc giống --env-file: biến đã có sẵn trong môi trường KHÔNG bị ghi đè.
const fs = require('fs');
const path = require('path');

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.endsWith(value[0])) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

function loadEnv(file = path.join(__dirname, '..', '..', '..', '.env'), env = process.env) {
  if (!fs.existsSync(file)) return { loaded: false, file };
  const vars = parseEnv(fs.readFileSync(file, 'utf8'));
  for (const [k, v] of Object.entries(vars)) if (env[k] === undefined) env[k] = v;
  return { loaded: true, file, keys: Object.keys(vars) };
}

loadEnv();
module.exports = { parseEnv, loadEnv };
