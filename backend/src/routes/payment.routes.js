import express from "express";
import { handleRazorpayWebhook, checkPaymentStatus, verifyPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/webhook", handleRazorpayWebhook);
router.post("/verify", verifyPayment);
router.get("/status/:orderId", checkPaymentStatus);

export default router;
