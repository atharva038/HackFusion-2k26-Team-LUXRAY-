const logger = require('../utils/logger');

/**
 * Tool: check_warehouse
 * Checks external warehouse for availability when local stock is insufficient.
 */
async function checkWarehouse({ medicineName }) {
  logger.info(`🏭 Checking warehouse for: ${medicineName}`);

  // TODO: Replace with actual warehouse API integration
  // Simulated response
  return {
    available: true,
    estimatedDelivery: '2-3 business days',
    message: `${medicineName} is available from the central warehouse. Estimated delivery: 2-3 business days.`,
  };
}

module.exports = { checkWarehouse };
