const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

/** POST /api/chat — Send a message to the AI pharmacist */
router.post('/', chatController.handleMessage);

/** GET /api/chat/history — Retrieve chat history */
router.get('/history', chatController.getHistory);

module.exports = router;
