import Medicine from '../models/medicine.model.js';

/**
 * Business logic for inventory operations.
 */
const inventoryService = {
  async getAll() {
    return Medicine.find().sort({ name: 1 });
  },

  async getLowStock(threshold = 10) {
    return Medicine.find({ stock: { $lte: threshold } });
  },

  async updateStock(medicineId, newStock) {
    return Medicine.findByIdAndUpdate(medicineId, { stock: newStock }, { new: true });
  },
};

export default inventoryService;
