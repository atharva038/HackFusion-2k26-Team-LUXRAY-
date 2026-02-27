/**
 * Admin/Pharmacist account setup.
 * Run: npm run create-admin
 *
 * Creates or FORCE-UPDATES the single pharmacy admin account.
 * Always sets the password — even if the account already exists.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';



const ADMIN = {
  name: 'Atharva',
  email: 'atharvsjoshi2005@gmail.com',
  password: 'Atharva@2005',
  role: 'admin',
  phone: '',
  age: 20,
  gender: 'male',
};

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Select password explicitly so we can check/update it
    const existing = await User.findOne({ email: ADMIN.email }).select('+password');

    if (existing) {
      // Force-update: set name, role, password regardless of current state
      existing.name = ADMIN.name;
      existing.role = ADMIN.role;
      existing.phone = ADMIN.phone;
      existing.age = ADMIN.age;
      existing.gender = ADMIN.gender;
      existing.password = ADMIN.password; // bcrypt pre-save hook will hash this
      await existing.save();
      console.log(`🔄 Admin account updated (password reset):`);
    } else {
      await User.create(ADMIN);
      console.log(`✅ Admin account created:`);
    }

    console.log(`   📧 Email   : ${ADMIN.email}`);
    console.log(`   🔑 Password: ${ADMIN.password}`);
    console.log(`   👤 Role    : ${ADMIN.role}`);
    console.log(`\n─────────────────────────────────────────────`);
    console.log(`Login at /login → you'll be redirected to /admin`);
    console.log(`─────────────────────────────────────────────\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
