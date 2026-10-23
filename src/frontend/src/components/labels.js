// Nhãn hiển thị theo Bảng thuật ngữ (docs/srs.md mục 1.1) – chỉ đổi chữ, không chứa quy tắc nghiệp vụ.
export const STATUS = { MOI: 'Mới', CHO_XAC_MINH: 'Chờ xác minh bảo hành' };
export const PRIORITY = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };
export const WARRANTY = { CON_BAO_HANH: 'Còn bảo hành', HET_BAO_HANH: 'Hết bảo hành', CHUA_XAC_MINH: 'Chưa xác minh' };
export const ROLE = { NV_TIEP_NHAN: 'Nhân viên tiếp nhận', QL_TRUNG_TAM: 'Quản lý trung tâm bảo hành' };

// "2026-10-02T10:00:00.000+07:00" → "02/10/2026 10:00" (API đã trả giờ Việt Nam)
export function dateTime(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : iso;
}

export function date(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
