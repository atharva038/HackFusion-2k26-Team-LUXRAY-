import express from 'express';
const router = express.Router();
import * as imageExtractor from '../controllers/prescription.controller.js';
import * as notifyCtrl from "../controllers/notification.controller.js";
import { upload } from '../middleware/multer.middleware.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

router.post('/upload', protect, upload.single('prescriptions'), imageExtractor.handlePrescriptionUpload);
router.delete('/:entryId', protect, imageExtractor.deletePrescription);

// ── Notification test endpoints (admin/pharmacist only) ─────────────────────
// POST /api/prescription/mail       → AI dose reminder (specify testTime)
router.post('/mail', protect, restrictTo('admin', 'pharmacist'), notifyCtrl.testEmail);

// POST /api/prescription/testMail   → AI refill check (task: 'dose' | 'refill')
router.post('/testMail', protect, restrictTo('admin', 'pharmacist'), notifyCtrl.testAgentSystem);

// POST /api/prescription/triggerLowStock → Direct DB low-stock alert to pharmacists/admins
router.post('/triggerLowStock', protect, restrictTo('admin', 'pharmacist'), notifyCtrl.triggerLowStockAlert);

export default router;