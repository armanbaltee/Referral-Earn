/**
 * ChainX – Create / Seed Admin User Script
 *
 * Usage:
 *   npm run seed:admin                                          # Creates default admin (non-interactive)
 *   npm run create:admin                                        # Interactive prompt
 *   node scripts/create-admin.mjs --default                     # Non-interactive default
 *   node scripts/create-admin.mjs --email=a@b.com --password=X  # CLI arguments
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// ─── Load Environment Variables ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading server/.env first, then fallback to current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chainx_dev';

// ─── Parse CLI Arguments ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const parsedArgs = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--default' || arg === '-d') {
    parsedArgs.default = true;
  } else if (arg.startsWith('--')) {
    const [key, ...vals] = arg.slice(2).split('=');
    if (vals.length > 0) {
      parsedArgs[key] = vals.join('=');
    } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      parsedArgs[key] = args[++i];
    } else {
      parsedArgs[key] = true;
    }
  }
}

// ─── Default Admin Config ────────────────────────────────────────────────────
const DEFAULT_ADMIN = {
  name: process.env.ADMIN_NAME || 'ChainX Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@chainx.com').toLowerCase(),
  phone: process.env.ADMIN_PHONE || '+923001234567',
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  role: process.env.ADMIN_ROLE || 'super_admin',
};

// ─── Minimal User Model ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.models.User || mongoose.model('User', userSchema);

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CHX-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Main Script ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ChainX Platform – Admin User Creator             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log(`\n⏳ Connecting to MongoDB at: ${MONGODB_URI}...`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database successfully.\n');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Please ensure MongoDB service is running (e.g. net start MongoDB).');
    process.exit(1);
  }

  let name = parsedArgs.name;
  let email = parsedArgs.email ? parsedArgs.email.toLowerCase() : undefined;
  let phone = parsedArgs.phone;
  let password = parsedArgs.password;
  let role = parsedArgs.role || 'super_admin';

  const isNonInteractive = parsedArgs.default || (name && email && password);

  if (!isNonInteractive) {
    // If running in non-TTY environment (e.g., automated CI), fallback to default
    if (!process.stdin.isTTY) {
      console.log('⚠️  Non-interactive terminal detected. Using default admin credentials.');
      name = DEFAULT_ADMIN.name;
      email = DEFAULT_ADMIN.email;
      phone = DEFAULT_ADMIN.phone;
      password = DEFAULT_ADMIN.password;
      role = DEFAULT_ADMIN.role;
    } else {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q) => new Promise((res) => rl.question(q, res));

      console.log('Press ENTER to accept the [default value] shown in brackets:\n');

      name = (await ask(`Full Name [${DEFAULT_ADMIN.name}]: `)).trim() || DEFAULT_ADMIN.name;
      email = ((await ask(`Email [${DEFAULT_ADMIN.email}]: `)).trim() || DEFAULT_ADMIN.email).toLowerCase();
      phone = (await ask(`Phone [${DEFAULT_ADMIN.phone}]: `)).trim() || DEFAULT_ADMIN.phone;
      password = (await ask(`Password [${DEFAULT_ADMIN.password}]: `)).trim() || DEFAULT_ADMIN.password;
      const roleIn = (await ask(`Role (admin/super_admin) [${DEFAULT_ADMIN.role}]: `)).trim().toLowerCase();
      role = roleIn === 'admin' ? 'admin' : 'super_admin';

      rl.close();
    }
  } else if (parsedArgs.default) {
    name = DEFAULT_ADMIN.name;
    email = DEFAULT_ADMIN.email;
    phone = DEFAULT_ADMIN.phone;
    password = DEFAULT_ADMIN.password;
    role = DEFAULT_ADMIN.role;
  }

  if (!email || !password) {
    console.error('❌ Email and password are required.');
    await mongoose.disconnect();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`\n⚠️  User with email "${email}" already exists!`);
    console.log('   Updating existing user to active Super Admin...');

    const hashedPassword = await bcrypt.hash(password, 12);
    existing.role = role;
    existing.password = hashedPassword;
    existing.accountStatus = 'active';
    existing.registrationPaymentStatus = 'paid';
    existing.isActive = true;
    existing.isEmailVerified = true;
    existing.updatedAt = new Date();

    await existing.save();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           ✅  Admin User Updated Successfully!             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`
  User ID       : ${existing._id}
  Name          : ${existing.name || name}
  Email         : ${email}
  Phone         : ${existing.phone || phone}
  Role          : ${role}
  Password      : ${password}
  Referral Code : ${existing.referralCode}
  Account Status: active
  Reg. Payment  : paid (Rs. 0 - Admin bypass)

  🌐 Login URL  : http://localhost:5173/login
    `);
    await mongoose.disconnect();
    process.exit(0);
  }

  // Create brand new admin user
  const hashedPassword = await bcrypt.hash(password, 12);

  let referralCode = generateReferralCode();
  while (await User.findOne({ referralCode })) {
    referralCode = generateReferralCode();
  }

  const newAdmin = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role,
    referralCode,
    accountStatus: 'active',
    registrationPaymentStatus: 'paid', // Bypasses Rs. 15,000 fee
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    termsAccepted: true,
    registrationFee: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           ✅  Admin User Created Successfully!             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`
  User ID       : ${newAdmin._id}
  Name          : ${name}
  Email         : ${email}
  Phone         : ${phone}
  Role          : ${role}
  Password      : ${password}
  Referral Code : ${referralCode}
  Account Status: active
  Reg. Payment  : paid (Rs. 0 - Admin bypass)

  🌐 Login URL  : http://localhost:5173/login
  💡 Note       : Please change your password after initial login.
  `);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Unexpected error creating admin user:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
