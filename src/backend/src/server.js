const { config, assertConfig } = require('./config');

assertConfig();
const { createApp } = require('./app');
const { pool } = require('./data-access/db');
const { createLogger } = require('./logger');

const log = createLogger('server');
const server = createApp().listen(config.port, () => {
  log.info({ port: config.port, logLevel: process.env.LOG_LEVEL || 'info' }, `Smart CRM L2 API chạy tại http://localhost:${config.port}`);
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
