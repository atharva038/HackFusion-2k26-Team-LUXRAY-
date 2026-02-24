import cron from 'node-cron';
import RefillAlert from '../models/refill.model.js';
import Medicine from '../models/medicine.model.js';
import logger from '../utils/logger.js';

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

      // Check for low-stock medicines and log a warning
      const lowStock = await Medicine.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
      if (lowStock.length > 0) {
        logger.warn(`⚠ ${lowStock.length} medicine(s) below low-stock threshold: ${lowStock.map(m => m.name).join(', ')}`);
      }
    } catch (err) {
      logger.error('Scheduler error:', err);
    }
  });

  logger.info('🕐 Refill scheduler initialized (daily at midnight).');
}

export { initScheduler };
