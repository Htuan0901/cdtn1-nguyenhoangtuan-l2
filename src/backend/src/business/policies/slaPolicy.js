// QT-04: hạn cam kết = thời điểm tiếp nhận + số giờ theo mức ưu tiên,
// chỉ đếm những giờ rơi vào ngày làm việc (thứ Hai – thứ Bảy).
// Ngưỡng đọc từ config/sla.config.json → đổi quy tắc không phải sửa code (NFR6).
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '..', '..', '..', 'config', 'sla.config.json');
const HOUR = 60 * 60 * 1000;

function loadSlaConfig(file = DEFAULT_PATH) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function createSlaPolicy(cfg = loadSlaConfig()) {
  const offsetMs = cfg.utcOffsetMinutes * 60 * 1000;
  const isWorkingHour = (t) => cfg.workingDays.includes(new Date(t + offsetMs).getUTCDay());

  return {
    hoursFor(priority) {
      const h = cfg.hoursByPriority[priority];
      if (!h) throw new Error(`Mức ưu tiên không hợp lệ: ${priority}`);
      return h;
    },
    dueAt(receivedAt, priority) {
      let remaining = this.hoursFor(priority);
      let t = new Date(receivedAt).getTime();
      while (remaining > 0) {
        if (isWorkingHour(t)) remaining -= 1;
        t += HOUR;
      }
      return new Date(t);
    },
  };
}

module.exports = { createSlaPolicy, loadSlaConfig };
