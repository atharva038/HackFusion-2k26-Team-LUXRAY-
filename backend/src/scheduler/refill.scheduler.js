import cron from 'node-cron';
import RefillAlert from '../models/refill.model.js';
import Medicine from '../models/medicine.model.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';
import { sendLowStockAlert } from '../agent/service/email.service.agent.js';

/**
 * Find all low-stock medicines and email every pharmacist/admin.
 * Exported so it can be called directly (manual trigger or tests).
 */
export async function checkAndAlertLowStock() {
  const lowStock = await Medicine.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).lean();

  if (lowStock.length === 0) {
    logger.info('✅ All medicines are above low-stock threshold.');
    return { alerted: 0, recipients: 0 };
  }

  logger.warn(`⚠ ${lowStock.length} medicine(s) below threshold: ${lowStock.map(m => m.name).join(', ')}`);

  const pharmacists = await User.find({ role: { $in: ['admin', 'pharmacist'] } }).select('email').lean();
  const emails = pharmacists.map(u => u.email).filter(Boolean);

  if (emails.length === 0) {
    logger.warn('No pharmacist/admin emails found — skipping alert email.');
    return { alerted: lowStock.length, recipients: 0 };
  }

  const result = await sendLowStockAlert(emails, lowStock);
  if (result.success) {
    logger.info(`📧 Low-stock alert sent to ${emails.length} recipient(s).`);
  } else {
    logger.error(`Failed to send low-stock alert: ${result.error}`);
  }

  return { alerted: lowStock.length, recipients: emails.length, emailResult: result };
}

/**
 * Initialize the refill scheduler.
 * Runs daily to check for medicines approaching depletion and create/update alerts.
 */
function initScheduler() {
  // Run every day at 00:00
  cron.schedule('0 0 * * *', async () => {
    logger.info('⏰ Running daily refill check...');
    try {
      // Mark alerts whose estimatedDepletionDate has passed as 'notified'
      const result = await RefillAlert.updateMany(
        { status: 'active', estimatedDepletionDate: { $lte: new Date() } },
        { status: 'notified' }
      );
      logger.info(`📬 Notified ${result.modifiedCount} depleted refill alerts.`);

      // Check low-stock and email pharmacists
      await checkAndAlertLowStock();
    } catch (err) {
      logger.error('Scheduler error:', err);
    }
  });

  logger.info('🕐 Refill scheduler initialized (daily at midnight).');
}

export { initScheduler };
