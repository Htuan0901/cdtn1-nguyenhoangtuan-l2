# Tests

Chạy: `cd src/backend && npm test` – **không cần** `npm install`, không cần CSDL (dùng repository giả).

| Tệp | Nội dung | Số test |
|---|---|---|
| `backend/ticketService.test.js` | TC-01…TC-16: luồng đúng (01–04), giá trị biên (05–08), dữ liệu sai (09–16) | 16 |
| `backend/validator.test.js` | TC-17…TC-20: kiểm tra định dạng dữ liệu vào | 4 |
| `backend/slaPolicy.test.js` | QT-04, AC5.1, AC5.2, NFR6 | 6 |
| `backend/warrantyPolicy.test.js` | QT-05, AC4.1, AC4.2 | 5 |
| `backend/phonePolicy.test.js` | QT-02, QT-15, AC1.1, AC1.3 | 4 |

Kiểm NFR2 dưới tải (cần server và CSDL): `npm run nfr2`.
