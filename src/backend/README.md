# Backend – Smart CRM L2 (Node.js 20 + Express + PostgreSQL 16)

Lớp ② API → ③ Nghiệp vụ → ④ Truy cập dữ liệu, đúng sơ đồ `docs/architecture.drawio`.
Cách cài đặt, chạy và ánh xạ thư mục: xem `README.md` ở thư mục gốc (mục 2–5).

```
src/
├── app.js, server.js, config.js
├── api/            ② routes, controllers (auth, customer, device, category, ticket), middlewares (auth, validator, cors, errorHandler), presenters
├── business/       ③ services (auth, customer, device, category, ticket), policies (sla, warranty, phone, password), errors
└── data-access/    ④ db.js (pg Pool, giao dịch), repositories/
config/sla.config.json   QT-04 (đổi ngưỡng không sửa code – NFR6)
db/migrations/           001 DDL BT1 · 002 dữ liệu mẫu · 003 mật khẩu nhân viên
scripts/                 migrate, seed-mau (dữ liệu mẫu thật), e2e (luồng chính), make-token, demo, nfr2-concurrency
```
