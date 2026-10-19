-- Migration 002 – dữ liệu mẫu (danh mục + nhân viên + khách hàng, thiết bị, 2 phiếu) để chạy thử.
-- Dữ liệu minh họa theo case study Mekong Mobile; khớp với wireframe M1–M3 của BT1.

-- Danh mục nhóm sự cố và mức ưu tiên mặc định (QT-A1)
INSERT INTO issue_category (code, name, default_priority) VALUES
  ('NUOC_VAO', 'Nước vào',   'CAO'),
  ('MAN_HINH', 'Màn hình',   'TRUNG_BINH'),
  ('PIN',      'Pin',        'TRUNG_BINH'),
  ('SAC',      'Sạc',        'TRUNG_BINH'),
  ('PHAN_MEM', 'Phần mềm',   'THAP'),
  ('KHAC',     'Khác',       'THAP')
ON CONFLICT (code) DO NOTHING;

-- Nhân viên: 2 người ở TT-CT01, 1 người ở TT-CT02 (mã trung tâm theo bộ dữ liệu mẫu Mekong Mobile) (để thử phân quyền theo trung tâm – QT-14, NFR4)
INSERT INTO staff (username, full_name, role, center_code) VALUES
  ('nv01', 'Trần Thị Bình',  'NV_TIEP_NHAN', 'TT-CT01'),
  ('ql01', 'Đặng Văn Khoa',  'QL_TRUNG_TAM', 'TT-CT01'),
  ('nv02', 'Lý Minh Châu',   'NV_TIEP_NHAN', 'TT-CT02')
ON CONFLICT (username) DO NOTHING;

INSERT INTO customer (full_name, phone) VALUES
  ('Nguyễn Minh Anh', '0901234567'),
  ('Lê Văn Cường',    '0933456218'),
  ('Phạm Thu Hà',     '0975556045')
ON CONFLICT (phone) DO NOTHING;

-- Thiết bị: còn bảo hành / hết bảo hành / không có ngày mua (chưa xác minh)
-- (mỗi thiết bị một câu lệnh để id cố định: 1 = X5 của Minh Anh, 2 = S2 của Văn Cường, 3 = A3 của Thu Hà)
INSERT INTO device (customer_id, serial_imei, model_name, purchase_date, warranty_months)
SELECT id, 'MM-IMEI-000123', 'Mekong X5', DATE '2026-03-15', 12 FROM customer WHERE phone = '0901234567'
ON CONFLICT (serial_imei) DO NOTHING;
INSERT INTO device (customer_id, serial_imei, model_name, purchase_date, warranty_months)
SELECT id, 'MM-IMEI-000789', 'Mekong S2', DATE '2024-01-10', 12 FROM customer WHERE phone = '0933456218'
ON CONFLICT (serial_imei) DO NOTHING;
INSERT INTO device (customer_id, serial_imei, model_name, purchase_date, warranty_months)
SELECT id, 'MM-IMEI-000456', 'Mekong A3', NULL, 12 FROM customer WHERE phone = '0975556045'
ON CONFLICT (serial_imei) DO NOTHING;

-- 2 phiếu mẫu (giống wireframe M1) + lịch sử trạng thái đầu tiên của mỗi phiếu (QT-06)
INSERT INTO ticket (ticket_code, customer_id, device_id, category_id, received_by, center_code,
                    issue_desc, priority, status, warranty_result, received_at, due_at)
SELECT v.code, d.customer_id, d.id, ic.id, s.id, 'TT-CT01', v.descr, v.priority, v.status, v.wres,
       v.recv::timestamptz, v.due::timestamptz
FROM (VALUES
  ('BH-000001/2026', 'MM-IMEI-000123', 'MAN_HINH', 'Màn hình nhấp nháy khi mở máy', 'TRUNG_BINH', 'MOI', 'CON_BAO_HANH',
   '2026-10-02 10:00+07', '2026-10-06 10:00+07'),
  ('BH-000002/2026', 'MM-IMEI-000456', 'PIN', 'Pin tụt nhanh, máy nóng khi sạc', 'TRUNG_BINH', 'CHO_XAC_MINH', 'CHUA_XAC_MINH',
   '2026-10-02 11:05+07', '2026-10-06 11:05+07')
) AS v(code, serial, cat, descr, priority, status, wres, recv, due)
JOIN device d ON d.serial_imei = v.serial
JOIN issue_category ic ON ic.code = v.cat
JOIN staff s ON s.username = 'nv01'
ON CONFLICT (ticket_code) DO NOTHING;

INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, changed_at, note)
SELECT t.id, NULL, t.status, t.received_by, t.received_at,
       CASE WHEN t.status = 'CHO_XAC_MINH' THEN 'Tạo phiếu – thiếu ngày mua' ELSE 'Tạo phiếu' END
FROM ticket t
WHERE t.ticket_code IN ('BH-000001/2026', 'BH-000002/2026')
  AND NOT EXISTS (SELECT 1 FROM ticket_status_log l WHERE l.ticket_id = t.id);

-- Bộ đếm mã phiếu tiếp tục sau 2 phiếu mẫu (QT-A2)
SELECT setval('ticket_code_seq', GREATEST((SELECT last_value FROM ticket_code_seq), 2));
