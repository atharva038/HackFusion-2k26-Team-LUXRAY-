import express from 'express';
const router = express.Router();
import * as imageExtractor from '../controllers/prescription.controller.js'
import * as testMailer from "../controllers/notification.controller.js"
import { upload } from '../middleware/multer.middleware.js';


router.post('/upload', upload.single('prescriptions'), imageExtractor.handlePrescriptionUpload);
router.post('/mail', testMailer.testEmail); 

export default router;