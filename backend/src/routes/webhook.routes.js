import express from 'express';
const router = express.Router();

/**
 * POST /api/webhook — External webhook endpoint
 * Can be used for pharmacy partner integrations, delivery status updates, etc.
 */
router.post('/', (req, res) => {
  console.log('📬 Webhook received:', req.body);
  res.json({ received: true });
});

export default router;
