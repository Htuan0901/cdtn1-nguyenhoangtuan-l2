# Backend – Node.js 20 (khớp README mục 2). Build từ THƯ MỤC GỐC repo: docker compose up --build
# Giai đoạn 1: cài đúng phiên bản trong package-lock.json (npm ci), chỉ thư viện chạy
FROM node:20-alpine AS deps
WORKDIR /app
COPY src/backend/package.json src/backend/package-lock.json ./
RUN npm ci --omit=dev

# Giai đoạn 2: ảnh chạy – chỉ chép thứ cần, chạy bằng người dùng KHÔNG đặc quyền
FROM node:20-alpine
ENV NODE_ENV=production \
    SEED_DATA_DIR=/app/data/mau
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node src/backend/ ./
COPY --chown=node:node data/mau ./data/mau
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1
# Biến môi trường (DATABASE_URL, JWT_SECRET…) truyền LÚC CHẠY qua docker compose, không nướng vào image
CMD ["node", "src/server.js"]
