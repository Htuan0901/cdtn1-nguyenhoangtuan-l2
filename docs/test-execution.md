# Nhật ký thực thi kiểm thử – Buổi 10 (Sprint 2)

Sinh viên: Nguyễn Hoàng Tuấn – MSSV 2374802010542 · Luồng L2 · track SE

## 1. Môi trường của lần chạy
| Mục | Giá trị |
|---|---|
| Ngày giờ | 23/10/2026, 14:20 – 14:30 |
| Mã nguồn | thư mục **clone mới** của repo, làm đúng README mục 3 (bước 1 → 16) |
| Phần mềm | Node.js 22 (yêu cầu ≥ 20.6), PostgreSQL 16, trình duyệt Chromium |
| Dữ liệu | CSDL trống → `npm run migrate` (001, 002, 003) → `npm run seed` (dữ liệu mẫu thật `data/mau/`) |

## 2. Test tự động
| Lần | Lệnh | Phạm vi | Kết quả |
|---|---|---|---|
| A1 | `npm test` | 40 unit test lớp nghiệp vụ: 35 của buổi 8 + **TC-21…TC-25** (đăng nhập, thiết bị, khách hàng) | `# tests 40 · # pass 40 · # fail 0` |
| A2 | `npm run test:repo` | **5 test repository TR-01…TR-05** trên PostgreSQL thật | `# tests 5 · # pass 5 · # fail 0`; sau khi chạy không còn dòng `TEST-%` trong CSDL |
| A3 | `npm run e2e` | luồng chính qua API, 10 bước, dữ liệu mẫu thật | `KẾT LUẬN: luồng chính chạy END-TO-END 10/10 bước, không lỗi.` |
| A4 | `npm run seed` (lần 2) | nạp lại dữ liệu mẫu | “nạp mới” = 0 ở cả 4 nguồn → không nhân đôi dòng |

## 3. Thực thi 5 test case trên giao diện (`docs/test-cases.md`)
| Lần | Test case | Kết quả thực tế | P/F | Minh chứng (`docs/anh-ket-qua/buoi10/`) |
|---|---|---|---|---|
| E1 | TC-B10-01 Đăng nhập / 401 | Mật khẩu sai → “⚠ Sai tên đăng nhập hoặc mật khẩu”, ở lại trang đăng nhập. Mật khẩu đúng → M1, thanh trên “Trung tâm: TT-CT01 \| Trần Thị Bình (Nhân viên tiếp nhận)”. Đổi token thành chuỗi sai rồi bấm Lọc → về trang đăng nhập, thông báo “JWT không hợp lệ hoặc đã hết hạn – vui lòng đăng nhập lại.”, localStorage không còn phiên | PASS | `00-login-sai.png`, `11-het-phien-401.png` |
| E2 | TC-B10-02 Tạo phiếu – luồng chính | Tra cứu `0881 010 061` → “✓ Lê Bảo Tâm · 088****061”. Serial `MM-IMEI-B10-0001` chưa có → hiện ô Tên model/Ngày mua. Chọn Màn hình → ưu tiên tự đề xuất Trung bình. Tạo → “Đã tạo phiếu BH-000128/2026”, M3: Mới · Còn bảo hành · tiếp nhận 23/10/2026 14:24 · hạn 27/10/2026 14:24 (72 giờ, bỏ Chủ nhật 25/10) · lịch sử 1 dòng | PASS | `03-m2-nhap.png`, `04-m3-moi-tao.png` |
| E3 | TC-B10-03 Ngoại lệ 10a, 8a + xét duyệt | Bỏ trống ngày mua → khung đỏ 8a; bỏ trống mô tả → “Thiếu dữ liệu bắt buộc: Mô tả lỗi. Phiếu chưa được tạo (10a).” Nhập mô tả → BH-000129/2026 Chờ xác minh bảo hành. `ql01` lưu khi ghi chú trống → “Ghi chú là bắt buộc (UC07 – 5a)”; có ghi chú → “Đã lưu quyết định xét duyệt”, trạng thái Mới, lịch sử 2 dòng (Trần Thị Bình → Đặng Văn Khoa) | PASS | `05-m2-thieu-mo-ta.png`, `06-m3-xet-duyet.png`, `07-m3-da-duyet.png` |
| E4 | TC-B10-04 Danh sách, rỗng, đang tải | M1: “Hiển thị 1–20 / 65 phiếu bảo hành”, Trang 1/4, chỉ TT-CT01, SĐT dạng che. Khi API chậm → “Đang tải dữ liệu…”. Lọc `0999999999` → “Không có phiếu bảo hành phù hợp với bộ lọc…”, không báo lỗi | PASS | `01-m1.png`, `08-dang-tai.png`, `02-m1-rong.png` |
| E5 | TC-B10-05 Tắt backend | Tắt backend, tải lại → “Không tải được dữ liệu. Không kết nối được máy chủ API (http://localhost:3000/api)… (NETWORK_ERROR)” + nút Thử lại, trang không treo. Bật lại backend, bấm Thử lại → “Hiển thị 1–20 / 67 phiếu bảo hành”, không phải đăng nhập lại | PASS | `09-loi-backend-tat.png`, `10-thu-lai-thanh-cong.png` |

**Tổng hợp:** 5/5 test case PASS · 40/40 unit test · 5/5 test repository · luồng chính API 10/10 bước.

## 4. Chỗ đứt gãy phát hiện khi ghép (bước 4 – phân loại HỢP ĐỒNG DỮ LIỆU hay LOGIC)
| # | Triệu chứng | Loại | Nguyên nhân | Cách sửa |
|---|---|---|---|---|
| 1 | Rà hợp đồng M1 ↔ E6: ô “Mã phiếu / SĐT” gõ `0901 234 567` (có khoảng trắng) sẽ không ra phiếu nào | Hợp đồng dữ liệu | Giao diện gửi SĐT người dùng gõ; CSDL lưu SĐT đã chuẩn hoá `0901234567` | `ticketService.listTickets` chuẩn hoá `q` bằng QT-02 trước khi tìm |
| 2 | Báo cáo `npm run seed` đếm 4 thiết bị “bị loại” dù 4 thiết bị đó đã được nạp | Logic | Thiết bị có ngày mua không đọc được bị cộng vào cột “bị loại” | Tách thành dòng ghi chú “nạp với ngày mua trống”; số đọc = nạp + đã có + loại khớp nhau |
| 3 | TR-05 lỗi `value too long for type character varying(20)` | Hợp đồng dữ liệu | Mã phiếu thử dài 21 ký tự, cột `ticket_code` tối đa 20 (DDL BT1) | Rút ngắn mã thử; test giờ PASS và vẫn kiểm đúng ROLLBACK |
