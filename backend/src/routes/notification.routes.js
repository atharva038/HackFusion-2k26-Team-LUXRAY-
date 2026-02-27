import express from 'express';
const router = express.Router();
import * as imageExtractor from '../controllers/prescription.controller.js'
import * as testMailer from "../controllers/notification.controller.js"
import { upload } from '../middleware/multer.middleware.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { testAgentSystem } from '../controllers/notification.controller.js';


router.post('/upload', protect, upload.single('prescriptions'), imageExtractor.handlePrescriptionUpload);
router.delete('/:entryId', protect, imageExtractor.deletePrescription);
// /mail is an admin-only test endpoint — requires auth and admin role
router.post('/mail', protect, restrictTo('admin', 'pharmacist'), testMailer.testEmail);
router.post('/testMail', testAgentSystem);

export default router;