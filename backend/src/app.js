import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB  } from './config/db.js';
import { initScheduler  } from './scheduler/refill.scheduler.js';

import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import ttsRoutes from './routes/tts.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://hack-fusion-2k26-team-luxray.vercel.app',
      'https://coral-app-neg9t.ondigitalocean.app',
    ];
    
    // Also allow all Vercel preview deployments for this project
    if (origin.includes('hack-fusion-2k26') && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (allowed.includes(origin)) {
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

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/tts', ttsRoutes);

// ─── Health Check ────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Serve static frontend in production ─────────
if (isProduction) {
  const { dirname, join } = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const frontendPath = join(__dirname, '..', '..', 'frontend', 'dist');

  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(frontendPath, 'index.html'));
    }
  });
}

// ─── Global Error Handler ────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// ─── Start Server ────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initScheduler();
  app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT} [${isProduction ? 'PRODUCTION' : 'DEV'}]`));
}

start();

export default app;
