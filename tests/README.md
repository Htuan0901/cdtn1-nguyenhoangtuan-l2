# Tests

| Lệnh (chạy trong `src/backend`) | Cần gì | Số test |
|---|---|---|
| `npm test` | không cần CSDL (repository giả); cần `npm ci` trước | 57 unit test |
| `npm run test:repo` | CSDL đã `npm run migrate` | 8 test repository trên PostgreSQL thật |
| `npm run crud` | backend đang chạy | CRUD Khách hàng + Thiết bị qua API, 17 bước, tự dọn dữ liệu |
| `npm run e2e` | backend đang chạy, đã `npm run seed` | luồng chính 10 bước qua API |
| `npm run nfr2` | backend đang chạy | kiểm NFR2: 1.000 yêu cầu tạo phiếu đồng thời |

**Unit test – `tests/backend/`** (ba loại: luồng đúng · giá trị biên · dữ liệu sai)

| Tệp | Nội dung | Số test |
|---|---|---|
| `ticketService.test.js` | TC-01…TC-16: luồng đúng (01–04), giá trị biên (05–08), dữ liệu sai (09–16) | 16 |
| `validator.test.js` | TC-17…TC-20, TC-26, TC-27: định dạng dữ liệu vào, ngày có thật, giới hạn số (hồi quy BUG-06, BUG-07) | 6 |
| `buoi10.test.js` | TC-21…TC-25: đăng nhập, ghi nhận thiết bị (biên ngày mua), Serial thuộc khách khác, SĐT trùng | 5 |
| `buoi12.test.js` | TC-35…TC-42: CRUD khách hàng, thiết bị – sửa SĐT chuẩn hoá, tìm kiếm, biên số tháng/ngày mua, SĐT trùng, xoá khi đang dùng, PATCH sai | 8 |
| `buoi11.test.js` | TC-28…TC-34: CORS 127.0.0.1, tìm SĐT có khoảng trắng, middleware lỗi 503 + mã tra cứu, log INFO/ERROR, logger che dữ liệu, dịch lỗi pg, pool không chết (hồi quy BUG-03, BUG-08…BUG-10) | 7 |
| `slaPolicy.test.js` | QT-04, AC5.1, AC5.2, NFR6 | 6 |
| `warrantyPolicy.test.js` | QT-05, AC4.1, AC4.2 | 5 |
| `phonePolicy.test.js` | QT-02, QT-15, AC1.1, AC1.3 | 4 |

**Test repository – `tests/repository/repositories.test.js`** (mỗi test chạy trong BEGIN … ROLLBACK, không để lại dữ liệu)

| Mã | Nội dung |
|---|---|
| TR-01 | customerRepository – insert, findByPhone, UNIQUE số điện thoại |
| TR-02 | deviceRepository – định dạng ngày mua, NULL, findByCustomer |
| TR-03 | ticketRepository.nextSequenceNumber – tăng dần, không trùng |
| TR-04 | ticketRepository.search – lọc theo trung tâm, 20 dòng/trang, sắp xếp |
| TR-05 | withTransaction – lỗi giữa chừng thì ROLLBACK cả phiếu lẫn lịch sử |
| TR-06 | customerRepository – update một phần, search SĐT/họ tên |
| TR-07 | deviceRepository – update ngày mua giữ nguyên / xoá |
| TR-08 | xoá thiết bị đã có phiếu bị khoá ngoại chặn |

Test case thủ công trên giao diện và kết quả thực thi: `docs/test-cases.md`, `docs/test-execution.md`. Kế hoạch và báo cáo: `docs/test-plan.md`, `docs/test-report.md`; lỗi đã gỡ: `docs/bug-log.md`.
