// Máy chủ tĩnh cho giao diện (không thư viện ngoài). Mặc định http://localhost:5173
// Giao diện gọi API ở địa chỉ trong src/config.js (mặc định http://localhost:3000/api).
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.FRONTEND_PORT || 5173);
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const file = path.resolve(ROOT, rel);
  // Chỉ phục vụ index.html và thư mục src/ – không lộ server.js, package.json…
  const allowed = file === path.join(ROOT, 'index.html') || file.startsWith(path.join(ROOT, 'src') + path.sep);
  if (!allowed) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    return res.end(data);
  });
}).listen(PORT, () => console.log(`Giao diện Smart CRM L2 chạy tại http://localhost:${PORT}`));
