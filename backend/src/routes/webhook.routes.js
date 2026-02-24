const express = require('express');
const router = express.Router();

/**
 * POST /api/webhook — External webhook endpoint
 * Can be used for pharmacy partner integrations, delivery status updates, etc.
 */
router.post('/', (req, res) => {
  console.log('📬 Webhook received:', req.body);
  res.json({ received: true });
});

module.exports = router;
