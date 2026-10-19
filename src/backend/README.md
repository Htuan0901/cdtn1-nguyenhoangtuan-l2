# Backend – Smart CRM L2 (Node.js 20 + Express + PostgreSQL 16)

Lớp ② API → ③ Nghiệp vụ → ④ Truy cập dữ liệu, đúng sơ đồ `docs/architecture.drawio`.
Cách cài đặt, chạy và ánh xạ thư mục: xem `README.md` ở thư mục gốc (mục 2–5).

```
src/
├── app.js, server.js, config.js
├── api/            ② routes, controllers, middlewares (auth, validator, errorHandler), presenters
├── business/       ③ services (customer, category, ticket), policies (sla, warranty, phone), errors
└── data-access/    ④ db.js (pg Pool, giao dịch), repositories/
config/sla.config.json   QT-04 (đổi ngưỡng không sửa code – NFR6)
db/migrations/           001 DDL BT1 · 002 dữ liệu mẫu
scripts/                 migrate, make-token, demo, nfr2-concurrency
```
