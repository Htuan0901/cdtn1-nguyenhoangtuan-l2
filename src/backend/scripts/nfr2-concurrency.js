// Kiểm thử NFR2: 1.000 yêu cầu tạo phiếu đồng thời → 0 mã phiếu trùng, đo p95 thời gian phản hồi.
// Chạy khi server đang bật: npm run nfr2   (tạo 1.000 phiếu thử trong CSDL – chỉ dùng CSDL phát triển)
const { config } = require('../src/config');
const { pool } = require('../src/data-access/db');
const { makeToken } = require('./make-token');

const TOTAL = Number(process.argv[2] || 1000);
const CONCURRENCY = 100;

(async () => {
  const token = await makeToken('nv01');
  const body = JSON.stringify({ customerId: 1, deviceId: 1, issueDesc: 'NFR2 – kiểm thử đồng thời', categoryCode: 'PHAN_MEM' });
  const times = []; const codes = []; let errors = 0; let next = 0;
  async function worker() {
    while (next < TOTAL) {
      next += 1;
      const t0 = performance.now();
      const res = await fetch(`http://localhost:${config.port}/api/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body,
      });
      times.push(performance.now() - t0);
      if (res.status === 201) codes.push((await res.json()).ticketCode); else { errors += 1; await res.text(); }
    }
  }
  const start = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95) - 1];
  const dupInDb = (await pool.query(
    'SELECT count(*)::int AS n FROM (SELECT ticket_code FROM ticket GROUP BY ticket_code HAVING count(*) > 1) d')).rows[0].n;
  const noLog = (await pool.query(
    'SELECT count(*)::int AS n FROM ticket t WHERE NOT EXISTS (SELECT 1 FROM ticket_status_log l WHERE l.ticket_id = t.id)')).rows[0].n;
  console.log(`Yêu cầu: ${TOTAL} (đồng thời ${CONCURRENCY}) – thành công ${codes.length}, lỗi ${errors}`);
  console.log(`Mã trùng trong phản hồi: ${codes.length - new Set(codes).size} · mã trùng trong CSDL: ${dupInDb}`);
  console.log(`Phiếu thiếu lịch sử trạng thái (NFR5): ${noLog}`);
  console.log(`p95 = ${p95.toFixed(0)} ms (ngưỡng NFR2 ≤ 3000 ms) · tổng ${(performance.now() - start).toFixed(0)} ms`);
  console.log(dupInDb === 0 && p95 <= 3000 && errors === 0 ? 'KẾT LUẬN: ĐẠT NFR2' : 'KẾT LUẬN: CHƯA ĐẠT NFR2');
  await pool.end();
})();
