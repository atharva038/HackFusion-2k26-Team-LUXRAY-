const Medicine = require('../models/medicine.model');
const logger = require('../utils/logger');

/**
 * Tool: check_inventory
 * Checks local pharmacy stock for a given medicine.
 */
async function checkInventory({ medicineName, dosage }) {
  logger.info(`🔎 Checking inventory for: ${medicineName} ${dosage || ''}`);

  const query = { name: new RegExp(medicineName, 'i') };
  if (dosage) query.dosage = dosage;

  const medicine = await Medicine.findOne(query);

  if (!medicine) {
    return { available: false, message: `${medicineName} not found in inventory.` };
  }

  const isLowStock = medicine.stock <= medicine.lowStockThreshold;

  return {
    available: medicine.stock > 0,
    name: medicine.name,
    dosage: medicine.dosage,
    unitType: medicine.unitType,
    stock: medicine.stock,
    prescriptionRequired: medicine.prescriptionRequired,
    lowStock: isLowStock,
    message: medicine.stock > 0
      ? `${medicine.stock} ${medicine.unitType}(s) of ${medicine.name} available.${isLowStock ? ' ⚠ Low stock warning.' : ''}`
      : `${medicine.name} is out of stock.`,
  };
}

module.exports = { checkInventory };
