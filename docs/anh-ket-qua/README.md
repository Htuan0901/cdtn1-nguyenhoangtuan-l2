# Ảnh kết quả chạy – Buổi 8

Ảnh chụp trên máy Windows (Git Bash), PostgreSQL 16 chạy bằng Docker (TD-11).

| Tên ảnh | Nội dung |
|---|---|
| `01-migrate.png` | `npm run migrate` chạy 2 lần: lần 1 tạo 6 bảng, lần 2 bỏ qua |
| `02-test.png` | `npm test`: tests 35, pass 35, fail 0 |
| `03-demo-tao-phieu.png` | `npm run demo` tình huống 5–6: 400 thiếu mô tả lỗi; danh sách phiếu (phiếu mới tạo đứng đầu) |
| `04-demo-loi.png` | `npm run demo` tình huống 7–9: 403 khác trung tâm, 400 thiếu ghi chú, 200 quản lý chấp nhận |
| `04b-demo-loi.png` | `npm run demo` tình huống 10–11: 409 xét duyệt lần hai, 401 thiếu JWT |
| `05-nfr2.png` | `npm run nfr2`: 1.000 yêu cầu, 0 lỗi, 0 mã trùng, p95 = 369 ms → ĐẠT NFR2 |
| `06-git-log.png` | `git log --oneline -7` và `git push` |
