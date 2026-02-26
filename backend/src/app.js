import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { initScheduler } from './scheduler/refill.scheduler.js';
import { initNotificationScheduler } from './scheduler/notification.schedule.js';

import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import notifyRoutes from './routes/notification.routes.js';
import ttsRoutes from './routes/tts.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Normalize: strip trailing slash
    const normalizedOrigin = origin.replace(/\/$/, '');

    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://hack-fusion-2k26-team-luxray.vercel.app',
      'https://coral-app-neg9t.ondigitalocean.app',
    ];

    // Allow all Vercel preview deployments for this project
    if (normalizedOrigin.includes('hack-fusion-2k26') && normalizedOrigin.includes('vercel.app')) {
      return callback(null, true);
    }

    if (allowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Security Headers ───────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── Rate Limiters ───────────────────────────────
// Chat: AI calls are expensive — limit per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before chatting again.' },
});

// TTS: audio generation is billed per character
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many TTS requests. Please slow down.' },
});

// Prescription upload: OCR + Mistral call per upload
const prescriptionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait before uploading again.' },
});

// Auth: prevent brute-force on login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,
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
app.use('/api/tts', ttsLimiter, ttsRoutes);
app.use('/api/prescription', prescriptionLimiter, notifyRoutes);

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

  // ─── Graceful Shutdown ──────────────────────────────────────────
  // On SIGTERM/SIGINT: stop accepting new requests, drain existing ones,
  // then close DB connection cleanly. Critical for zero-downtime deploys.
  const shutdown = (signal) => {
    console.log(`\n[Shutdown] Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      console.log('[Shutdown] HTTP server closed. Disconnecting MongoDB...');
      try {
        const mongoose = await import('mongoose');
        await mongoose.default.connection.close();
        console.log('[Shutdown] MongoDB disconnected. Exiting.');
      } catch (e) {
        console.error('[Shutdown] DB close error:', e.message);
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
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();

export default app;
