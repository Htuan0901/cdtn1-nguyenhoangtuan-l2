-- Migration 003 – Buổi 10: thêm mật khẩu cho nhân viên để có màn hình đăng nhập (TD-12).
-- Thay đổi so với DDL BT1: thêm MỘT cột staff.password_hash (không thêm bảng, vẫn 6 bảng).
-- Mật khẩu băm bằng scrypt (src/business/policies/passwordPolicy.js), KHÔNG lưu mật khẩu gốc.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password_hash VARCHAR(200);

-- Mật khẩu chung của 3 tài khoản mẫu (chỉ dùng trên máy phát triển): Mekong@2026
UPDATE staff SET password_hash = 'scrypt$a1f3c5e7b9d2f4a6c8e0b1d3f5a7c9e1$e436ab68c8885edc2c3086d5744f56fb03fbf99fd33bee46d02c009fd7433cbf'
 WHERE username = 'nv01' AND password_hash IS NULL;
UPDATE staff SET password_hash = 'scrypt$b2e4d6f8a0c1e3b5d7f9a2c4e6b8d0f1$1ddfff58314972c15d9dfff01e163c2b6d1ed436077812bb4bff47dec8908670'
 WHERE username = 'ql01' AND password_hash IS NULL;
UPDATE staff SET password_hash = 'scrypt$c3d5f7a9b1e2d4f6a8c0e1b3d5f7a9c2$833872d34b0888277d2a9a4e872085a3c3837c1d45bbffad13ac13606379b62b'
 WHERE username = 'nv02' AND password_hash IS NULL;
