# Test Report – Smart CRM · Luồng L2 (Bài tập 2)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · track SE · Kế hoạch: `docs/test-plan.md`

## 1. Tổng hợp lần chạy
| Lệnh (trong `src/backend`) | Kết quả |
|---|---|
| `npm test` | **57/57 PASS** (`# tests 57 · # pass 57 · # fail 0`) |
| `npm run test:repo` | **8/8 PASS** trên PostgreSQL 16 |
| `npm run e2e` | **10/10 bước**, “luồng chính chạy END-TO-END … không lỗi” |
| `npm run crud` | **17/17 bước** – CRUD Khách hàng + Thiết bị, kể cả các trường hợp bị chặn |
| 8 test case thủ công trên giao diện | **8/8 PASS** – `docs/test-execution.md`, mục 4 dưới đây |

Môi trường: Node.js 20 LTS · PostgreSQL 16 (Docker) · dữ liệu mẫu thật nạp bằng `npm run seed`.

## 2. Unit test (`npm test`)
| Mã | Tệp | Hành vi được kiểm (tên test) | Loại | Kết quả |
|---|---|---|---|---|
| TC-01 | `ticketService.test.js` | tạo phiếu còn bảo hành: trạng thái Mới, mã BH-000007/2026, 1 dòng lịch sử | Luồng đúng | PASS |
| TC-02 | `ticketService.test.js` | bỏ trống mức ưu tiên → lấy mức mặc định của nhóm sự cố (QT-A1) | Luồng đúng | PASS |
| TC-03 | `ticketService.test.js` | quản lý chấp nhận bảo hành → Mới + Còn bảo hành, lịch sử ghi người và ghi chú | Luồng đúng | PASS |
| TC-04 | `ticketService.test.js` | danh sách luôn lọc theo trung tâm của người dùng, trang 2 bỏ qua 20 dòng | Luồng đúng | PASS |
| TC-05 | `ticketService.test.js` | tiếp nhận đúng ngày cuối cùng của hạn bảo hành (23:30) → vẫn Còn bảo hành | Biên | PASS |
| TC-06 | `ticketService.test.js` | tiếp nhận ngày kế tiếp sau hạn (00:10) → Hết bảo hành, phiếu vẫn ở trạng thái Mới | Biên | PASS |
| TC-07 | `ticketService.test.js` | thiết bị không có ngày mua → Chờ xác minh bảo hành (UC04 – 8a) | Biên | PASS |
| TC-08 | `ticketService.test.js` | số trang 0 hoặc không phải số → về trang 1 | Biên | PASS |
| TC-09 | `ticketService.test.js` | thiết bị không thuộc khách hàng → 409, không ghi gì vào CSDL | Dữ liệu sai | PASS |
| TC-10 | `ticketService.test.js` | nhóm sự cố đã ngừng sử dụng → 400 CATEGORY_INACTIVE (UC04 – 6a) | Dữ liệu sai | PASS |
| TC-11 | `ticketService.test.js` | khách hàng / thiết bị không tồn tại → 404 | Dữ liệu sai | PASS |
| TC-12 | `ticketService.test.js` | lỗi khi ghi lịch sử → cả giao dịch hủy, không có phiếu lưu dở (NFR5) | Dữ liệu sai | PASS |
| TC-13 | `ticketService.test.js` | xét duyệt với ghi chú chỉ có khoảng trắng → 400 NOTE_REQUIRED (UC07 – 5a) | Dữ liệu sai | PASS |
| TC-14 | `ticketService.test.js` | xét duyệt phiếu đã ở trạng thái Mới → 409 ALREADY_REVIEWED, không ghi đè (UC07 – 6a) | Dữ liệu sai | PASS |
| TC-15 | `ticketService.test.js` | phiếu thuộc trung tâm khác → 403 khi xem và khi xét duyệt (QT-14) | Dữ liệu sai | PASS |
| TC-16 | `ticketService.test.js` | nhân viên tiếp nhận gọi xét duyệt → 403 (UC07 – 6b) | Dữ liệu sai | PASS |
| TC-17 | `validator.test.js` | body tạo phiếu hợp lệ (bỏ trống priority) → không lỗi | Luồng đúng | PASS |
| TC-18 | `validator.test.js` | sai kiểu và sai enum → liệt kê đúng các trường lỗi | Dữ liệu sai | PASS |
| TC-19 | `validator.test.js` | biên độ dài mô tả lỗi: 5.000 ký tự đạt, 5.001 ký tự lỗi | Biên | PASS |
| TC-20 | `validator.test.js` | bộ lọc danh sách: ngày sai định dạng và trạng thái lạ bị từ chối | Dữ liệu sai | PASS |
| TC-26 | `validator.test.js` | ngày không có thật (30/02, 31/04) bị từ chối ở bộ lọc và ngày mua – không để CSDL báo lỗi 500 (BUG-06) | Dữ liệu sai | PASS |
| TC-27 | `validator.test.js` | số vượt giới hạn: page > 10.000, customerId/deviceId > 2.147.483.647 → 400 thay vì 500 (BUG-07) | Biên | PASS |
| TC-21 | `buoi10.test.js` | đăng nhập đúng: tên có chữ hoa và khoảng trắng vẫn nhận, trả JWT và hồ sơ, không lộ password_hash | Luồng đúng | PASS |
| TC-22 | `buoi10.test.js` | ngày mua: đúng HÔM NAY được ghi nhận, NGÀY MAI bị từ chối PURCHASE_DATE_IN_FUTURE | Biên | PASS |
| TC-23 | `buoi10.test.js` | sai mật khẩu và tài khoản không tồn tại trả CÙNG lỗi 401 – không lộ tên đăng nhập nào có thật | Dữ liệu sai | PASS |
| TC-24 | `buoi10.test.js` | Serial/IMEI đã thuộc khách hàng khác → 409 DEVICE_OWNED_BY_OTHER, không ghi thiết bị (UC04 – 5a) | Dữ liệu sai | PASS |
| TC-25 | `buoi10.test.js` | tạo khách hàng: SĐT "+84 911 222 333" trùng hồ sơ 0911222333 → 409 PHONE_EXISTS; SĐT sai → 400 | Dữ liệu sai | PASS |
| TC-28 | `buoi11.test.js` | mở giao diện bằng http://127.0.0.1:5173 vẫn gọi được API; origin lạ không được cấp quyền (BUG-08) | Dữ liệu sai | PASS |
| TC-29 | `buoi11.test.js` | tìm phiếu theo SĐT gõ có khoảng trắng/+84 vẫn khớp SĐT đã chuẩn hoá trong CSDL (BUG-03) | Luồng đúng | PASS |
| TC-30 | `buoi11.test.js` | CSDL mất kết nối → 503 LOI_HE_THONG kèm mã tra cứu; đúng MỘT dòng ERROR có requestId, không lộ SĐT trong query (BUG-09) | Lỗi hạ tầng | PASS |
| TC-31 | `buoi11.test.js` | lỗi nghiệp vụ (409) ghi mức INFO, không ghi ERROR; lỗi lạ không rõ nguồn → 500 | Dữ liệu sai | PASS |
| TC-32 | `buoi11.test.js` | logger: có thời điểm +07:00, mức, ngữ cảnh; tự che mật khẩu, token, SĐT; tôn trọng LOG_LEVEL | Luồng đúng | PASS |
| TC-33 | `buoi11.test.js` | dịch lỗi pg ở lớp dữ liệu: mất kết nối → DB_UNAVAILABLE, trùng khoá 23505 → DUPLICATE_KEY, còn lại → DB_ERROR | Lỗi hạ tầng | PASS |
| TC-34 | `buoi11.test.js` | pool phát sự kiện error (CSDL khởi động lại) → API KHÔNG chết, chỉ ghi WARN (BUG-10) | Lỗi hạ tầng | PASS |
| TC-35 | `buoi12.test.js` | sửa khách hàng: SĐT "+84 912 000 111" được chuẩn hoá trước khi lưu, họ tên bỏ khoảng trắng thừa | Luồng đúng | PASS |
| TC-36 | `buoi12.test.js` | danh sách khách: ô tìm là SĐT thì tìm theo SĐT đã chuẩn hoá, là chữ thì tìm theo họ tên; trang 2 bỏ qua 20 dòng | Luồng đúng | PASS |
| TC-37 | `buoi12.test.js` | giữ nguyên SĐT của chính mình không bị coi là trùng; số tháng bảo hành 0 và 60 hợp lệ, 61 bị từ chối | Biên | PASS |
| TC-38 | `buoi12.test.js` | sửa ngày mua: hôm nay được, ngày mai bị từ chối; chuỗi rỗng = xoá ngày mua (thiết bị thành chưa xác minh) | Biên | PASS |
| TC-39 | `buoi12.test.js` | đổi SĐT sang số đã thuộc khách khác → 409 PHONE_EXISTS, không ghi gì (QT-01) | Dữ liệu sai | PASS |
| TC-40 | `buoi12.test.js` | xoá khách đã có thiết bị → 409 CUSTOMER_IN_USE; xoá thiết bị đã có phiếu → 409 DEVICE_IN_USE; không xoá gì | Dữ liệu sai | PASS |
| TC-41 | `buoi12.test.js` | validator: PATCH rỗng, sửa Serial/IMEI hoặc đổi chủ thiết bị, id không phải số đều bị từ chối 400 | Dữ liệu sai | PASS |
| TC-42 | `buoi12.test.js` | khoá ngoại bị vi phạm lúc xoá (có người vừa tạo phiếu) → 409, không phải 500 | Lỗi đồng thời | PASS |
| AC, QT | `slaPolicy`, `warrantyPolicy`, `phonePolicy` | 15 test: AC1.1 – "+84 901 234 567" → 0901234567; Dạng 84…, dấu chấm, gạch nối đều chuẩn hoá được; AC1.3 – "09012" không hợp lệ; QT-15 – che 4 chữ số giữa; AC5.1 – Trung bình, tiếp nhận thứ Sáu 02/10/2026 10:00 → hạn 06/10/2026 10:00 (bỏ Chủ nhật); AC5.2 – đổi sang Cao → hạn 03/10/2026 10:00 (thứ Bảy vẫn là ngày làm việc); Thấp 120 giờ từ thứ Sáu 13:40 → thứ Năm 08/10/2026 13:40; Tiếp nhận thứ Bảy 20:00, Cao → Chủ nhật không tính → thứ Hai 20:00; NFR6 – đổi ngưỡng bằng cấu hình, không sửa code; Mức ưu tiên không hợp lệ → báo lỗi; AC4.1 – mua 15/03/2026, 12 tháng → Còn bảo hành; AC4.2 – không có ngày mua → Chưa xác minh; Mua 10/01/2024, 12 tháng → Hết bảo hành; Ngày cuối cùng còn bảo hành vẫn tính là còn (≤); Cộng tháng giữ ngày cuối tháng hợp lệ (31/01 + 1 tháng → 28/02) | Đúng / biên / sai | PASS |

## 3. Test repository (`npm run test:repo`, CSDL thật, mỗi test BEGIN … ROLLBACK)
| Mã | Hành vi được kiểm | Liên quan | Kết quả |
|---|---|---|---|
| TR-01 | insert khách rồi findByPhone trả đúng dòng; SĐT trùng bị UNIQUE chặn | QT-01 | PASS |
| TR-02 | ngày mua trả `YYYY-MM-DD` không lệch múi giờ; NULL giữ nguyên; findByCustomer đủ thiết bị | QT-05 | PASS |
| TR-03 | nextSequenceNumber hai lần cho hai số tăng dần, không trùng | QT-A2, NFR2 | PASS |
| TR-04 | search chỉ trả phiếu của trung tâm được hỏi, ≤ 20 dòng/trang, mới nhất trước | QT-14, NFR3 | PASS |
| TR-05 | withTransaction: lỗi sau INSERT phiếu + lịch sử → ROLLBACK, không còn dòng nào | NFR5 | PASS |
| TR-06 | customerRepository.update chỉ đổi trường được gửi; search theo SĐT chính xác / họ tên không phân biệt hoa thường | QT-01, NFR3 | PASS |
| TR-07 | deviceRepository.update: ngày mua undefined giữ nguyên, null xoá; model, số tháng đổi đúng | QT-05 | PASS |
| TR-08 | xoá thiết bị đã có phiếu bị khoá ngoại chặn (→ IN_USE); thiết bị chưa có phiếu xoá được | TD-07, TD-20 | PASS |

## 4. Kiểm thử tích hợp và thủ công
| Mã | Các bước | Kết quả mong đợi | Kết quả thực tế | P/F |
|---|---|---|---|---|
| E2E | `npm run e2e`: đăng nhập → tra cứu khách (dữ liệu mẫu) → Serial chưa có (404) → ghi nhận thiết bị (201) → danh mục → tạo phiếu (201) → chi tiết → quản lý đăng nhập → xét duyệt (200) → danh sách | 10/10 bước đúng mã HTTP | 10/10 | PASS |
| TC-B10-01 | Đăng nhập sai/đúng; token sai → 401 | chữ đỏ; về trang đăng nhập | đúng | PASS |
| TC-B10-02 | Tạo phiếu, thiết bị mới có ngày mua | Mới · Còn bảo hành · hạn +72 giờ làm việc | đúng | PASS |
| TC-B10-03 | Thiếu mô tả (10a), thiếu ngày mua (8a), quản lý xét duyệt | chặn 10a; Chờ xác minh → Mới, 2 dòng lịch sử | đúng | PASS |
| TC-B10-04 | Danh sách, đang tải, bộ lọc rỗng | 20 dòng/trang; câu giải thích khi rỗng | đúng | PASS |
| TC-B10-05 | Tắt backend, bấm Thử lại | khung lỗi + Thử lại; bật lại → hiện danh sách | đúng | PASS |
| TC-B11-01 | Dừng PostgreSQL rồi gọi `GET /api/tickets` | 503 `LOI_HE_THONG` + mã tra cứu; `/health` 503 | đúng | PASS |
| TC-B11-02 | Khởi động lại PostgreSQL 3 lần khi API đang chạy | API vẫn phục vụ (200) | đúng | PASS |
| CRUD | `npm run crud`: tạo/đọc/sửa/xoá khách hàng và thiết bị; SĐT trùng 409, sửa Serial 400, NV xoá 403, xoá khi đang dùng 409, đọc sau xoá 404 | 17/17 bước đúng mã HTTP, không để lại dữ liệu | 17/17 | PASS |
| TC-B12-01 | M4: tìm khách, rỗng, sửa SĐT trùng, Quản lý xoá khách đang có thiết bị | câu giải thích khi rỗng; chữ đỏ 409; NV không thấy nút xoá | đúng | PASS |

## 5. Ghi chú về tính trung thực
- TC-26, TC-27, TC-28 được viết **trước** khi sửa và **FAIL** trên mã cũ, sau khi sửa thì PASS (BUG-06, BUG-07, BUG-08). TC-29 FAIL khi chạy trên `ticketService.js` của commit 436e3a8 (trước BUG-03); TC-34 FAIL khi chạy trên `db.js` của commit 1183e34 (trước BUG-10). TC-30 … TC-33 kiểm hành vi mới của logger và middleware lỗi (BUG-09) nên được viết cùng lúc với mã.
- Trước Buổi 11, API chết khi CSDL khởi động lại (BUG-10, Critical) – không bộ unit test nào phát hiện vì lỗi chỉ xuất hiện khi chạy cả hệ thống với CSDL thật; phát hiện bằng kiểm thử thủ công TC-B11-02.
