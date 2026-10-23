# Tests

| Lệnh (chạy trong `src/backend`) | Cần gì | Số test |
|---|---|---|
| `npm test` | không cần CSDL (repository giả) | 40 unit test lớp nghiệp vụ |
| `npm run test:repo` | CSDL đã `npm run migrate` | 5 test repository trên PostgreSQL thật |
| `npm run e2e` | backend đang chạy, đã `npm run seed` | luồng chính 10 bước qua API |
| `npm run nfr2` | backend đang chạy | kiểm NFR2: 1.000 yêu cầu tạo phiếu đồng thời |

**Unit test – `tests/backend/`** (ba loại: luồng đúng · giá trị biên · dữ liệu sai)

| Tệp | Nội dung | Số test |
|---|---|---|
| `ticketService.test.js` | TC-01…TC-16: luồng đúng (01–04), giá trị biên (05–08), dữ liệu sai (09–16) | 16 |
| `validator.test.js` | TC-17…TC-20: kiểm tra định dạng dữ liệu vào | 4 |
| `buoi10.test.js` | TC-21…TC-25: đăng nhập, ghi nhận thiết bị (biên ngày mua), Serial thuộc khách khác, SĐT trùng | 5 |
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

Test case thủ công trên giao diện và kết quả thực thi: `docs/test-cases.md`, `docs/test-execution.md`.
