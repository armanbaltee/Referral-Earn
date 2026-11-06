# ChainX Platform – Execution & Integration Guide

Welcome to **ChainX**, an affiliate referral, product management, wallet, and task platform built with **React (Vite + TypeScript + TailwindCSS)** on the frontend and **Node.js (Express + TypeScript + MongoDB)** on the backend.

---

## 1. Prerequisites

Before starting, ensure you have the following installed and running:

1. **Node.js**: Version **`>= 20.0.0`** (check with `node -v`)
2. **npm**: Version **`>= 10.0.0`** (check with `npm -v`)
3. **MongoDB**: Local MongoDB Community Edition or MongoDB Atlas (default: `mongodb://127.0.0.1:27017/chainx_dev`)
   - To check MongoDB service on Windows PowerShell:
     ```powershell
     Get-Service MongoDB
     ```
   - To start MongoDB if stopped:
     ```powershell
     net start MongoDB
     ```

---

## 2. Project Directory Structure

ChainX is structured as an npm workspaces monorepo:

```
Referral-Earn/
└── chainx/
    ├── package.json          # Root workspace configuration
    ├── HOW_TO_RUN.md         # This execution guide
    ├── client/               # React 18 + Vite + Tailwind CSS frontend
    │   ├── .env              # Frontend environment variables
    │   ├── src/              # Application components, layouts, features
    │   └── package.json
    └── server/               # Express + TypeScript + Mongoose backend
        ├── .env              # Backend environment variables
        ├── scripts/
        │   └── create-admin.mjs  # Admin creation & seed script
        ├── src/              # Modules (users, wallet, tasks, referrals, admin)
        └── package.json
```

---

## 3. Environment Configuration

### Backend Environment (`chainx/server/.env`)
Ensure `chainx/server/.env` contains the required settings:

```env
NODE_ENV=development
PORT=5000
APP_NAME=ChainX
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/chainx_dev

JWT_ACCESS_SECRET=chainx_access_super_secret_key_32_chars_min
JWT_REFRESH_SECRET=chainx_refresh_super_secret_key_32_chars_min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

COOKIE_SECRET=chainx_cookie_super_secret_key_32_chars_min

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info

# ─── Cloudinary (Image & Proof Uploads) ───────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Easypaisa Gateway (Optional - for automated mode) ─
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_HASH_KEY=your_hash_key
EASYPAISA_MODE=sandbox

# ─── JazzCash Gateway (Optional - for automated mode) ──
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
JAZZCASH_MODE=sandbox
```

### Frontend Environment (`chainx/client/.env`)
Ensure `chainx/client/.env` contains:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=ChainX
VITE_APP_URL=http://localhost:5173
```

---

## 4. How to Get Cloudinary, Easypaisa & JazzCash IDs

ChainX requires Cloudinary for file uploads (product images, deposit receipts, task proof screenshots) and supports both **Manual** and **Automated** payment processing via Easypaisa and JazzCash.

### 4.1 Cloudinary Setup (Cloud Name, API Key & API Secret)

Cloudinary provides free cloud storage and transformation for images and files.

#### Step-by-Step Procedure:
1. **Create Free Account**:
   - Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free).
   - Enter your name, email, and password, or sign up with Google / GitHub.
   - Verify your email address.
2. **Locate Your API Credentials**:
   - Log in to your Cloudinary Console: [https://console.cloudinary.com](https://console.cloudinary.com).
   - On the main **Dashboard** (Product Environment Credentials card), you will see:
     - **Cloud Name**: (e.g. `dxy8abcde`)
     - **API Key**: (e.g. `123456789012345`)
     - **API Secret**: (click "Copy" or reveal the secret)
3. **Configure ChainX**:
   - Open `chainx/server/.env` and paste:
     ```env
     CLOUDINARY_CLOUD_NAME=dxy8abcde
     CLOUDINARY_API_KEY=123456789012345
     CLOUDINARY_API_SECRET=your_copied_api_secret
     ```
4. **(Recommended) Configure Upload Settings**:
   - In Cloudinary Console, click **Settings (Gear icon)** -> **Upload**.
   - Under **Upload presets**, add an unsigned preset or keep the default signed upload active (ChainX uses secure server-side signed uploads).

---

### 4.2 Easypaisa Integration Guide

ChainX supports two payment operational modes:

#### Mode A: Manual Transfer Mode (Instant / Ready Out of the Box)
*No corporate approval required.* Suitable for initial operations, testing, or direct merchant mobile account transfers:
1. Log in to the ChainX Admin Portal ([http://localhost:5173/login](http://localhost:5173/login) as Super Admin).
2. Go to **Platform Settings (`/admin/settings`)** -> **Fee & Payment Accounts** tab.
3. Configure your EasyPaisa Merchant/Personal Details:
   - **Account Title:** e.g. `ChainX Financial Services`
   - **Account Number / Mobile:** e.g. `03451234567`
   - **Instructions:** e.g. *"Transfer Rs. 15,000 to this EasyPaisa number. Enter the 11-digit TRX ID and upload screenshot."*
4. Click **Save Settings**.
5. When a user deposits or pays their fee, they view these instructions, transfer funds via their Easypaisa mobile app, and submit their transaction reference (TRX ID). Admin approves it from `/admin/deposits` or `/admin/users`.

---

#### Mode B: Automated Merchant Gateway (IPN / Webhook Checkout)
*Requires an Easypaisa Corporate Merchant / Developer Account.*

#### Procedure to Get Easypaisa Store ID & Hash Key:
1. **Apply for a Corporate Merchant Account**:
   - Visit: [https://easypaisa.com.pk/online-payments/](https://easypaisa.com.pk/online-payments/)
   - Click **Get Started** / **Sign Up as Merchant** or email `businesspayments@telenorbank.pk`.
   - Required Documentation:
     - Business NTN (National Tax Number)
     - Owner CNIC
     - Business Bank Account Maintenance Certificate / IBAN
     - Form 29 / SECP Registration (for registered firms)
2. **Access Merchant Portal & Sandbox**:
   - Easypaisa issues access to the **Easypaisa Merchant Portal** (`https://merchant.easypaisa.com.pk`).
   - For developer sandbox testing, their integration team provides sandbox API credentials.
3. **Obtain API Keys**:
   - **Store ID**: A numeric identifier assigned to your web store (e.g. `10892`).
   - **Hash Key**: A 16-character or 32-character secret key generated inside the portal under **Store Settings -> Credentials / Integration Keys**.
4. **Configure ChainX Environment**:
   - In `chainx/server/.env`:
     ```env
     EASYPAISA_STORE_ID=10892
     EASYPAISA_HASH_KEY=your_generated_hash_key
     EASYPAISA_MODE=sandbox   # change to 'live' when going to production
     ```
5. **Set Callback URL**:
   - In Easypaisa merchant portal, set the Instant Payment Notification (IPN) webhook URL to:
     `https://yourdomain.com/api/v1/payments/easypaisa/callback`

---

### 4.3 JazzCash Integration Guide

ChainX supports both Manual and Automated JazzCash flows.

#### Mode A: Manual Transfer Mode (Instant / Ready Out of the Box)
1. Log in to the ChainX Admin Portal as Super Admin.
2. Go to **Platform Settings (`/admin/settings`)** -> **Fee & Payment Accounts**.
3. Set your JazzCash Account details:
   - **Account Title:** e.g. `ChainX Technologies Pvt Ltd`
   - **Account Number / Till ID:** e.g. `03009876543`
   - **Instructions:** e.g. *"Send via JazzCash mobile app or retailer till. Enter the TID from SMS confirmation."*
4. Click **Save Settings**.

---

#### Mode B: Automated Merchant Gateway (Hosted Checkout & Mobile Wallet)
*Requires JazzCash Merchant credentials.*

#### Procedure to Get JazzCash Merchant ID, Password & Integrity Salt:

##### 1. Sandbox / Developer Registration (Instant for Testing):
1. Navigate to the **JazzCash Developer Portal**: [https://sandbox.jazzcash.com.pk/](https://sandbox.jazzcash.com.pk/).
2. Click **Register as Developer** / **Sign In**.
3. Once registered, log in to your sandbox account dashboard.
4. Go to **Sandbox Credentials** or **Integration Keys**.
5. You will receive:
   - **Merchant ID (MID)**: e.g. `MC12345`
   - **Password**: e.g. `p8x92abcde`
   - **Integrity Salt**: A 10+ character secret key (e.g. `s73n9x821q`) used to compute secure HMAC SHA-256 hashes.

##### 2. Live Merchant Account (For Production):
1. Visit: [https://www.jazzcash.com.pk/business/corporate-solutions/online-payments/](https://www.jazzcash.com.pk/business/corporate-solutions/online-payments/).
2. Submit corporate KYC documents:
   - CNIC of Proprietor / Directors
   - Business NTN & Sales Tax Certificate
   - Bank Account Statement (last 6 months)
   - Domain ownership / Website URL
3. Complete UAT (User Acceptance Testing) in the Sandbox environment.
4. The JazzCash Operations team verifies your test transactions and issues Live **Merchant ID**, **Password**, and **Integrity Salt**.

##### 3. Configure ChainX Environment:
In `chainx/server/.env`:
```env
JAZZCASH_MERCHANT_ID=MC12345
JAZZCASH_PASSWORD=your_merchant_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
JAZZCASH_MODE=sandbox    # change to 'live' for production
```

##### 4. Set Callback URL:
Set your return/IPN URL in the JazzCash merchant dashboard:
- Return URL: `https://yourdomain.com/payment/complete`
- Webhook / IPN: `https://yourdomain.com/api/v1/payments/jazzcash/callback`

---

## 5. Creating the Admin User

You can create or update a **Super Admin** user directly in MongoDB using one simple command.

### Option A: One-Command Default Admin (Recommended)
From the `chainx/` root or `chainx/server/` directory:

```bash
# From chainx/ root directory:
npm run seed:admin

# Or from chainx/server/ directory:
cd server
npm run seed:admin
```

This immediately seeds (or updates) an active Super Admin with:
- **Email:** `admin@chainx.com`
- **Password:** `Admin@12345`
- **Role:** `super_admin`
- **Registration Fee:** Bypassed (Rs. 0)
- **Status:** Active / Email Verified

### Option B: Interactive Admin Creator
If you wish to specify custom credentials (name, email, phone, password, role):

```bash
# From chainx/ root:
npm run create:admin

# Or from chainx/server/:
npm run create:admin
```
The script will prompt you for details. Simply press **ENTER** on any prompt to keep the default value!

### Option C: CLI Arguments (Automated/Custom)
```bash
node server/scripts/create-admin.mjs --email=myadmin@domain.com --password=StrongPass123! --name="Lead Admin" --role=super_admin
```

---

## 6. Running the Project

You can run the entire platform with a single command or run client and server in separate terminal windows.

### Method 1: Single Command (Unified Client + Server)
Navigate to the `chainx/` root directory:

```bash
cd d:\Referral-Earn\chainx
npm run dev
```

This uses `concurrently` to launch:
- **Client (Vite):** Running at [http://localhost:5173](http://localhost:5173) (Cyan logs)
- **Server (Express):** Running at [http://localhost:5000](http://localhost:5000) (Green logs)

---

### Method 2: Separate Terminals (Recommended for debugging)

#### Terminal 1 – Server:
```bash
cd d:\Referral-Earn\chainx\server
npm run dev
```
*Output indicates: `✅ MongoDB connected successfully` and `Server listening on http://localhost:5000`.*

#### Terminal 2 – Client:
```bash
cd d:\Referral-Earn\chainx\client
npm run dev
```
*Output indicates: `VITE v5.4.21 ready in ... ms` at `http://localhost:5173`.*

---

## 7. Accessing the Platform

| Portal / Page | URL | Credentials / Notes |
|---|---|---|
| **Login Page** | [http://localhost:5173/login](http://localhost:5173/login) | Log in with either Admin or Member credentials |
| **Admin Portal** | [http://localhost:5173/admin/dashboard](http://localhost:5173/admin/dashboard) | Accessible when logged in as `admin` or `super_admin` |
| **User Dashboard** | [http://localhost:5173/dashboard](http://localhost:5173/dashboard) | Accessible when logged in as regular `user` |
| **Swagger API Docs** | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) | Interactive OpenAPI / Swagger UI |
| **Backend Health Check** | [http://localhost:5000/health](http://localhost:5000/health) | Verifies server and database connection |

---

## 8. Role-Based Navigation & Access

The frontend uses an intelligent unified application with **Role-Based Guards**:

1. **Login with Admin Credentials (`admin@chainx.com` / `Admin@12345`)**:
   - Redirected to `/admin/dashboard`
   - Access to:
     - User Management (`/admin/users`) – suspend, reactivate, confirm payments
     - Referrals & Milestones (`/admin/referrals`, `/admin/commissions`)
     - Fee Refund Approvals (`/admin/refunds`)
     - Deposit Approvals (`/admin/deposits`)
     - Withdrawal Approvals (`/admin/withdrawals`)
     - Task Management & Proof Reviews (`/admin/tasks`, `/admin/tasks/submissions`)
     - Product Catalog & Order Fulfillment (`/admin/products`, `/admin/orders`)
     - Platform Settings & Audit Logs (`/admin/settings`, `/admin/audit-logs`)
     - CSV Reports (`/admin/reports`)

2. **Login with Member Credentials**:
   - Redirected to `/dashboard`
   - Access to:
     - Live wallet balance & financial breakdown
     - Unique referral code & link copy
     - Available task submissions
     - Deposit & Withdrawal submission forms
     - Real-time notification center ([http://localhost:5173/notifications](http://localhost:5173/notifications))

---

## 9. Verification & Testing

To run the automated financial integrity test suite:

```bash
cd d:\Referral-Earn\chainx\server
npm run test
```

To run a clean production build check:

```bash
# Build both frontend and backend
cd d:\Referral-Earn\chainx
npm run build
```

---

## 10. Troubleshooting

- **MongoDB connection refused (`ECONNREFUSED 127.0.0.1:27017`):**
  Ensure MongoDB service is started with `net start MongoDB` or via Windows Services (`services.msc`).
- **Port 5000 already in use:**
  Terminate the lingering Node process or change `PORT=5001` in `server/.env` and `VITE_API_BASE_URL=http://localhost:5001/api/v1` in `client/.env`.
- **Cloudinary image upload fails:**
  Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are not empty in `server/.env`.
- **Easypaisa / JazzCash transactions pending:**
  - If using **Manual Mode (Default)**: Admin must review and approve transaction from `/admin/deposits` or `/admin/users`.
  - If using **Automated Mode**: Ensure `EASYPAISA_MODE=sandbox` and `JAZZCASH_MODE=sandbox` while using test credentials.
- **Admin login redirected or unauthorized:**
  Run `npm run seed:admin` to ensure the admin user exists with `role: "super_admin"` and `accountStatus: "active"`.
