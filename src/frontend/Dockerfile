# Giao diện – máy chủ tĩnh không thư viện ngoài (server.js), cổng 5173
FROM node:20-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:5173/ > /dev/null || exit 1
CMD ["node", "server.js"]
