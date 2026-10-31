import { Router } from 'express';

import { getDatabaseStatus } from '../../config/database.js';
import { env } from '../../config/env.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', (_req, res) => {
  const dbStatus = getDatabaseStatus();

  const health = {
    status: dbStatus.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: {
        status: dbStatus.connected ? 'connected' : 'disconnected',
        readyState: dbStatus.readyState,
      },
    },
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
  };

  const statusCode = dbStatus.connected ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
