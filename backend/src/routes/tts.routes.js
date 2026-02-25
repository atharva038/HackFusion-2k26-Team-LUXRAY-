import { Router } from 'express';
import { generateSpeech } from '../controllers/tts.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Simple in-memory rate limiter (per IP, 20 requests / minute)
const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function ttsRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_WINDOW_MS);
  
  if (timestamps.length >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many TTS requests. Please wait a moment.' });
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap) {
    const active = timestamps.filter(t => now - t < RATE_WINDOW_MS);
    if (active.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, active);
  }
}, 5 * 60 * 1000);

// POST /api/tts — protected + rate limited
router.post('/', protect, ttsRateLimit, generateSpeech);

export default router;
