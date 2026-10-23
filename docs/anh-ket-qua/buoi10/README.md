# Ảnh kết quả chạy toàn luồng – Buổi 10

Chụp trên hệ thống dựng từ **thư mục clone mới** theo README mục 3, dữ liệu mẫu thật đã nạp bằng `npm run seed`
(ngày 23/10/2026). Ảnh giao diện chụp bằng trình duyệt Chromium ở độ rộng 1360 px.

| Ảnh | Nội dung | Test case |
|---|---|---|
| `00-login-sai.png` | Đăng nhập sai mật khẩu → chữ đỏ, không vào được | TC-B10-01 |
| `01-m1.png` | M1 – danh sách 20 dòng/trang, SĐT dạng che, phân trang | TC-B10-04 |
| `02-m1-rong.png` | M1 – bộ lọc không có kết quả → câu giải thích (trạng thái RỖNG) | TC-B10-04 |
| `03-m2-nhap.png` | M2 – tra cứu khách (dữ liệu mẫu thật), ghi nhận thiết bị mới, ưu tiên đề xuất theo nhóm | TC-B10-02 |
| `04-m3-moi-tao.png` | M3 – phiếu vừa tạo: Mới, Còn bảo hành, hạn +72 giờ làm việc | TC-B10-02 |
| `05-m2-thieu-mo-ta.png` | M2 – thiếu ngày mua (8a) và thiếu mô tả lỗi (10a) | TC-B10-03 |
| `06-m3-xet-duyet.png` | M3 – Quản lý xét duyệt, thiếu ghi chú (5a) | TC-B10-03 |
| `07-m3-da-duyet.png` | M3 – sau xét duyệt: Mới, lịch sử 2 dòng | TC-B10-03 |
| `08-dang-tai.png` | Trạng thái ĐANG TẢI | TC-B10-04 |
| `09-loi-backend-tat.png` | Tắt backend → trạng thái LỖI có nút Thử lại | TC-B10-05 |
| `10-thu-lai-thanh-cong.png` | Bật lại backend, bấm Thử lại → danh sách hiện lại | TC-B10-05 |
| `11-het-phien-401.png` | Token sai/hết hạn → 401 → xoá token, về trang đăng nhập | TC-B10-01 |
