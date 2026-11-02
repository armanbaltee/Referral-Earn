import 'express-async-errors';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';
import { env } from './config/env.js';
import './database/models.js'; // Register all models

import healthRouter from './modules/admin/health.routes.js';
import authRouter from './modules/users/user.routes.js';
import adminUserRouter from './modules/admin/user.admin.routes.js';
import productRouter from './modules/products/product.routes.js';
import registrationPaymentRouter from './modules/transactions/registrationPayment.routes.js';
import { referralRoutes } from './modules/referrals/referral.routes.js';
import { walletRoutes } from './modules/wallet/wallet.routes.js';
import { depositRoutes } from './modules/deposits/deposit.routes.js';
import { withdrawalRoutes } from './modules/withdrawals/withdrawal.routes.js';
import { taskRoutes } from './modules/tasks/task.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// ─── Sanitize MongoDB queries ──────────────────────────────────────────────────
app.use(mongoSanitize());

// ─── Request Logging ───────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── API Docs ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin/users', adminUserRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/registration-payments', registrationPaymentRouter);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/deposits', depositRoutes);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/tasks', taskRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
