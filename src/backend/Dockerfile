# Backend – Node.js 20 (khớp README mục 2). Build từ THƯ MỤC GỐC repo: docker compose up -d --build
# Giai đoạn 1: cài đúng phiên bản trong package-lock.json (npm ci), chỉ thư viện chạy
FROM node:20-alpine AS deps
WORKDIR /repo/src/backend
COPY src/backend/package.json src/backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Giai đoạn 2: ảnh chạy – chỉ chép thứ cần, chạy bằng người dùng KHÔNG đặc quyền.
# Bố cục trong image GIỐNG repo (/repo/src/backend, /repo/tests, /repo/data/mau, /repo/docs) để
# MỌI bộ test chạy được ngay trong container: npm test · npm run st · test:repo · e2e · crud (BUG-14, TD-24).
FROM node:20-alpine
ENV NODE_ENV=production \
    SEED_DATA_DIR=/repo/data/mau
WORKDIR /repo/src/backend
COPY --from=deps /repo/src/backend/node_modules ./node_modules
COPY --chown=node:node src/backend/ ./
COPY --chown=node:node data/mau /repo/data/mau
COPY --chown=node:node tests /repo/tests
# Tài liệu dạng văn bản: ST-11 / TC-46 quét chúng để bảo đảm không có mật khẩu (không chứa secret – .env bị .dockerignore loại)
COPY --chown=node:node README.md docker-compose.yml .env.example /repo/
COPY --chown=node:node docs/*.md /repo/docs/
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1
# Biến môi trường (DATABASE_URL, JWT_SECRET…) truyền LÚC CHẠY qua docker compose, không nướng vào image
CMD ["node", "src/server.js"]
