import express from "express";
import { handleRazorpayWebhook, checkPaymentStatus } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/webhook", handleRazorpayWebhook);
router.get("/status/:orderId", checkPaymentStatus);

export default router;
