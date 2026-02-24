/**
 * Seed script — populates MongoDB Atlas with comprehensive pharmacy data.
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

    // ─── Users ──────────────────────────────────────────────────
    const users = await User.insertMany([
      // Customers
      { name: 'Michael Torres',  email: 'michael@example.com',   phone: '+91-9876543210', role: 'customer', age: 42, gender: 'male' },
      { name: 'Sarah Jenkins',   email: 'sarah@example.com',     phone: '+91-9876543211', role: 'customer', age: 34, gender: 'female' },
      { name: 'Robert Walker',   email: 'robert@example.com',    phone: '+91-9876543212', role: 'customer', age: 55, gender: 'male' },
      { name: 'James Wilson',    email: 'james@example.com',     phone: '+91-9876543213', role: 'customer', age: 28, gender: 'male' },
      { name: 'Emma Thompson',   email: 'emma@example.com',      phone: '+91-9876543214', role: 'customer', age: 45, gender: 'female' },
      { name: 'William Davis',   email: 'william@example.com',   phone: '+91-9876543215', role: 'customer', age: 61, gender: 'male' },
      { name: 'Priya Sharma',    email: 'priya@example.com',     phone: '+91-9876543216', role: 'customer', age: 30, gender: 'female' },
      { name: 'Arun Mehta',      email: 'arun@example.com',      phone: '+91-9876543217', role: 'customer', age: 52, gender: 'male' },
      { name: 'Lisa Park',       email: 'lisa@example.com',      phone: '+91-9876543218', role: 'customer', age: 38, gender: 'female' },
      { name: 'David Chen',      email: 'david@example.com',     phone: '+91-9876543219', role: 'customer', age: 47, gender: 'male' },
      // Staff
      { name: 'Dr. Admin',       email: 'admin@pharmacy.com',    phone: '+91-9000000001', role: 'admin',      age: 50, gender: 'male' },
      { name: 'Dr. Neha Patel',  email: 'neha@pharmacy.com',     phone: '+91-9000000002', role: 'pharmacist', age: 35, gender: 'female' },
    ]);
    console.log(`👤 Inserted ${users.length} users`);

    const u = (name) => users.find(x => x.name === name);

    // ─── Medicines (30+ diverse entries) ────────────────────────
    const medicines = await Medicine.insertMany([
      // ── Cardiovascular ──
      { name: 'Amlodipine 5mg',        pzn: 'PZN-10001', price: 85,   unitType: 'tablet',    stock: 200,  prescriptionRequired: true,  lowStockThreshold: 30,  description: 'Calcium channel blocker for hypertension.' },
      { name: 'Lisinopril 10mg',       pzn: 'PZN-10002', price: 120,  unitType: 'tablet',    stock: 45,   prescriptionRequired: true,  lowStockThreshold: 15,  description: 'ACE inhibitor for high blood pressure and heart failure.' },
      { name: 'Atorvastatin 20mg',     pzn: 'PZN-10003', price: 150,  unitType: 'tablet',    stock: 350,  prescriptionRequired: true,  lowStockThreshold: 50,  description: 'Statin for lowering cholesterol.' },
      { name: 'Clopidogrel 75mg',      pzn: 'PZN-10004', price: 95,   unitType: 'tablet',    stock: 180,  prescriptionRequired: true,  lowStockThreshold: 25,  description: 'Anti-platelet to prevent blood clots.' },
      { name: 'Losartan 50mg',         pzn: 'PZN-10005', price: 110,  unitType: 'tablet',    stock: 90,   prescriptionRequired: true,  lowStockThreshold: 20,  description: 'ARB medication for hypertension.' },

      // ── Diabetes ──
      { name: 'Metformin 500mg',       pzn: 'PZN-20001', price: 45,   unitType: 'tablet',    stock: 8,    prescriptionRequired: true,  lowStockThreshold: 50,  description: 'First-line medication for type 2 diabetes.' },
      { name: 'Glimepiride 2mg',       pzn: 'PZN-20002', price: 65,   unitType: 'tablet',    stock: 120,  prescriptionRequired: true,  lowStockThreshold: 20,  description: 'Sulfonylurea for diabetes management.' },
      { name: 'Insulin Glargine 100U', pzn: 'PZN-20003', price: 850,  unitType: 'injection', stock: 15,   prescriptionRequired: true,  lowStockThreshold: 5,   description: 'Long-acting insulin for type 1 & 2 diabetes.' },
      { name: 'Sitagliptin 100mg',     pzn: 'PZN-20004', price: 320,  unitType: 'tablet',    stock: 60,   prescriptionRequired: true,  lowStockThreshold: 15,  description: 'DPP-4 inhibitor for blood sugar control.' },

      // ── Pain & Inflammation ──
      { name: 'Ibuprofen 400mg',       pzn: 'PZN-30001', price: 25,   unitType: 'strip',     stock: 500,  prescriptionRequired: false, lowStockThreshold: 80,  description: 'NSAID for pain, fever and inflammation.' },
      { name: 'Paracetamol 500mg',     pzn: 'PZN-30002', price: 15,   unitType: 'strip',     stock: 800,  prescriptionRequired: false, lowStockThreshold: 100, description: 'Analgesic and antipyretic.' },
      { name: 'Diclofenac 50mg',       pzn: 'PZN-30003', price: 30,   unitType: 'tablet',    stock: 300,  prescriptionRequired: false, lowStockThreshold: 40,  description: 'NSAID for acute pain and arthritis.' },
      { name: 'Tramadol 50mg',         pzn: 'PZN-30004', price: 180,  unitType: 'tablet',    stock: 25,   prescriptionRequired: true,  lowStockThreshold: 10,  description: 'Opioid analgesic for moderate to severe pain.' },

      // ── Antibiotics ──
      { name: 'Amoxicillin 250mg',     pzn: 'PZN-40001', price: 55,   unitType: 'bottle',    stock: 140,  prescriptionRequired: true,  lowStockThreshold: 20,  description: 'Penicillin antibiotic for bacterial infections.' },
      { name: 'Azithromycin 500mg',    pzn: 'PZN-40002', price: 90,   unitType: 'strip',     stock: 100,  prescriptionRequired: true,  lowStockThreshold: 15,  description: 'Macrolide antibiotic (Z-Pack).' },
      { name: 'Ciprofloxacin 500mg',   pzn: 'PZN-40003', price: 75,   unitType: 'tablet',    stock: 85,   prescriptionRequired: true,  lowStockThreshold: 15,  description: 'Fluoroquinolone for UTIs and respiratory infections.' },
      { name: 'Cephalexin 250mg',      pzn: 'PZN-40004', price: 60,   unitType: 'bottle',    stock: 70,   prescriptionRequired: true,  lowStockThreshold: 10,  description: 'Cephalosporin antibiotic for skin/soft tissue.' },
      { name: 'Metronidazole 400mg',   pzn: 'PZN-40005', price: 40,   unitType: 'tablet',    stock: 200,  prescriptionRequired: true,  lowStockThreshold: 30,  description: 'Antibiotic and antiprotozoal.' },

      // ── Gastrointestinal ──
      { name: 'Omeprazole 20mg',       pzn: 'PZN-50001', price: 35,   unitType: 'strip',     stock: 400,  prescriptionRequired: false, lowStockThreshold: 60,  description: 'Proton pump inhibitor for acid reflux.' },
      { name: 'Pantoprazole 40mg',     pzn: 'PZN-50002', price: 50,   unitType: 'tablet',    stock: 250,  prescriptionRequired: false, lowStockThreshold: 40,  description: 'PPI for GERD and ulcers.' },
      { name: 'Domperidone 10mg',      pzn: 'PZN-50003', price: 28,   unitType: 'tablet',    stock: 350,  prescriptionRequired: false, lowStockThreshold: 50,  description: 'Anti-emetic for nausea and vomiting.' },
      { name: 'ORS Sachets',           pzn: 'PZN-50004', price: 10,   unitType: 'strip',     stock: 600,  prescriptionRequired: false, lowStockThreshold: 100, description: 'Oral rehydration salts for dehydration.' },

      // ── Respiratory ──
      { name: 'Salbutamol Inhaler',    pzn: 'PZN-60001', price: 130,  unitType: 'bottle',    stock: 40,   prescriptionRequired: true,  lowStockThreshold: 10,  description: 'Bronchodilator inhaler for asthma.' },
      { name: 'Montelukast 10mg',      pzn: 'PZN-60002', price: 95,   unitType: 'tablet',    stock: 150,  prescriptionRequired: true,  lowStockThreshold: 20,  description: 'Leukotriene receptor antagonist for asthma.' },
      { name: 'Cetirizine 10mg',       pzn: 'PZN-60003', price: 18,   unitType: 'strip',     stock: 700,  prescriptionRequired: false, lowStockThreshold: 100, description: 'Antihistamine for allergies.' },

      // ── Thyroid ──
      { name: 'Levothyroxine 50mcg',   pzn: 'PZN-70001', price: 70,   unitType: 'tablet',    stock: 180,  prescriptionRequired: true,  lowStockThreshold: 25,  description: 'Synthetic thyroid hormone.' },

      // ── Mental Health ──
      { name: 'Sertraline 50mg',       pzn: 'PZN-80001', price: 140,  unitType: 'tablet',    stock: 90,   prescriptionRequired: true,  lowStockThreshold: 15,  description: 'SSRI antidepressant.' },
      { name: 'Alprazolam 0.5mg',      pzn: 'PZN-80002', price: 110,  unitType: 'tablet',    stock: 30,   prescriptionRequired: true,  lowStockThreshold: 10,  description: 'Benzodiazepine for anxiety (controlled).' },

      // ── Vitamins & Supplements ──
      { name: 'Vitamin D3 60K IU',     pzn: 'PZN-90001', price: 120,  unitType: 'strip',     stock: 250,  prescriptionRequired: false, lowStockThreshold: 40,  description: 'Weekly cholecalciferol supplement.' },
      { name: 'Calcium + D3 Tablets',  pzn: 'PZN-90002', price: 95,   unitType: 'tablet',    stock: 300,  prescriptionRequired: false, lowStockThreshold: 50,  description: 'Bone health supplement.' },
      { name: 'Iron + Folic Acid',     pzn: 'PZN-90003', price: 40,   unitType: 'tablet',    stock: 400,  prescriptionRequired: false, lowStockThreshold: 60,  description: 'For iron deficiency anaemia.' },
      { name: 'Multivitamin Syrup',    pzn: 'PZN-90004', price: 85,   unitType: 'bottle',    stock: 150,  prescriptionRequired: false, lowStockThreshold: 25,  description: 'Daily multivitamin liquid supplement.' },

      // ── Dermatology ──
      { name: 'Clobetasol Cream',      pzn: 'PZN-A0001', price: 160,  unitType: 'bottle',    stock: 55,   prescriptionRequired: true,  lowStockThreshold: 10,  description: 'Topical corticosteroid for severe eczema.' },
      { name: 'Clotrimazole Cream',    pzn: 'PZN-A0002', price: 45,   unitType: 'bottle',    stock: 200,  prescriptionRequired: false, lowStockThreshold: 30,  description: 'Antifungal cream for skin infections.' },
    ]);
    console.log(`💊 Inserted ${medicines.length} medicines`);

    const m = (name) => medicines.find(x => x.name === name);

    // ─── Prescriptions ──────────────────────────────────────────
    const prescriptions = await Prescription.insertMany([
      { user: u('Michael Torres')._id,  medicine: m('Metformin 500mg')._id,       validUntil: new Date('2026-08-01'), approved: true },
      { user: u('Sarah Jenkins')._id,   medicine: m('Amoxicillin 250mg')._id,     validUntil: new Date('2026-04-15'), approved: true },
      { user: u('James Wilson')._id,    medicine: m('Atorvastatin 20mg')._id,     validUntil: new Date('2026-06-30'), approved: true },
      { user: u('Emma Thompson')._id,   medicine: m('Levothyroxine 50mcg')._id,   validUntil: new Date('2026-09-15'), approved: true },
      { user: u('Robert Walker')._id,   medicine: m('Amlodipine 5mg')._id,        validUntil: new Date('2026-12-31'), approved: true },
      { user: u('William Davis')._id,   medicine: m('Losartan 50mg')._id,         validUntil: new Date('2026-11-01'), approved: true },
      { user: u('Priya Sharma')._id,    medicine: m('Sertraline 50mg')._id,       validUntil: new Date('2026-07-20'), approved: true },
      { user: u('Arun Mehta')._id,      medicine: m('Insulin Glargine 100U')._id, validUntil: new Date('2026-10-10'), approved: true },
      { user: u('Lisa Park')._id,       medicine: m('Salbutamol Inhaler')._id,    validUntil: new Date('2026-05-30'), approved: true },
      // Pending / not-yet-approved
      { user: u('David Chen')._id,      medicine: m('Alprazolam 0.5mg')._id,      validUntil: new Date('2026-12-01'), approved: false },
      { user: u('Priya Sharma')._id,    medicine: m('Tramadol 50mg')._id,         validUntil: new Date('2026-09-01'), approved: false },
    ]);
    console.log(`📋 Inserted ${prescriptions.length} prescriptions`);

    // ─── Orders (each status type) ──────────────────────────────
    const now = new Date();
    const orders = await Order.insertMany([
      // 1. Pending order
      {
        user: u('Michael Torres')._id, age: 42,
        items: [{ medicine: m('Metformin 500mg')._id, dosage: '500mg', quantity: 2 }],
        totalItems: 2, totalAmount: 90, status: 'pending', prescription: true,
      },
      // 2. Approved order
      {
        user: u('Sarah Jenkins')._id, age: 34,
        items: [{ medicine: m('Amoxicillin 250mg')._id, dosage: '250mg', quantity: 1 }],
        totalItems: 1, totalAmount: 55, status: 'approved', prescription: true,
        approvedBy: u('Dr. Neha Patel')._id,
      },
      // 3. Rejected order
      {
        user: u('David Chen')._id, age: 47,
        items: [{ medicine: m('Alprazolam 0.5mg')._id, dosage: '0.5mg', quantity: 3 }],
        totalItems: 3, totalAmount: 330, status: 'rejected', prescription: true,
        rejectionReason: 'Controlled substance — requires direct physician authorization.',
      },
      // 4. Awaiting prescription
      {
        user: u('Robert Walker')._id, age: 55,
        items: [{ medicine: m('Tramadol 50mg')._id, dosage: '50mg', quantity: 1 }],
        totalItems: 1, totalAmount: 180, status: 'awaiting_prescription', prescription: true,
      },
      // 5. Dispatched order
      {
        user: u('James Wilson')._id, age: 28,
        items: [{ medicine: m('Atorvastatin 20mg')._id, dosage: '20mg', quantity: 3 }],
        totalItems: 3, totalAmount: 450, status: 'dispatched', prescription: true,
        approvedBy: u('Dr. Neha Patel')._id,
      },
      // 6. OTC (no prescription) — approved
      {
        user: u('Emma Thompson')._id, age: 45,
        items: [
          { medicine: m('Paracetamol 500mg')._id, dosage: '500mg', quantity: 2 },
          { medicine: m('Cetirizine 10mg')._id,   dosage: '10mg',  quantity: 1 },
        ],
        totalItems: 3, totalAmount: 48, status: 'approved', prescription: false,
        approvedBy: u('Dr. Neha Patel')._id,
      },
      // 7. Multi-item pending
      {
        user: u('Priya Sharma')._id, age: 30,
        items: [
          { medicine: m('Sertraline 50mg')._id,    dosage: '50mg',  quantity: 1 },
          { medicine: m('Omeprazole 20mg')._id,    dosage: '20mg',  quantity: 1 },
        ],
        totalItems: 2, totalAmount: 175, status: 'pending', prescription: true,
      },
      // 8. Dispatched OTC
      {
        user: u('Arun Mehta')._id, age: 52,
        items: [
          { medicine: m('Vitamin D3 60K IU')._id,    dosage: '60K IU', quantity: 4 },
          { medicine: m('Iron + Folic Acid')._id,    dosage: '',       quantity: 2 },
        ],
        totalItems: 6, totalAmount: 560, status: 'dispatched', prescription: false,
        approvedBy: u('Dr. Admin')._id,
      },
      // 9. Awaiting prescription with proof
      {
        user: u('Lisa Park')._id, age: 38,
        items: [{ medicine: m('Salbutamol Inhaler')._id, dosage: '100mcg', quantity: 1 }],
        totalItems: 1, totalAmount: 130, status: 'awaiting_prescription', prescription: true,
        prescriptionProof: 'https://placehold.co/600x400?text=Prescription+Scan',
      },
      // 10. Rejected — invalid quantity
      {
        user: u('William Davis')._id, age: 61,
        items: [{ medicine: m('Insulin Glargine 100U')._id, dosage: '100U/ml', quantity: 10 }],
        totalItems: 10, totalAmount: 8500, status: 'rejected', prescription: true,
        rejectionReason: 'Excessive quantity requested — maximum 3 units per order for insulin.',
      },
    ]);
    console.log(`📦 Inserted ${orders.length} orders`);

    // ─── Refill Alerts (each status type) ───────────────────────
    const refills = await RefillAlert.insertMany([
      // Active alerts
      { user: u('James Wilson')._id,    medicine: m('Atorvastatin 20mg')._id,    lastOrderDate: new Date(now - 28*86400000), estimatedDepletionDate: new Date(now.getTime() + 2*86400000),  status: 'active' },
      { user: u('Emma Thompson')._id,   medicine: m('Levothyroxine 50mcg')._id,  lastOrderDate: new Date(now - 25*86400000), estimatedDepletionDate: new Date(now.getTime() + 5*86400000),  status: 'active' },
      { user: u('William Davis')._id,   medicine: m('Losartan 50mg')._id,        lastOrderDate: new Date(now - 30*86400000), estimatedDepletionDate: now,                                   status: 'active' },
      { user: u('Michael Torres')._id,  medicine: m('Metformin 500mg')._id,      lastOrderDate: new Date(now - 20*86400000), estimatedDepletionDate: new Date(now.getTime() + 8*86400000),  status: 'active' },
      { user: u('Priya Sharma')._id,    medicine: m('Sertraline 50mg')._id,      lastOrderDate: new Date(now - 15*86400000), estimatedDepletionDate: new Date(now.getTime() + 12*86400000), status: 'active' },
      // Notified
      { user: u('Arun Mehta')._id,      medicine: m('Insulin Glargine 100U')._id, lastOrderDate: new Date(now - 22*86400000), estimatedDepletionDate: new Date(now.getTime() - 1*86400000), status: 'notified' },
      { user: u('Robert Walker')._id,   medicine: m('Amlodipine 5mg')._id,        lastOrderDate: new Date(now - 27*86400000), estimatedDepletionDate: new Date(now.getTime() + 1*86400000), status: 'notified' },
      // Completed
      { user: u('Sarah Jenkins')._id,   medicine: m('Amoxicillin 250mg')._id,     lastOrderDate: new Date(now - 40*86400000), estimatedDepletionDate: new Date(now - 10*86400000),          status: 'completed' },
      { user: u('Lisa Park')._id,       medicine: m('Salbutamol Inhaler')._id,    lastOrderDate: new Date(now - 35*86400000), estimatedDepletionDate: new Date(now - 5*86400000),           status: 'completed' },
    ]);
    console.log(`🔄 Inserted ${refills.length} refill alerts`);

    // ─── Inventory Logs (diverse change types) ──────────────────
    const logs = await InventoryLog.insertMany([
      // Deductions from dispatched orders
      { medicine: m('Atorvastatin 20mg')._id,   changeType: 'deduct',  quantity: 3,   order: orders[4]._id },
      { medicine: m('Amoxicillin 250mg')._id,   changeType: 'deduct',  quantity: 1,   order: orders[1]._id },
      { medicine: m('Paracetamol 500mg')._id,   changeType: 'deduct',  quantity: 2,   order: orders[5]._id },
      { medicine: m('Cetirizine 10mg')._id,     changeType: 'deduct',  quantity: 1,   order: orders[5]._id },
      { medicine: m('Vitamin D3 60K IU')._id,   changeType: 'deduct',  quantity: 4,   order: orders[7]._id },
      { medicine: m('Iron + Folic Acid')._id,   changeType: 'deduct',  quantity: 2,   order: orders[7]._id },
      // Restocks
      { medicine: m('Metformin 500mg')._id,     changeType: 'restock', quantity: 500 },
      { medicine: m('Ibuprofen 400mg')._id,     changeType: 'restock', quantity: 200 },
      { medicine: m('ORS Sachets')._id,         changeType: 'restock', quantity: 300 },
      { medicine: m('Insulin Glargine 100U')._id, changeType: 'restock', quantity: 20 },
    ]);
    console.log(`📊 Inserted ${logs.length} inventory logs`);

    // ─── Summary ────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────');
    console.log('🎉 Database seeded successfully!');
    console.log(`   👤 ${users.length} Users (${users.filter(x=>x.role==='customer').length} customers, ${users.filter(x=>x.role!=='customer').length} staff)`);
    console.log(`   💊 ${medicines.length} Medicines`);
    console.log(`   📋 ${prescriptions.length} Prescriptions`);
    console.log(`   📦 ${orders.length} Orders (all 5 status types covered)`);
    console.log(`   🔄 ${refills.length} Refill Alerts (active, notified, completed)`);
    console.log(`   📊 ${logs.length} Inventory Logs (deductions + restocks)`);
    console.log('────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
