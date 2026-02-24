const RefillAlert = require('../models/refill.model');
const User = require('../models/user.model');
const Medicine = require('../models/medicine.model');
const logger = require('../utils/logger');

/**
 * Tool: check_refill_eligibility
 * Determines if a patient is eligible for a prescription refill.
 */
async function checkRefillEligibility({ patientName, medicineName }) {
  logger.info(`🔄 Checking refill eligibility: ${patientName} → ${medicineName}`);

  const user = await User.findOne({ name: new RegExp(patientName, 'i') });
  if (!user) {
    return { eligible: false, message: `Patient "${patientName}" not found in system.` };
  }

  const medicine = await Medicine.findOne({ name: new RegExp(medicineName, 'i') });
  if (!medicine) {
    return { eligible: false, message: `Medicine "${medicineName}" not found.` };
  }

  const alert = await RefillAlert.findOne({
    user: user._id,
    medicine: medicine._id,
    status: 'active',
  });

  if (!alert) {
    return { eligible: false, message: `No active refill alert found for ${patientName} / ${medicineName}.` };
  }

  const now = new Date();
  if (alert.estimatedDepletionDate && alert.estimatedDepletionDate > now) {
    const daysLeft = Math.ceil((alert.estimatedDepletionDate - now) / (1000 * 60 * 60 * 24));
    return { eligible: false, daysLeft, message: `Refill not yet due. ~${daysLeft} days of supply remaining.` };
  }

  return { eligible: true, message: `${patientName} is eligible for a refill of ${medicineName}.` };
}

module.exports = { checkRefillEligibility };
