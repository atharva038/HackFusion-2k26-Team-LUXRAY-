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
import notifyRoutes from './routes/notiifcation.routes.js'

const app = express();

// ─── Middleware ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);

app.use('/prescription', notifyRoutes);

// ─── Health Check ────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start Server ────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initScheduler();
  app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
}

start();

export default app;
