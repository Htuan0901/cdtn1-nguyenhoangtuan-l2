# Test Plan rút gọn – Smart CRM · Luồng L2 (Bài tập 2)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · track SE

## 1. Phạm vi kiểm thử và phần chủ ý KHÔNG kiểm
**Được kiểm**
- CRUD Khách hàng và Thiết bị (Buổi 12): sửa, xoá có ràng buộc, quyền xoá chỉ Quản lý.
- Quy tắc nghiệp vụ ở lớp ③: QT-01, QT-02 (SĐT), QT-03 (Serial thuộc một khách), QT-04 (hạn cam kết, chỉ ngày làm việc), QT-05 (bảo hành, biên ngày cuối), QT-06 (lịch sử), QT-14 (trung tâm), QT-15 (che SĐT), QT-A1…QT-A3; đăng nhập.
- Kiểm tra dữ liệu vào ở lớp ② (validator): kiểu, enum, độ dài, ngày có thật, giới hạn số.
- SQL của lớp ④ trên PostgreSQL thật: UNIQUE, định dạng ngày, phân trang theo trung tâm, ROLLBACK.
- Xử lý lỗi xuyên lớp và log: dịch lỗi CSDL, 503 + mã tra cứu, ghi log một lần, che dữ liệu nhạy cảm.
- Luồng chính end-to-end qua API và trên giao diện (M1–M3), ba trạng thái đang tải · rỗng · lỗi.

**Chủ ý KHÔNG kiểm (lý do)**
- Kiểm thử giao diện tự động (Selenium/Playwright): giao diện 3 màn hình, kiểm bằng 5 test case thủ công `docs/test-cases.md`.
- Hiệu năng dài hạn, bảo mật chuyên sâu: thuộc Chuyên đề tốt nghiệp 2; NFR2 đo một lần bằng `npm run nfr2`.
- Tương thích nhiều trình duyệt: chỉ thử Chrome/Edge bản mới.

## 2. Loại test và số lượng
| Tầng | Số lượng | Tệp / lệnh | Cần CSDL? |
|---|---|---|---|
| Unit – quy tắc (policies) | 15 | `tests/backend/slaPolicy`, `warrantyPolicy`, `phonePolicy` | Không |
| Unit – TicketService | 16 | `tests/backend/ticketService.test.js` (TC-01…TC-16) | Không (repository giả) |
| Unit – Validator | 6 | `tests/backend/validator.test.js` (TC-17…TC-20, TC-26, TC-27) | Không |
| Unit – Buổi 10 (đăng nhập, thiết bị, khách hàng) | 5 | `tests/backend/buoi10.test.js` (TC-21…TC-25) | Không |
| Unit – Buổi 11 (CORS, tìm SĐT, log, xử lý lỗi) | 7 | `tests/backend/buoi11.test.js` (TC-28…TC-34) | Không |
| Unit – Buổi 12 (CRUD khách hàng, thiết bị) | 8 | `tests/backend/buoi12.test.js` (TC-35…TC-42) | Không |
| **Tổng unit test – `npm test`** | **57** | một lệnh | |
| Test repository | 8 | `npm run test:repo` (TR-01…TR-08) | Có |
| Luồng chính qua API | 1 kịch bản / 10 bước | `npm run e2e` | Có, backend chạy |
| CRUD 2 thực thể qua API | 1 kịch bản / 17 bước | `npm run crud` | Có, backend chạy |
| Test case thủ công trên giao diện | 8 | `docs/test-cases.md` (TC-B10-01…05, TC-B11-01…02, TC-B12-01) | Có |

Ba loại theo yêu cầu BT2: **luồng đúng** (vd. TC-01, TC-03, TC-21, TC-35), **giá trị biên** (TC-05, TC-06, TC-19, TC-22, TC-27, TC-37, TC-38), **dữ liệu sai** (TC-09…TC-16, TC-18, TC-23…TC-26, TC-39…TC-41).

## 3. Tiêu chí thành công đo được
- `npm test` → **57/57 PASS** bằng một lệnh, không cần CSDL; `npm run test:repo` → 8/8; `npm run e2e` → 10/10 bước; `npm run crud` → 17/17 bước.
- Mỗi quy tắc nghiệp vụ có ít nhất một test luồng đúng và một test biên hoặc dữ liệu sai.
- Mỗi lỗi đã sửa trong `docs/bug-log.md` có test hồi quy hoặc lệnh xác nhận; test hồi quy FAIL trên mã trước khi sửa (vd. TC-29).
- Không còn bug Critical đang mở.
- Phép thử máy trắng: clone vào thư mục mới, làm đúng README mục 3 → hệ thống chạy, giao diện đăng nhập được.

## 4. Môi trường và dữ liệu thử
- Node.js 20 LTS, PostgreSQL 16 (Docker), Chrome bản mới; Windows 11 + Git Bash.
- Unit test: dữ liệu do test tự dựng; thời gian tiêm qua tham số `now` nên kết quả không phụ thuộc ngày chạy.
- Test repository: mỗi test trong `BEGIN … ROLLBACK`, không để lại dữ liệu.
- Test tích hợp và thủ công: dữ liệu mẫu THẬT của học phần nạp bằng `npm run seed` (`data/mau/`).
