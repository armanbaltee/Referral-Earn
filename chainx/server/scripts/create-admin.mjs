/**
 * ChainX – Create Admin User Script
 * Run: node scripts/create-admin.mjs
 * 
 * Creates a SUPER_ADMIN user directly in MongoDB (bypasses registration fee).
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import readline from 'readline';

// ─── Config ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chainx_dev';

// ─── Prompt helper ───────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

// ─── Connect ─────────────────────────────────────────────────────────────────
await mongoose.connect(MONGODB_URI);
console.log(`\n✅  Connected to MongoDB: ${MONGODB_URI}\n`);

// ─── Minimal User Schema (matches existing model) ────────────────────────────
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ─── Gather input ────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════');
console.log('  ChainX – Create Admin / Super Admin User  ');
console.log('═══════════════════════════════════════════\n');

const name     = (await ask('Full Name     : ')).trim();
const email    = (await ask('Email         : ')).trim().toLowerCase();
const phone    = (await ask('Phone (+92…)  : ')).trim();
const password = (await ask('Password      : ')).trim();
const roleIn   = (await ask('Role [admin / super_admin] (default: admin) : ')).trim().toLowerCase();

rl.close();

const role = roleIn === 'super_admin' ? 'super_admin' : 'admin';

// ─── Validation ──────────────────────────────────────────────────────────────
if (!name || !email || !phone || !password) {
  console.error('\n❌  All fields are required.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('\n❌  Password must be at least 8 characters.');
  process.exit(1);
}

// ─── Duplicate check ─────────────────────────────────────────────────────────
const existing = await User.findOne({ $or: [{ email }, { phone }] }).lean();
if (existing) {
  console.error(`\n❌  A user already exists with that email or phone.`);
  await mongoose.disconnect();
  process.exit(1);
}

// ─── Hash password ───────────────────────────────────────────────────────────
const hashedPassword = await bcrypt.hash(password, 12);

// ─── Generate unique referral code ───────────────────────────────────────────
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CHX-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
let referralCode = genCode();
while (await User.findOne({ referralCode }).lean()) referralCode = genCode();

// ─── Create admin user ───────────────────────────────────────────────────────
const adminUser = await User.create({
  name,
  email,
  phone,
  password: hashedPassword,
  role,
  referralCode,
  accountStatus: 'active',
  registrationPaymentStatus: 'paid',   // admins bypass the fee
  isActive: true,
  isEmailVerified: true,
  registrationFee: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

console.log('\n╔══════════════════════════════════════════╗');
console.log('║         Admin User Created ✅             ║');
console.log('╚══════════════════════════════════════════╝');
console.log(`
  ID            : ${adminUser._id}
  Name          : ${name}
  Email         : ${email}
  Phone         : ${phone}
  Role          : ${role}
  Referral Code : ${referralCode}
  Status        : active / email verified
  Reg. Fee      : bypassed (Rs. 0)
`);
console.log('You can now log in at: http://localhost:5173/login\n');

await mongoose.disconnect();
process.exit(0);

