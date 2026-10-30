# Bug Log – Smart CRM · Luồng L2 (track SE)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542. Mẫu 7 dòng theo Buổi 11; mỗi lỗi được gỡ theo bốn bước
**tái lập → khoanh vùng → sửa nguyên nhân → xác nhận bằng test**. Dòng 5 ghi NGUYÊN NHÂN, không ghi triệu chứng.

| Mã | Mức độ | Tóm tắt | Phát hiện | Commit sửa | Test xác nhận |
|---|---|---|---|---|---|
| BUG-01 | Major | Mở chi tiết phiếu ra 404 vì mã phiếu chứa “/” | Buổi 8 | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) | `npm run demo` tình huống 7–10, `npm run e2e` bước 7 |
| BUG-02 | Major | Lỗi trong controller async làm request treo | Buổi 8 | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) | `npm run demo` tình huống 2, 5, 8 |
| BUG-03 | Major | Tìm phiếu theo SĐT có khoảng trắng không ra kết quả | Buổi 10 | [47e2bc2](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/47e2bc2) · test [e1125cf](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e1125cf) | TC-29 |
| BUG-04 | Minor | `npm run seed` đếm thiết bị vào cột “bị loại” dù đã nạp | Buổi 10 | [6901a7d](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/6901a7d) | chạy lại seed: đọc = nạp + đã có + loại |
| BUG-05 | Minor | TR-05 lỗi “value too long for type character varying(20)” | Buổi 10 | [99996cc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/99996cc) | TR-05 |
| BUG-06 | Major | Ngày không có thật (30/02) trả 500 | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-26 |
| BUG-07 | Major | Số trang / mã khách quá lớn trả 500 | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-27 |
| BUG-08 | Major | Mở giao diện bằng 127.0.0.1 → CORS chặn mọi lời gọi API | Buổi 11 | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) | TC-28 |
| BUG-09 | Major | CSDL mất kết nối → 500 không mã tra cứu, log không truy vết được | Buổi 11 | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) | TC-30, TC-33 |
| BUG-10 | **Critical** | CSDL khởi động lại khi API đang chạy → API chết hẳn | Buổi 11 | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) | TC-34 |

---

### BUG-10 · Critical – API dừng hẳn khi CSDL khởi động lại
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-10 · **Critical** – toàn bộ hệ thống ngừng phục vụ, phải chạy lại `npm start` bằng tay |
| 2. Phát hiện bởi | Kiểm thử thủ công Buổi 11: tắt rồi bật lại PostgreSQL (tương đương `docker restart smartcrm-pg`) khi API đang chạy |
| 3. Triệu chứng | Sau khi CSDL bật lại, giao diện báo “Không kết nối được máy chủ API”; cửa sổ backend đã thoát với `Unhandled 'error' event` |
| 4. Cách tái lập | `npm start` → gọi `GET /api/tickets` một lần (để pool có kết nối rảnh) → dừng PostgreSQL → `curl localhost:3000/health`: không phản hồi. Tái lập **3/3 lần** |
| 5. Nguyên nhân | Khi CSDL đóng kết nối, kết nối RẢNH trong `pg.Pool` phát sự kiện `'error'`; `db.js` không đăng ký listener nên Node.js coi là lỗi chưa xử lý và dừng tiến trình. Khoanh vùng: ngăn xếp lỗi kết thúc ở `BoundPool` (lớp ④), không đi qua controller |
| 6. Cách sửa | `data-access/db.js`: `pool.on('error', …)` ghi WARN – pool tự bỏ kết nối hỏng và tạo kết nối mới; thêm `connectionTimeoutMillis: 5000` để request không treo khi CSDL không trả lời |
| 7. Commit và xác nhận | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) · chạy lại bước 4 ba lần: API vẫn trả 200 sau mỗi lần CSDL bật lại · TC-34 PASS |

### BUG-09 · Major – CSDL mất kết nối trả 500, người dùng không có mã tra cứu, log không truy vết được
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-09 · Major – khi có sự cố không biết dòng log nào ứng với lời báo của người dùng |
| 2. Phát hiện bởi | Rà xử lý lỗi theo Buổi 11 (năm kiểu xử lý lỗi sai): dừng PostgreSQL rồi gọi API |
| 3. Triệu chứng | `GET /api/tickets` → 500 “Lỗi hệ thống, vui lòng thử lại”; `/health` vẫn trả OK; log là 36 dòng `console.error` không có thời điểm, mức, requestId |
| 4. Cách tái lập | Dừng PostgreSQL → `curl -H "Authorization: Bearer <JWT>" localhost:3000/api/tickets` (5/5 lần) |
| 5. Nguyên nhân | Lỗi kỹ thuật của thư viện pg (ECONNREFUSED) đi thẳng lên middleware mà không được DỊCH ở lớp dữ liệu, nên middleware không phân biệt được “CSDL không sẵn sàng” (503) với lỗi lập trình (500); ứng dụng không có logger và không gắn requestId cho request |
| 6. Cách sửa | `data-access/errors.js` dịch lỗi pg → DB_UNAVAILABLE / DUPLICATE_KEY / DB_ERROR; middleware lỗi duy nhất trả 503 `LOI_HE_THONG` + “Mã tra cứu: <requestId>”, ghi ERROR **một lần** kèm requestId; `logger.js` JSON có thời điểm +07:00, tự che dữ liệu nhạy cảm; `/health` kiểm cả CSDL |
| 7. Commit và xác nhận | [04bb9b7](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/04bb9b7) · bước 4 → 503 + mã tra cứu, đúng 1 dòng ERROR trong log · TC-30, TC-33 PASS |

### BUG-08 · Major – Mở giao diện bằng 127.0.0.1 thì mọi màn hình báo lỗi kết nối
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-08 · Major – người chấm làm theo README nhưng gõ 127.0.0.1 sẽ thấy hệ thống “không chạy” |
| 2. Phát hiện bởi | Rà bảng lỗi tích hợp hay gặp (Buổi 10, dòng CORS); thử mở http://127.0.0.1:5173 |
| 3. Triệu chứng | Đăng nhập báo “Không kết nối được máy chủ API” dù backend đang chạy; DevTools báo lỗi CORS |
| 4. Cách tái lập | `curl -i -X OPTIONS localhost:3000/api/tickets -H "Origin: http://127.0.0.1:5173"` → không có header `Access-Control-Allow-Origin` |
| 5. Nguyên nhân | `FRONTEND_ORIGIN` mặc định (config.js và .env.example) chỉ có `http://localhost:5173`; với trình duyệt, localhost và 127.0.0.1 là hai origin khác nhau |
| 6. Cách sửa | Mặc định gồm cả hai origin, cách nhau bằng dấu phẩy; vẫn không dùng “*” (NFR4) |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · bước 4 có header đúng · TC-28 PASS (kể cả origin lạ vẫn bị từ chối) |

### BUG-07 · Major – Số trang hoặc mã khách quá lớn trả 500
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-07 · Major – dữ liệu sai làm lỗi hệ thống thay vì báo người dùng nhập lại |
| 2. Phát hiện bởi | Rà giá trị biên của validator (Buổi 11) |
| 3. Triệu chứng | `GET /api/tickets?page=99999999999999999999` và `POST /api/tickets` với `customerId: 3000000000` → 500 |
| 4. Cách tái lập | Hai lệnh curl ở dòng 3 (3/3 lần); log: `invalid input syntax for type bigint: "2e+21"`, `value "3000000000" is out of range for type integer` |
| 5. Nguyên nhân | Validator chỉ kiểm “là số nguyên dương”, không kiểm giới hạn kiểu INT của PostgreSQL; Number(…) đổi số rất lớn thành dạng mũ `2e+21` |
| 6. Cách sửa | Validator (ranh giới lớp ②) giới hạn `page` ≤ 10.000 và mã ≤ 2.147.483.647 → 400 VALIDATION_ERROR |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · bước 4 → 400 kèm tên trường · TC-27 PASS (biên 10.000 vẫn hợp lệ) |

### BUG-06 · Major – Ngày không có thật trả 500
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-06 · Major |
| 2. Phát hiện bởi | Rà giá trị biên của validator (Buổi 11) |
| 3. Triệu chứng | Lọc M1 với `from=2026-02-30` hoặc ghi nhận thiết bị có `purchaseDate: "2026-02-30"` → 500 |
| 4. Cách tái lập | `curl "localhost:3000/api/tickets?from=2026-02-30" -H "Authorization: Bearer <JWT>"` (3/3 lần); log: `date/time field value out of range` (22008) |
| 5. Nguyên nhân | `isDate` chỉ kiểm hình dạng `YYYY-MM-DD` bằng biểu thức chính quy, không kiểm ngày có thật trên lịch; lỗi chỉ lộ ra khi PostgreSQL ép kiểu `::date` |
| 6. Cách sửa | `isDate` dựng lại ngày và so khớp chuỗi → 30/02, 31/04 bị từ chối 400; năm nhuận 29/02/2028 vẫn hợp lệ |
| 7. Commit và xác nhận | [d055c83](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/d055c83) · TC-26 PASS |

### BUG-05 · Minor – Test repository TR-05 lỗi “value too long”
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-05 · Minor – lỗi trong dữ liệu thử, không ảnh hưởng người dùng |
| 2. Phát hiện bởi | `npm run test:repo` lần đầu (Buổi 10) |
| 3. Triệu chứng | TR-05 FAIL: `value too long for type character varying(20)` |
| 4. Cách tái lập | `npm run test:repo` (lần nào cũng FAIL) |
| 5. Nguyên nhân | Mã phiếu thử `TEST-TX-<Date.now()>` dài 21 ký tự; cột `ticket_code` theo DDL BT1 tối đa 20 – lệch hợp đồng dữ liệu giữa test và CSDL |
| 6. Cách sửa | Rút ngắn mã thử (`Date.now() % 1e9`), ghi chú giới hạn ngay cạnh dòng tạo mã |
| 7. Commit và xác nhận | [99996cc](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/99996cc) · TR-05 PASS và vẫn kiểm đúng ROLLBACK |

### BUG-04 · Minor – Báo cáo nạp dữ liệu mẫu đếm sai
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-04 · Minor |
| 2. Phát hiện bởi | Đối chiếu số dòng sau `npm run seed` (Buổi 10, bước 4 – phân loại lỗi logic) |
| 3. Triệu chứng | Bảng kết quả ghi 4 thiết bị “bị loại”, nhưng CSDL có đủ 290 thiết bị |
| 4. Cách tái lập | `npm run seed` trên CSDL trống |
| 5. Nguyên nhân | Lỗi logic: thiết bị có ngày mua không đọc được (vẫn được nạp với ngày mua trống) bị cộng vào bộ đếm “bị loại” |
| 6. Cách sửa | Tách thành dòng ghi chú “nạp với ngày mua trống”; cột “bị loại” chỉ đếm dòng thực sự không nạp |
| 7. Commit và xác nhận | [6901a7d](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/6901a7d) · chạy lại: đọc = nạp + đã có + bị loại ở cả 4 nguồn |

### BUG-03 · Major – Tìm phiếu theo SĐT có khoảng trắng không ra kết quả
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-03 · Major – nhân viên gõ SĐT như khách đọc (“0901 234 567”) sẽ tưởng khách chưa có phiếu |
| 2. Phát hiện bởi | Rà hợp đồng dữ liệu M1 ↔ E6 khi ghép giao diện (Buổi 10) |
| 3. Triệu chứng | Ô “Mã phiếu / SĐT” ở M1: “0901 234 567” → “Không có phiếu bảo hành phù hợp”, “0901234567” → có kết quả |
| 4. Cách tái lập | `GET /api/tickets?q=0901%20234%20567` |
| 5. Nguyên nhân | Lệch hợp đồng: giao diện gửi SĐT nguyên văn, CSDL lưu SĐT đã chuẩn hoá (QT-02); repository so khớp bằng `=` |
| 6. Cách sửa | `ticketService.listTickets` chuẩn hoá `q` bằng QT-02 trước khi tìm (mã phiếu: bỏ khoảng trắng, chữ hoa) |
| 7. Commit và xác nhận | sửa [47e2bc2](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/47e2bc2) · test [e1125cf](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/e1125cf): TC-29 FAIL trên mã trước khi sửa, PASS sau khi sửa |

### BUG-02 · Major – Lỗi trong controller async làm request treo
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-02 · Major |
| 2. Phát hiện bởi | Chạy `npm run demo` lần đầu (Buổi 8), tình huống SĐT không hợp lệ |
| 3. Triệu chứng | Lời gọi không bao giờ trả về; terminal báo `UnhandledPromiseRejection` |
| 4. Cách tái lập | `POST /api/customers/lookup` với `{"phone":"09012"}` |
| 5. Nguyên nhân | Express 4 không tự chuyển Promise bị reject của hàm async tới middleware lỗi; lỗi nghiệp vụ ném trong controller không đi tới `errorHandler` |
| 6. Cách sửa | Bọc mọi controller bằng `wrap()` trong `api/routes/index.js` để `catch(next)` |
| 7. Commit và xác nhận | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) · demo tình huống 2, 5, 8 trả 400 ngay |

### BUG-01 · Major – Mở chi tiết phiếu ra 404 vì mã phiếu có dấu “/”
| Dòng | Nội dung |
|---|---|
| 1. Mã và mức độ | BUG-01 · Major |
| 2. Phát hiện bởi | Viết `npm run demo` (Buổi 8), gọi chi tiết phiếu vừa tạo |
| 3. Triệu chứng | `GET /api/tickets/BH-000003/2026` → 404 ROUTE_NOT_FOUND |
| 4. Cách tái lập | curl đường dẫn ở dòng 3 |
| 5. Nguyên nhân | Mã phiếu theo QT-A2 có dấu “/”, trùng ký tự phân tách đường dẫn URL nên router hiểu thành hai đoạn |
| 6. Cách sửa | Hợp đồng API quy định client gửi mã đã mã hoá `BH-000003%2F2026` (`encodeURIComponent`); ghi vào api-contract mục 1; giao diện dùng `tickets.api.js` mã hoá tự động |
| 7. Commit và xác nhận | [7aebb38](https://github.com/Htuan0901/cdtn1-nguyenhoangtuan-l2/commit/7aebb38) · `npm run e2e` bước 7, 9, 10 dùng mã đã mã hoá → 200 |
