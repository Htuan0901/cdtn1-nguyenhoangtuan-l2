// Tạo ứng dụng Express (tách khỏi server.js để kiểm thử được).
const express = require('express');
const apiRouter = require('./api/routes');
const { cors } = require('./api/middlewares/cors');
const { requestId } = require('./api/middlewares/requestId');
const { errorHandler, notFoundRoute } = require('./api/middlewares/errorHandler');
const { ping } = require('./data-access/db');

function createApp() {
  const app = express();
  app.use(requestId);
  app.use(cors);
  app.use(express.json({ limit: '100kb' }));
  // Kiểm cả CSDL: Docker HEALTHCHECK và người vận hành biết API có thực sự phục vụ được không
  app.get('/health', async (_req, res) => {
    try {
      await ping();
      res.json({ status: 'OK', db: 'OK', service: 'smartcrm-l2' });
    } catch {
      res.status(503).json({ status: 'DEGRADED', db: 'DOWN', service: 'smartcrm-l2' });
    }
  });
  app.use('/api', apiRouter);
  app.use(notFoundRoute);
  app.use(errorHandler); // đăng ký CUỐI CÙNG
  return app;
}

module.exports = { createApp };
