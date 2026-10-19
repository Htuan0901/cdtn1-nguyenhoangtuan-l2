-- Migration 001 – tạo 6 bảng theo đúng DDL đã nộp ở BT1 (db/schema.sql).
-- Khác biệt duy nhất: thêm IF NOT EXISTS để chạy lại không lỗi.

-- 1. staff – Nhân viên (Nhân viên tiếp nhận, Quản lý trung tâm bảo hành)
CREATE TABLE IF NOT EXISTS staff (
    id           SERIAL       PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    full_name    VARCHAR(100) NOT NULL,
    role         VARCHAR(20)  NOT NULL CHECK (role IN ('NV_TIEP_NHAN', 'QL_TRUNG_TAM')),
    center_code  VARCHAR(10)  NOT NULL,               -- mã trung tâm bảo hành (danh mục trung tâm: ngoài phạm vi)
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 2. customer – Khách hàng
CREATE TABLE IF NOT EXISTS customer (
    id           SERIAL       PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    phone        CHAR(10)     NOT NULL UNIQUE CHECK (phone ~ '^0[0-9]{9}$'),   -- QT-01, QT-02
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3. device – Thiết bị
CREATE TABLE IF NOT EXISTS device (
    id              SERIAL       PRIMARY KEY,
    customer_id     INT          NOT NULL REFERENCES customer(id),
    serial_imei     VARCHAR(50)  NOT NULL UNIQUE,                               -- QT-03
    model_name      VARCHAR(100) NOT NULL,
    purchase_date   DATE         NULL,                                          -- NULL => chưa xác minh bảo hành (QT-05)
    warranty_months SMALLINT     NOT NULL DEFAULT 12 CHECK (warranty_months BETWEEN 0 AND 60),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 4. issue_category – Nhóm sự cố
CREATE TABLE IF NOT EXISTS issue_category (
    id                SERIAL      PRIMARY KEY,
    code              VARCHAR(20) NOT NULL UNIQUE,      -- MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC
    name              VARCHAR(50) NOT NULL,
    default_priority  VARCHAR(10) NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),  -- QT-A1
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE
);

-- 5. ticket – Phiếu bảo hành
CREATE SEQUENCE IF NOT EXISTS ticket_code_seq;                    -- sinh mã phiếu không trùng khi tạo đồng thời (NFR2)
CREATE TABLE IF NOT EXISTS ticket (
    id               BIGSERIAL    PRIMARY KEY,
    ticket_code      VARCHAR(20)  NOT NULL UNIQUE,     -- BH-000123/2026 (QT-A2)
    customer_id      INT          NOT NULL REFERENCES customer(id),
    device_id        INT          NOT NULL REFERENCES device(id),
    category_id      INT          NOT NULL REFERENCES issue_category(id),
    received_by      INT          NOT NULL REFERENCES staff(id),
    center_code      VARCHAR(10)  NOT NULL,
    issue_desc       VARCHAR(5000) NOT NULL CHECK (length(trim(issue_desc)) > 0),
    priority         VARCHAR(10)  NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    status           VARCHAR(20)  NOT NULL CHECK (status IN ('MOI', 'CHO_XAC_MINH')),   -- L2 chỉ sinh 2 trạng thái này
    warranty_result  VARCHAR(20)  NOT NULL CHECK (warranty_result IN ('CON_BAO_HANH', 'HET_BAO_HANH', 'CHUA_XAC_MINH')),
    received_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    due_at           TIMESTAMPTZ  NOT NULL,            -- hạn cam kết, chốt tại thời điểm tạo phiếu (QT-04)
    CHECK (due_at > received_at)
);

-- 6. ticket_status_log – Lịch sử trạng thái phiếu
CREATE TABLE IF NOT EXISTS ticket_status_log (
    id           BIGSERIAL    PRIMARY KEY,
    ticket_id    BIGINT       NOT NULL REFERENCES ticket(id),
    from_status  VARCHAR(20)  NULL,                    -- NULL ở dòng đầu tiên (tạo phiếu)
    to_status    VARCHAR(20)  NOT NULL,
    changed_by   INT          NOT NULL REFERENCES staff(id),
    changed_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    note         VARCHAR(500) NULL                     -- ghi chú quyết định xét duyệt (UC07)
);

-- Index phục vụ NFR1, NFR3 (customer.phone, device.serial_imei đã có index qua UNIQUE)
CREATE INDEX IF NOT EXISTS ix_ticket_center_received ON ticket (center_code, received_at DESC);
CREATE INDEX IF NOT EXISTS ix_ticket_status_due      ON ticket (status, due_at);
CREATE INDEX IF NOT EXISTS ix_device_customer        ON device (customer_id);
CREATE INDEX IF NOT EXISTS ix_status_log_ticket      ON ticket_status_log (ticket_id, changed_at);
