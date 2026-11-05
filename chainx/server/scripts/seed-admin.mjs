/**
 * ChainX – Seed Super Admin User (Non-Interactive)
 * Run: node scripts/seed-admin.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chainx_dev';

// Admin credentials - change before production!
const ADMIN = {
  name:     'ChainX Admin',
  email:    'admin@chainx.com',
  phone:    '+923001234567',
  password: 'Admin@12345',
  role:     'super_admin',
};

await mongoose.connect(MONGODB_URI);
console.log(`\n✅  MongoDB connected: ${MONGODB_URI}`);

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Check if already exists
const existing = await User.findOne({ email: ADMIN.email }).lean();
if (existing) {
  console.log(`\n⚠️   Admin user already exists!`);
  console.log(`    Email : ${ADMIN.email}`);
  console.log(`    Role  : ${existing.role}`);
  console.log(`    ID    : ${existing._id}\n`);
  await mongoose.disconnect();
  process.exit(0);
}

const hashedPassword = await bcrypt.hash(ADMIN.password, 12);

// Generate referral code
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let referralCode = 'CHX-ADMIN1';

const admin = await User.create({
  name:                      ADMIN.name,
  email:                     ADMIN.email,
  phone:                     ADMIN.phone,
  password:                  hashedPassword,
  role:                      ADMIN.role,
  referralCode,
  accountStatus:             'active',
  registrationPaymentStatus: 'paid',
  isActive:                  true,
  isEmailVerified:           true,
  registrationFee:           0,
  createdAt:                 new Date(),
  updatedAt:                 new Date(),
});

console.log('\n╔═════════════════════════════════════════╗');
console.log('║      ✅  Admin User Created!             ║');
console.log('╚═════════════════════════════════════════╝');
console.log(`
  ID       : ${admin._id}
  Name     : ${ADMIN.name}
  Email    : ${ADMIN.email}
  Phone    : ${ADMIN.phone}
  Role     : ${ADMIN.role}
  Password : ${ADMIN.password}
  
  ⚠️  Change the password after first login!
  Login URL: http://localhost:5173/login
`);

await mongoose.disconnect();
process.exit(0);

