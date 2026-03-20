import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { corsOriginHandler } from './config/cors.js';
import { createRedisRateLimiter } from './middleware/redisRateLimiter.js';
import { initScheduler } from './scheduler/refill.scheduler.js';
import { initNotificationScheduler } from './scheduler/notification.schedule.js';
import { initializeSocket } from './config/socket.js';

import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notifyRoutes from './routes/notification.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import userRoutes from './routes/user.routes.js';
import traceRoutes from './routes/trace.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security & Proxy Configuration ────────────────────
app.set('trust proxy', 1); // Trust first proxy (e.g. DigitalOcean, Vercel, Nginx)

// ─── Middleware ───────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Security Headers ───────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── Rate Limiters ───────────────────────────────────
// Redis-backed per-user limiters (fall back gracefully if Redis is down)
const chatLimiter = createRedisRateLimiter({
  prefix: 'chat',
  max: 20,
  windowMs: 60 * 1000,
});

const ttsLimiter = createRedisRateLimiter({
  prefix: 'tts',
  max: 30,
  windowMs: 60 * 1000,
});

// Keep express-rate-limit for non-auth routes (IP-based)
const prescriptionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait before uploading again.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased to prevent logout loops during development/frequent reloads
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/tts', ttsLimiter, ttsRoutes);
app.use('/api/prescription', prescriptionLimiter, notifyRoutes);
app.use('/api/traces', traceRoutes);
app.use('/api/invoice', invoiceRoutes);

// ─── Health Check ────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Global Error Handler ────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initScheduler();
  initNotificationScheduler();
  const server = app.listen(PORT, () =>
    console.log(`🚀 Backend running on http://localhost:${PORT} [${isProduction ? 'PRODUCTION' : 'DEV'}]`)
  );

  // Initialize Socket.IO — must be attached to the HTTP server, not the Express app
  initializeSocket(server);

  // ─── Graceful Shutdown ──────────────────────────────────────────
  // On SIGTERM/SIGINT: stop accepting new requests, drain existing ones,
  // then close DB connection cleanly. Critical for zero-downtime deploys.
  const shutdown = (signal) => {
    console.log(`\n[Shutdown] Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      console.log('[Shutdown] HTTP server closed. Disconnecting MongoDB & Redis...');
      try {
        await closeRedis();
        const mongoose = await import('mongoose');
        await mongoose.default.connection.close();
        console.log('[Shutdown] All connections closed. Exiting.');
      } catch (e) {
        console.error('[Shutdown] Close error:', e.message);
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown takes > 15s
    setTimeout(() => {
      console.error('[Shutdown] Forced exit after timeout.');
      process.exit(1);
    }, 15_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();

export default app;
