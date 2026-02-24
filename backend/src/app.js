require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { initScheduler } = require('./scheduler/refill.scheduler');

const chatRoutes = require('./routes/chat.routes');
const adminRoutes = require('./routes/admin.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// ─── Middleware ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);

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

module.exports = app;
