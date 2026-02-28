import express from "express";
import { downloadInvoice } from "../controllers/invoice.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/** GET /api/invoice/:invoiceId — Stream a PDF invoice to the browser */
router.get("/:invoiceId", protect, downloadInvoice);

export default router;
