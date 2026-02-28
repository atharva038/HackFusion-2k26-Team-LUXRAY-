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
      InventoryLog.deleteMany({}),
    ]);
    console.log('🗑  Cleared all collections');

    // ─── Users ──────────────────────────────────────────────────
    const users = await User.create([
      // Customers (password: password123)
      { name: 'Michael Torres',  email: 'michael@example.com',   password: 'password123', phone: '+91-9876543210', role: 'customer', age: 42, gender: 'male' },
      { name: 'Sarah Jenkins',   email: 'sarah@example.com',     password: 'password123', phone: '+91-9876543211', role: 'customer', age: 34, gender: 'female' },
      { name: 'Robert Walker',   email: 'robert@example.com',    password: 'password123', phone: '+91-9876543212', role: 'customer', age: 55, gender: 'male' },
      { name: 'James Wilson',    email: 'james@example.com',     password: 'password123', phone: '+91-9876543213', role: 'customer', age: 28, gender: 'male' },
      { name: 'Emma Thompson',   email: 'emma@example.com',      password: 'password123', phone: '+91-9876543214', role: 'customer', age: 45, gender: 'female' },
      { name: 'William Davis',   email: 'william@example.com',   password: 'password123', phone: '+91-9876543215', role: 'customer', age: 61, gender: 'male' },
      { name: 'Priya Sharma',    email: 'priya@example.com',     password: 'password123', phone: '+91-9876543216', role: 'customer', age: 30, gender: 'female' },
      { name: 'Arun Mehta',      email: 'arun@example.com',      password: 'password123', phone: '+91-9876543217', role: 'customer', age: 52, gender: 'male' },
      { name: 'Lisa Park',       email: 'lisa@example.com',      password: 'password123', phone: '+91-9876543218', role: 'customer', age: 38, gender: 'female' },
      { name: 'David Chen',      email: 'david@example.com',     password: 'password123', phone: '+91-9876543219', role: 'customer', age: 47, gender: 'male' },
      // Staff (password: adminpass123)
      { name: 'Dr. Admin',       email: 'admin@pharmacy.com',    password: 'adminpass123', phone: '+91-9000000001', role: 'admin',      age: 50, gender: 'male' },
      { name: 'Dr. Neha Patel',  email: 'neha@pharmacy.com',     password: 'adminpass123', phone: '+91-9000000002', role: 'pharmacist', age: 35, gender: 'female' },
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
      // ── Additional 150 Medicines ──
      { name: 'Rosuvastatin 10mg', pzn: 'PZN-B0001', price: 180, unitType: 'tablet', stock: 300, prescriptionRequired: true, lowStockThreshold: 30, description: 'Lowers cholesterol' },
      { name: 'Warfarin 5mg', pzn: 'PZN-B0002', price: 120, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Blood thinner' },
      { name: 'Enalapril 10mg', pzn: 'PZN-B0003', price: 85, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'ACE inhibitor' },
      { name: 'Valsartan 80mg', pzn: 'PZN-B0004', price: 140, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'ARB for blood pressure' },
      { name: 'Metoprolol 50mg', pzn: 'PZN-B0005', price: 90, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Beta blocker' },
      { name: 'Carvedilol 6.25mg', pzn: 'PZN-B0006', price: 110, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Heart failure treatment' },
      { name: 'Spironolactone 25mg', pzn: 'PZN-B0007', price: 70, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Potassium-sparing diuretic' },
      { name: 'Furosemide 40mg', pzn: 'PZN-B0008', price: 50, unitType: 'tablet', stock: 300, prescriptionRequired: true, lowStockThreshold: 30, description: 'Diuretic for fluid retention' },
      { name: 'Digoxin 0.125mg', pzn: 'PZN-B0009', price: 160, unitType: 'tablet', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Heart rhythm medication' },
      { name: 'Aspirin 81mg', pzn: 'PZN-B0010', price: 25, unitType: 'strip', stock: 800, prescriptionRequired: false, lowStockThreshold: 30, description: 'Daily low dose aspirin' },
      { name: 'Empagliflozin 10mg', pzn: 'PZN-C0001', price: 450, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'SGLT2 inhibitor for diabetes' },
      { name: 'Dapagliflozin 10mg', pzn: 'PZN-C0002', price: 420, unitType: 'tablet', stock: 130, prescriptionRequired: true, lowStockThreshold: 30, description: 'Diabetes control' },
      { name: 'Glipizide 5mg', pzn: 'PZN-C0003', price: 60, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Sulfonylurea for diabetes' },
      { name: 'Pioglitazone 15mg', pzn: 'PZN-C0004', price: 110, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Thiazolidinedione for diabetes' },
      { name: 'Liraglutide 1.2mg', pzn: 'PZN-C0005', price: 2500, unitType: 'injection', stock: 10, prescriptionRequired: true, lowStockThreshold: 30, description: 'GLP-1 agonist for diabetes/weight' },
      { name: 'Semaglutide 0.5mg', pzn: 'PZN-C0006', price: 3000, unitType: 'injection', stock: 8, prescriptionRequired: true, lowStockThreshold: 30, description: 'Ozempic - diabetes management' },
      { name: 'Liothyronine 25mcg', pzn: 'PZN-C0007', price: 150, unitType: 'tablet', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'T3 thyroid hormone' },
      { name: 'Methimazole 5mg', pzn: 'PZN-C0008', price: 90, unitType: 'tablet', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antithyroid medication' },
      { name: 'Testosterone Gel 1%', pzn: 'PZN-C0009', price: 800, unitType: 'tube', stock: 20, prescriptionRequired: true, lowStockThreshold: 30, description: 'Hormone replacement' },
      { name: 'Estradiol 1mg', pzn: 'PZN-C0010', price: 200, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Estrogen therapy' },
      { name: 'Gabapentin 300mg', pzn: 'PZN-D0001', price: 150, unitType: 'tablet', stock: 300, prescriptionRequired: true, lowStockThreshold: 30, description: 'Nerve pain medication' },
      { name: 'Pregabalin 75mg', pzn: 'PZN-D0002', price: 180, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Nerve pain and anxiety' },
      { name: 'Topiramate 25mg', pzn: 'PZN-D0003', price: 120, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Migraine prevention' },
      { name: 'Sumatriptan 50mg', pzn: 'PZN-D0004', price: 250, unitType: 'tablet', stock: 50, prescriptionRequired: true, lowStockThreshold: 30, description: 'Acute migraine treatment' },
      { name: 'Duloxetine 30mg', pzn: 'PZN-D0005', price: 190, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'SNRI for depression and pain' },
      { name: 'Amitriptyline 10mg', pzn: 'PZN-D0006', price: 60, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Tricyclic for sleep and nerve pain' },
      { name: 'Naproxen 500mg', pzn: 'PZN-D0007', price: 80, unitType: 'strip', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'NSAID pain reliever' },
      { name: 'Celecoxib 200mg', pzn: 'PZN-D0008', price: 220, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'COX-2 inhibitor for arthritis' },
      { name: 'Meloxicam 15mg', pzn: 'PZN-D0009', price: 95, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'NSAID for osteoarthritis' },
      { name: 'Acetaminophen 500mg', pzn: 'PZN-D0010', price: 30, unitType: 'strip', stock: 1000, prescriptionRequired: false, lowStockThreshold: 30, description: 'Pain reliever and fever reducer' },
      { name: 'Budesonide Inhaler', pzn: 'PZN-E0001', price: 350, unitType: 'bottle', stock: 40, prescriptionRequired: true, lowStockThreshold: 30, description: 'Steroid inhaler for asthma' },
      { name: 'Fluticasone Nasal Spray', pzn: 'PZN-E0002', price: 280, unitType: 'bottle', stock: 60, prescriptionRequired: false, lowStockThreshold: 30, description: 'Allergy nasal relief' },
      { name: 'Loratadine 10mg', pzn: 'PZN-E0003', price: 40, unitType: 'strip', stock: 500, prescriptionRequired: false, lowStockThreshold: 30, description: 'Non-drowsy antihistamine' },
      { name: 'Fexofenadine 120mg', pzn: 'PZN-E0004', price: 65, unitType: 'strip', stock: 300, prescriptionRequired: false, lowStockThreshold: 30, description: 'Allegra generic for allergies' },
      { name: 'Levocetirizine 5mg', pzn: 'PZN-E0005', price: 55, unitType: 'strip', stock: 350, prescriptionRequired: false, lowStockThreshold: 30, description: 'Xyzal generic for allergies' },
      { name: 'Diphenhydramine 25mg', pzn: 'PZN-E0006', price: 35, unitType: 'strip', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'Benadryl generic for allergy/sleep' },
      { name: 'Guaifenesin 400mg', pzn: 'PZN-E0007', price: 60, unitType: 'strip', stock: 250, prescriptionRequired: false, lowStockThreshold: 30, description: 'Expectorant for chest congestion' },
      { name: 'Dextromethorphan Syrup', pzn: 'PZN-E0008', price: 85, unitType: 'bottle', stock: 150, prescriptionRequired: false, lowStockThreshold: 30, description: 'Cough suppressant' },
      { name: 'Salmeterol Inhaler', pzn: 'PZN-E0009', price: 420, unitType: 'bottle', stock: 30, prescriptionRequired: true, lowStockThreshold: 30, description: 'Long-acting bronchodilator' },
      { name: 'Ipratropium Nebulizer', pzn: 'PZN-E0010', price: 250, unitType: 'box', stock: 50, prescriptionRequired: true, lowStockThreshold: 30, description: 'COPD treatment' },
      { name: 'Esomeprazole 40mg', pzn: 'PZN-F0001', price: 60, unitType: 'strip', stock: 350, prescriptionRequired: false, lowStockThreshold: 30, description: 'Nexium generic for GERD' },
      { name: 'Rabeprazole 20mg', pzn: 'PZN-F0002', price: 55, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'PPI for acid reflux' },
      { name: 'Famotidine 20mg', pzn: 'PZN-F0003', price: 40, unitType: 'strip', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'Pepcid generic for heartburn' },
      { name: 'Ondansetron 4mg', pzn: 'PZN-F0004', price: 120, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Zofran generic for nausea' },
      { name: 'Metoclopramide 10mg', pzn: 'PZN-F0005', price: 45, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Gut motility stimulator' },
      { name: 'Loperamide 2mg', pzn: 'PZN-F0006', price: 30, unitType: 'strip', stock: 600, prescriptionRequired: false, lowStockThreshold: 30, description: 'Imodium generic for diarrhea' },
      { name: 'Bisacodyl 5mg', pzn: 'PZN-F0007', price: 25, unitType: 'strip', stock: 300, prescriptionRequired: false, lowStockThreshold: 30, description: 'Dulcolax generic laxative' },
      { name: 'Docusate Sodium 100mg', pzn: 'PZN-F0008', price: 45, unitType: 'bottle', stock: 120, prescriptionRequired: false, lowStockThreshold: 30, description: 'Stool softener' },
      { name: 'Polyethylene Glycol', pzn: 'PZN-F0009', price: 180, unitType: 'bottle', stock: 80, prescriptionRequired: false, lowStockThreshold: 30, description: 'Miralax generic laxative' },
      { name: 'Mesalamine 400mg', pzn: 'PZN-F0010', price: 350, unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Treatment for ulcerative colitis' },
      { name: 'Escitalopram 10mg', pzn: 'PZN-G0001', price: 130, unitType: 'tablet', stock: 220, prescriptionRequired: true, lowStockThreshold: 30, description: 'Lexapro generic antidepressant' },
      { name: 'Fluoxetine 20mg', pzn: 'PZN-G0002', price: 110, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Prozac generic antidepressant' },
      { name: 'Venlafaxine 75mg', pzn: 'PZN-G0003', price: 160, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Effexor generic for depression/anxiety' },
      { name: 'Bupropion 150mg', pzn: 'PZN-G0004', price: 140, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Wellbutrin generic for depression' },
      { name: 'Clonazepam 0.5mg', pzn: 'PZN-G0005', price: 120, unitType: 'tablet', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Klonopin generic for panic (controlled)' },
      { name: 'Lorazepam 1mg', pzn: 'PZN-G0006', price: 105, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Ativan generic for anxiety (controlled)' },
      { name: 'Diazepam 5mg', pzn: 'PZN-G0007', price: 90, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Valium generic for anxiety (controlled)' },
      { name: 'Zolpidem 10mg', pzn: 'PZN-G0008', price: 180, unitType: 'tablet', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Ambien generic for insomnia (controlled)' },
      { name: 'Trazodone 50mg', pzn: 'PZN-G0009', price: 85, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antidepressant used for sleep' },
      { name: 'Aripiprazole 5mg', pzn: 'PZN-G0010', price: 280, unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Abilify generic antipsychotic' },
      { name: 'Doxycycline 100mg', pzn: 'PZN-H0001', price: 85, unitType: 'strip', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Tetracycline antibiotic' },
      { name: 'Clindamycin 300mg', pzn: 'PZN-H0002', price: 110, unitType: 'strip', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antibiotic for severe infections' },
      { name: 'Sulfamethoxazole/TMP', pzn: 'PZN-H0003', price: 65, unitType: 'strip', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Bactrim generic for UTIs' },
      { name: 'Nitrofurantoin 100mg', pzn: 'PZN-H0004', price: 120, unitType: 'strip', stock: 160, prescriptionRequired: true, lowStockThreshold: 30, description: 'Macrobid generic for UTIs' },
      { name: 'Levofloxacin 500mg', pzn: 'PZN-H0005', price: 140, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Levaquin generic antibiotic' },
      { name: 'Fluconazole 150mg', pzn: 'PZN-H0006', price: 95, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Diflucan generic antifungal' },
      { name: 'Acyclovir 400mg', pzn: 'PZN-H0007', price: 130, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Zovirax generic antiviral' },
      { name: 'Valacyclovir 1g', pzn: 'PZN-H0008', price: 210, unitType: 'tablet', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Valtrex generic for herpes' },
      { name: 'Oseltamivir 75mg', pzn: 'PZN-H0009', price: 450, unitType: 'strip', stock: 40, prescriptionRequired: true, lowStockThreshold: 30, description: 'Tamiflu generic for influenza' },
      { name: 'Cefuroxime 500mg', pzn: 'PZN-H0010', price: 160, unitType: 'tablet', stock: 110, prescriptionRequired: true, lowStockThreshold: 30, description: 'Ceftin generic antibiotic' },
      { name: 'Tretinoin 0.05%', pzn: 'PZN-I0001', price: 240, unitType: 'tube', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Retin-A generic for acne/aging' },
      { name: 'Adapalene 0.1%', pzn: 'PZN-I0002', price: 300, unitType: 'tube', stock: 60, prescriptionRequired: false, lowStockThreshold: 30, description: 'Differin generic for acne' },
      { name: 'Clindamycin Gel', pzn: 'PZN-I0003', price: 180, unitType: 'tube', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Topical antibiotic for acne' },
      { name: 'Hydrocortisone 1%', pzn: 'PZN-I0004', price: 45, unitType: 'tube', stock: 300, prescriptionRequired: false, lowStockThreshold: 30, description: 'Mild steroid cream for itch' },
      { name: 'Betamethasone 0.1%', pzn: 'PZN-I0005', price: 120, unitType: 'tube', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Strong steroid cream' },
      { name: 'Ketoconazole Shampoo', pzn: 'PZN-I0006', price: 220, unitType: 'bottle', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antifungal shampoo for dandruff' },
      { name: 'Terbinafine Cream', pzn: 'PZN-I0007', price: 85, unitType: 'tube', stock: 200, prescriptionRequired: false, lowStockThreshold: 30, description: 'Lamisil generic for athletes foot' },
      { name: 'Minoxidil 5%', pzn: 'PZN-I0008', price: 350, unitType: 'bottle', stock: 50, prescriptionRequired: false, lowStockThreshold: 30, description: 'Rogaine generic for hair growth' },
      { name: 'Salicylic Acid 2%', pzn: 'PZN-I0009', price: 90, unitType: 'bottle', stock: 180, prescriptionRequired: false, lowStockThreshold: 30, description: 'Acne wash/treatment' },
      { name: 'Mupirocin 2%', pzn: 'PZN-I0010', price: 140, unitType: 'tube', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Topical antibiotic for skin infections' },
      { name: 'Vitamin C 1000mg', pzn: 'PZN-J0001', price: 60, unitType: 'bottle', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'Immunity boosting supplement' },
      { name: 'Vitamin B Complex', pzn: 'PZN-J0002', price: 85, unitType: 'strip', stock: 350, prescriptionRequired: false, lowStockThreshold: 30, description: 'Energy and nerve health' },
      { name: 'Vitamin B12 1000mcg', pzn: 'PZN-J0003', price: 110, unitType: 'bottle', stock: 200, prescriptionRequired: false, lowStockThreshold: 30, description: 'Nerve health supplement' },
      { name: 'Magnesium 250mg', pzn: 'PZN-J0004', price: 95, unitType: 'bottle', stock: 250, prescriptionRequired: false, lowStockThreshold: 30, description: 'Muscle and sleep support' },
      { name: 'Zinc 50mg', pzn: 'PZN-J0005', price: 70, unitType: 'bottle', stock: 300, prescriptionRequired: false, lowStockThreshold: 30, description: 'Immunity supplement' },
      { name: 'Fish Oil 1000mg', pzn: 'PZN-J0006', price: 250, unitType: 'bottle', stock: 150, prescriptionRequired: false, lowStockThreshold: 30, description: 'Omega-3 for heart health' },
      { name: 'Glucosamine Msn', pzn: 'PZN-J0007', price: 320, unitType: 'bottle', stock: 100, prescriptionRequired: false, lowStockThreshold: 30, description: 'Joint health support' },
      { name: 'Probiotic 50 Billion', pzn: 'PZN-J0008', price: 450, unitType: 'bottle', stock: 80, prescriptionRequired: false, lowStockThreshold: 30, description: 'Gut health supplement' },
      { name: 'Melatonin 3mg', pzn: 'PZN-J0009', price: 120, unitType: 'bottle', stock: 200, prescriptionRequired: false, lowStockThreshold: 30, description: 'Sleep cycle support' },
      { name: 'Prenatal Vitamins', pzn: 'PZN-J0010', price: 280, unitType: 'bottle', stock: 120, prescriptionRequired: false, lowStockThreshold: 30, description: 'Pregnancy daily supplement' },
      { name: 'Latanoprost 0.005%', pzn: 'PZN-K0001', price: 350, unitType: 'bottle', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Xalatan generic for glaucoma' },
      { name: 'Timolol 0.5%', pzn: 'PZN-K0002', price: 180, unitType: 'bottle', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Beta blocker eye drops' },
      { name: 'Olopatadine 0.1%', pzn: 'PZN-K0003', price: 240, unitType: 'bottle', stock: 110, prescriptionRequired: true, lowStockThreshold: 30, description: 'Patanol generic for eye allergies' },
      { name: 'Ketotifen Drops', pzn: 'PZN-K0004', price: 150, unitType: 'bottle', stock: 140, prescriptionRequired: false, lowStockThreshold: 30, description: 'Zaditor generic for itchy eyes' },
      { name: 'Artificial Tears', pzn: 'PZN-K0005', price: 90, unitType: 'bottle', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'Lubricating eye drops' },
      { name: 'Polytrim Eye Drops', pzn: 'PZN-K0006', price: 120, unitType: 'bottle', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antibiotic eye drops' },
      { name: 'Erythromycin Ointment', pzn: 'PZN-K0007', price: 140, unitType: 'tube', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Eye antibiotic ointment' },
      { name: 'Ofloxacin Ear Drops', pzn: 'PZN-K0008', price: 180, unitType: 'bottle', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antibiotic ear drops' },
      { name: 'Carbamide Peroxide', pzn: 'PZN-K0009', price: 85, unitType: 'bottle', stock: 200, prescriptionRequired: false, lowStockThreshold: 30, description: 'Ear wax removal drops' },
      { name: 'Neomycin/Polymyxin HC', pzn: 'PZN-K0010', price: 220, unitType: 'bottle', stock: 70, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antibiotic/steroid ear drops' },
      { name: 'Ethinyl Estradiol/Levonorgestrel', pzn: 'PZN-L0001', price: 250, unitType: 'strip', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Oral contraceptive pill' },
      { name: 'Norethindrone 0.35mg', pzn: 'PZN-L0002', price: 220, unitType: 'strip', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Mini-pill contraceptive' },
      { name: 'Medroxyprogesterone', pzn: 'PZN-L0003', price: 140, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Provera generic for periods' },
      { name: 'Clomiphene 50mg', pzn: 'PZN-L0004', price: 450, unitType: 'tablet', stock: 50, prescriptionRequired: true, lowStockThreshold: 30, description: 'Clomid generic for ovulation' },
      { name: 'Fluconazole 150mg', pzn: 'PZN-L0005', price: 90, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Yeast infection treatment' },
      { name: 'Miconazole 7-Day', pzn: 'PZN-L0006', price: 120, unitType: 'box', stock: 140, prescriptionRequired: false, lowStockThreshold: 30, description: 'Monistat generic OTC' },
      { name: 'Tranexamic Acid 650mg', pzn: 'PZN-L0007', price: 280, unitType: 'tablet', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Lysteda generic for heavy bleeding' },
      { name: 'Levonorgestrel 1.5mg', pzn: 'PZN-L0008', price: 400, unitType: 'tablet', stock: 100, prescriptionRequired: false, lowStockThreshold: 30, description: 'Plan B generic emergency contraception' },
      { name: 'Alendronate 70mg', pzn: 'PZN-L0009', price: 150, unitType: 'tablet', stock: 110, prescriptionRequired: true, lowStockThreshold: 30, description: 'Fosamax generic for osteoporosis' },
      { name: 'Raloxifene 60mg', pzn: 'PZN-L0010', price: 320, unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Evista generic for bone health' },
      { name: 'Sildenafil 50mg', pzn: 'PZN-M0001', price: 350, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Viagra generic for ED' },
      { name: 'Tadalafil 10mg', pzn: 'PZN-M0002', price: 400, unitType: 'tablet', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Cialis generic for ED' },
      { name: 'Tamsulosin 0.4mg', pzn: 'PZN-M0003', price: 160, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Flomax generic for prostate' },
      { name: 'Finasteride 1mg', pzn: 'PZN-M0004', price: 280, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Propecia generic for hair loss' },
      { name: 'Finasteride 5mg', pzn: 'PZN-M0005', price: 190, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Proscar generic for prostate' },
      { name: 'Dutasteride 0.5mg', pzn: 'PZN-M0006', price: 320, unitType: 'tablet', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Avodart generic for enlarged prostate' },
      { name: 'Oxybutynin 5mg', pzn: 'PZN-M0007', price: 110, unitType: 'tablet', stock: 160, prescriptionRequired: true, lowStockThreshold: 30, description: 'Ditropan for overactive bladder' },
      { name: 'Tolterodine 2mg', pzn: 'PZN-M0008', price: 210, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Detrol generic for bladder control' },
      { name: 'Mirabegron 50mg', pzn: 'PZN-M0009', price: 450, unitType: 'tablet', stock: 50, prescriptionRequired: true, lowStockThreshold: 30, description: 'Myrbetriq generic for overactive bladder' },
      { name: 'Phenazopyridine 100mg', pzn: 'PZN-M0010', price: 85, unitType: 'strip', stock: 220, prescriptionRequired: false, lowStockThreshold: 30, description: 'AZO generic for UTI pain' },
      { name: 'Allopurinol 100mg', pzn: 'PZN-N0001', price: 60, unitType: 'tablet', stock: 250, prescriptionRequired: true, lowStockThreshold: 30, description: 'Zyloprim generic for gout prevention' },
      { name: 'Colchicine 0.6mg', pzn: 'PZN-N0002', price: 180, unitType: 'tablet', stock: 110, prescriptionRequired: true, lowStockThreshold: 30, description: 'Colcrys generic for acute gout' },
      { name: 'Febuxostat 40mg', pzn: 'PZN-N0003', price: 220, unitType: 'tablet', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Uloric generic for gout' },
      { name: 'Methotrexate 2.5mg', pzn: 'PZN-N0004', price: 150, unitType: 'tablet', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Trexall generic for rheumatoid arthritis' },
      { name: 'Hydroxychloroquine 200mg', pzn: 'PZN-N0005', price: 190, unitType: 'tablet', stock: 120, prescriptionRequired: true, lowStockThreshold: 30, description: 'Plaquenil generic for arthritis/lupus' },
      { name: 'Cyclobenzaprine 10mg', pzn: 'PZN-N0006', price: 90, unitType: 'tablet', stock: 200, prescriptionRequired: true, lowStockThreshold: 30, description: 'Flexeril generic muscle relaxant' },
      { name: 'Tizanidine 2mg', pzn: 'PZN-N0007', price: 110, unitType: 'tablet', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Zanaflex generic muscle relaxant' },
      { name: 'Baclofen 10mg', pzn: 'PZN-N0008', price: 130, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Lioresal generic for muscle spasms' },
      { name: 'Methocarbamol 500mg', pzn: 'PZN-N0009', price: 100, unitType: 'tablet', stock: 170, prescriptionRequired: true, lowStockThreshold: 30, description: 'Robaxin generic muscle relaxant' },
      { name: 'Carisoprodol 350mg', pzn: 'PZN-N0010', price: 250, unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Soma generic muscle relaxant (controlled)' },
      { name: 'Epinephrine Pen 0.3mg', pzn: 'PZN-O0001', price: 2500, unitType: 'injection', stock: 20, prescriptionRequired: true, lowStockThreshold: 30, description: 'EpiPen generic for anaphylaxis' },
      { name: 'Naloxone Spray 4mg', pzn: 'PZN-O0002', price: 1800, unitType: 'box', stock: 30, prescriptionRequired: false, lowStockThreshold: 30, description: 'Narcan generic for opioid overdose' },
      { name: 'Propranolol 10mg', pzn: 'PZN-O0003', price: 65, unitType: 'tablet', stock: 300, prescriptionRequired: true, lowStockThreshold: 30, description: 'Beta blocker for BP, anxiety, migraines' },
      { name: 'Ondansetron ODT 4mg', pzn: 'PZN-O0004', price: 150, unitType: 'strip', stock: 180, prescriptionRequired: true, lowStockThreshold: 30, description: 'Dissolving tablet for severe nausea' },
      { name: 'Chlorhexidine Wash', pzn: 'PZN-O0005', price: 220, unitType: 'bottle', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Antibacterial surgical wash/mouthwash' },
      { name: 'Nicotine Patch 21mg', pzn: 'PZN-O0006', price: 350, unitType: 'box', stock: 80, prescriptionRequired: false, lowStockThreshold: 30, description: 'Nicoderm generic for quitting smoking' },
      { name: 'Nicotine Gum 2mg', pzn: 'PZN-O0007', price: 280, unitType: 'box', stock: 120, prescriptionRequired: false, lowStockThreshold: 30, description: 'Nicorette generic gum' },
      { name: 'Lidocaine Patch 4%', pzn: 'PZN-O0008', price: 150, unitType: 'box', stock: 200, prescriptionRequired: false, lowStockThreshold: 30, description: 'Salonpas generic pain patch' },
      { name: 'Bismuth Subsalicylate', pzn: 'PZN-O0009', price: 60, unitType: 'bottle', stock: 350, prescriptionRequired: false, lowStockThreshold: 30, description: 'Pepto Bismol generic for stomach upset' },
      { name: 'Simethicone 125mg', pzn: 'PZN-O0010', price: 45, unitType: 'strip', stock: 400, prescriptionRequired: false, lowStockThreshold: 30, description: 'Gas-X generic for bloating' },
      { name: 'Apixaban 5mg', pzn: 'PZN-P0001', price: 850, unitType: 'tablet', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Eliquis generic blood thinner' },
      { name: 'Rivaroxaban 20mg', pzn: 'PZN-P0002', price: 820, unitType: 'tablet', stock: 70, prescriptionRequired: true, lowStockThreshold: 30, description: 'Xarelto generic blood thinner' },
      { name: 'Dabigatran 150mg', pzn: 'PZN-P0003', price: 750, unitType: 'tablet', stock: 50, prescriptionRequired: true, lowStockThreshold: 30, description: 'Pradaxa generic blood thinner' },
      { name: 'Enoxaparin 40mg', pzn: 'PZN-P0004', price: 1200, unitType: 'injection', stock: 40, prescriptionRequired: true, lowStockThreshold: 30, description: 'Lovenox generic injection' },
      { name: 'Pramipexole 0.125mg', pzn: 'PZN-P0005', price: 210, unitType: 'tablet', stock: 90, prescriptionRequired: true, lowStockThreshold: 30, description: 'Mirapex generic for Parkinson\'s/RLS' },
      { name: 'Ropinirole 0.5mg', pzn: 'PZN-P0006', price: 190, unitType: 'tablet', stock: 110, prescriptionRequired: true, lowStockThreshold: 30, description: 'Requip generic for Parkinson\'s/RLS' },
      { name: 'Carbidopa/Levodopa 25/100', pzn: 'PZN-P0007', price: 160, unitType: 'tablet', stock: 150, prescriptionRequired: true, lowStockThreshold: 30, description: 'Sinemet generic for Parkinson\'s' },
      { name: 'Memantine 5mg', pzn: 'PZN-P0008', price: 280, unitType: 'tablet', stock: 80, prescriptionRequired: true, lowStockThreshold: 30, description: 'Namenda generic for Alzheimer\'s' },
      { name: 'Donepezil 5mg', pzn: 'PZN-P0009', price: 250, unitType: 'tablet', stock: 100, prescriptionRequired: true, lowStockThreshold: 30, description: 'Aricept generic for Alzheimer\'s' },
      { name: 'Ursodiol 300mg', pzn: 'PZN-P0010', price: 320, unitType: 'capsule', stock: 60, prescriptionRequired: true, lowStockThreshold: 30, description: 'Actigall generic for gallstones' },
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
