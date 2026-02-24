/**
 * Seed script — populates MongoDB Atlas with initial pharmacy data.
 * Run: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Medicine from './models/medicine.model.js';
import Order from './models/order.model.js';
import RefillAlert from './models/refill.model.js';
import User from './models/user.model.js';
import Prescription from './models/prescription.model.js';
import InventoryLog from './models/inventoryLog.model.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear all collections
    await Promise.all([
      Medicine.deleteMany({}),
      Order.deleteMany({}),
      RefillAlert.deleteMany({}),
      User.deleteMany({}),
      Prescription.deleteMany({}),
      InventoryLog.deleteMany({}),
    ]);
    console.log('🗑  Cleared all collections');

    // ─── Users ──────────────────────────────────
    const users = await User.insertMany([
      { name: 'Michael T.', email: 'michael@example.com', phone: '+1-555-0101', role: 'customer' },
      { name: 'Sarah J.', email: 'sarah@example.com', phone: '+1-555-0102', role: 'customer' },
      { name: 'Robert W.', email: 'robert@example.com', phone: '+1-555-0103', role: 'customer' },
      { name: 'James Wilson', email: 'james@example.com', phone: '+1-555-0104', role: 'customer' },
      { name: 'Emma Thompson', email: 'emma@example.com', phone: '+1-555-0105', role: 'customer' },
      { name: 'William Davis', email: 'william@example.com', phone: '+1-555-0106', role: 'customer' },
      { name: 'Dr. Admin', email: 'admin@pharmacy.com', phone: '+1-555-0100', role: 'admin' },
      { name: 'Dr. Patel', email: 'patel@pharmacy.com', phone: '+1-555-0099', role: 'pharmacist' },
    ]);
    console.log(`👤 Inserted ${users.length} users`);

    // Helper to find user by name
    const findUser = (name) => users.find(u => u.name === name);

    // ─── Medicines ───────────────────────────────
    const medicines = await Medicine.insertMany([
      { name: 'Amlodipine 5mg', dosage: '5mg', unitType: 'tablet', stock: 20, prescriptionRequired: true, lowStockThreshold: 10, category: 'Cardiovascular' },
      { name: 'Lisinopril 10mg', dosage: '10mg', unitType: 'tablet', stock: 45, prescriptionRequired: true, lowStockThreshold: 15 },
      { name: 'Ibuprofen 400mg', dosage: '400mg', unitType: 'tablet', stock: 120, prescriptionRequired: false, lowStockThreshold: 20 },
      { name: 'Metformin 500mg', dosage: '500mg', unitType: 'tablet', stock: 5, prescriptionRequired: true, lowStockThreshold: 10 },
      { name: 'Atorvastatin 20mg', dosage: '20mg', unitType: 'tablet', stock: 35, prescriptionRequired: true, lowStockThreshold: 10 },
      { name: 'Levothyroxine 50mcg', dosage: '50mcg', unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 15 },
      { name: 'Oxycodone 10mg', dosage: '10mg', unitType: 'tablet', stock: 8, prescriptionRequired: true, lowStockThreshold: 5 },
      { name: 'Paracetamol 500mg', dosage: '500mg', unitType: 'strip', stock: 200, prescriptionRequired: false, lowStockThreshold: 30 },
      { name: 'Amoxicillin 250mg', dosage: '250mg', unitType: 'bottle', stock: 40, prescriptionRequired: true, lowStockThreshold: 10 },
      { name: 'Insulin Glargine', dosage: '100U/ml', unitType: 'injection', stock: 15, prescriptionRequired: true, lowStockThreshold: 5 },
    ]);
    console.log(`💊 Inserted ${medicines.length} medicines`);

    // Helper to find medicine by name
    const findMed = (name) => medicines.find(m => m.name === name);

    // ─── Prescriptions ──────────────────────────
    const prescriptions = await Prescription.insertMany([
      { user: findUser('Sarah J.')._id, medicine: findMed('Ibuprofen 400mg')._id, validUntil: new Date('2026-12-31'), approved: true },
      { user: findUser('James Wilson')._id, medicine: findMed('Atorvastatin 20mg')._id, validUntil: new Date('2026-06-30'), approved: true },
      { user: findUser('Emma Thompson')._id, medicine: findMed('Levothyroxine 50mcg')._id, validUntil: new Date('2026-09-15'), approved: true },
      { user: findUser('Michael T.')._id, medicine: findMed('Metformin 500mg')._id, validUntil: new Date('2026-08-01'), approved: true },
    ]);
    console.log(`📋 Inserted ${prescriptions.length} prescriptions`);

    // ─── Orders (with proper ObjectId refs) ─────
    const orders = await Order.insertMany([
      {
        user: findUser('Michael T.')._id,
        items: [{ medicine: findMed('Metformin 500mg')._id, name: 'Metformin 500mg', dosage: '500mg', quantity: 2 }],
        totalItems: 2,
        status: 'pending',
      },
      {
        user: findUser('Sarah J.')._id,
        items: [{ medicine: findMed('Ibuprofen 400mg')._id, name: 'Ibuprofen 400mg', dosage: '400mg', quantity: 1 }],
        totalItems: 1,
        status: 'approved',
        approvedBy: findUser('Dr. Patel')._id,
      },
      {
        user: findUser('Robert W.')._id,
        items: [{ medicine: findMed('Oxycodone 10mg')._id, name: 'Oxycodone 10mg', dosage: '10mg', quantity: 1 }],
        totalItems: 1,
        status: 'rejected',
        rejectionReason: 'Controlled substance — requires direct physician authorization.',
      },
    ]);
    console.log(`📦 Inserted ${orders.length} orders`);

    // ─── Refill Alerts ──────────────────────────
    const now = new Date();
    const refills = await RefillAlert.insertMany([
      {
        user: findUser('James Wilson')._id,
        medicine: findMed('Atorvastatin 20mg')._id,
        lastOrderDate: new Date(now - 28 * 24 * 60 * 60 * 1000),
        estimatedDepletionDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        user: findUser('Emma Thompson')._id,
        medicine: findMed('Levothyroxine 50mcg')._id,
        lastOrderDate: new Date(now - 25 * 24 * 60 * 60 * 1000),
        estimatedDepletionDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        user: findUser('William Davis')._id,
        medicine: findMed('Amlodipine 5mg')._id,
        lastOrderDate: new Date(now - 30 * 24 * 60 * 60 * 1000),
        estimatedDepletionDate: now,
        status: 'active',
      },
    ]);
    console.log(`🔄 Inserted ${refills.length} refill alerts`);

    // ─── Inventory Logs (for the approved order) ─
    await InventoryLog.create({
      medicine: findMed('Ibuprofen 400mg')._id,
      changeType: 'deduct',
      quantity: 1,
      order: orders[1]._id,
    });
    console.log('📊 Inserted 1 inventory log');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
