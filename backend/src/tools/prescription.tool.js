const Medicine = require('../models/medicine.model');
const Prescription = require('../models/prescription.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Tool: validate_prescription
 * Checks if a medicine requires a prescription and whether the patient has a valid one on file.
 */
async function validatePrescription({ medicineName, patientId }) {
  logger.info(`📋 Validating prescription for: ${medicineName}`);

  const medicine = await Medicine.findOne({ name: new RegExp(medicineName, 'i') });

  if (!medicine) {
    return { valid: false, message: `Medicine "${medicineName}" not found.` };
  }

  if (!medicine.prescriptionRequired) {
    return {
      valid: true,
      required: false,
      message: `${medicine.name} is available over the counter. No prescription needed.`,
    };
  }

  // Check if patient has a valid, approved prescription on file
  if (patientId) {
    const prescription = await Prescription.findOne({
      user: patientId,
      medicine: medicine._id,
      approved: true,
      validUntil: { $gte: new Date() },
    });

    if (prescription) {
      return {
        valid: true,
        required: true,
        message: `Valid prescription found for ${medicine.name}. Expires: ${prescription.validUntil.toLocaleDateString()}.`,
      };
    }
  }

  return {
    valid: false,
    required: true,
    message: `${medicine.name} requires a valid prescription. Please provide your prescription details or visit a physician.`,
  };
}

module.exports = { validatePrescription };
