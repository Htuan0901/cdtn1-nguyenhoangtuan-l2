// Tạo ứng dụng Express (tách khỏi server.js để kiểm thử được).
const express = require('express');
const apiRouter = require('./api/routes');
const { cors } = require('./api/middlewares/cors');
const { errorHandler, notFoundRoute } = require('./api/middlewares/errorHandler');

function createApp() {
  const app = express();
  app.use(cors);
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'OK', service: 'smartcrm-l2' }));
  app.use('/api', apiRouter);
  app.use(notFoundRoute);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
