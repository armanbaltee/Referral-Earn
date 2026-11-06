# ChainX Platform – Execution & Integration Guide

> **Full Detailed Manual:** See [`chainx/HOW_TO_RUN.md`](./chainx/HOW_TO_RUN.md) for complete architecture, API guides, and testing details.

---

## Quick Setup Summary

### 1. Seed or Create Admin User
```bash
# In d:\Referral-Earn\chainx:
npm run seed:admin
```
- **Email:** `admin@chainx.com`
- **Password:** `Admin@12345`
- **Role:** `super_admin`

Or create a custom admin interactively:
```bash
npm run create:admin
```

---

### 2. Third-Party Credentials Setup

#### A. Cloudinary (Image & Proof Uploads)
1. Register free at [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free).
2. Go to **Dashboard** -> copy **Cloud Name**, **API Key**, and **API Secret**.
3. Put into `chainx/server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

#### B. Easypaisa (Mode A vs Mode B)
- **Mode A (Manual Mode - Instant / No Bank Approval Needed):**
  Log in as Admin -> Go to **Settings (`/admin/settings`)** -> Enter your Easypaisa Account Title, Mobile Number, and instructions. Users transfer via their mobile app, enter the TRX ID, and upload receipt.
- **Mode B (Automated Gateway):**
  Apply at [https://easypaisa.com.pk/online-payments/](https://easypaisa.com.pk/online-payments/) -> obtain **Store ID** and **Hash Key** -> put in `chainx/server/.env` (`EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `EASYPAISA_MODE=sandbox`).

#### C. JazzCash (Mode A vs Mode B)
- **Mode A (Manual Mode - Instant):**
  Log in as Admin -> Go to **Settings (`/admin/settings`)** -> Enter your JazzCash Title, Till/Mobile Number. Users transfer via JazzCash app/retailer, enter TID, and upload receipt.
- **Mode B (Automated Gateway):**
  Register on [https://sandbox.jazzcash.com.pk/](https://sandbox.jazzcash.com.pk/) -> copy **Merchant ID (MID)**, **Password**, and **Integrity Salt** -> put in `chainx/server/.env` (`JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`, `JAZZCASH_MODE=sandbox`).

---

### 3. Start the Application
```bash
# In d:\Referral-Earn\chainx:
npm run dev
```
Starts both servers simultaneously:
- **Client (Frontend):** [http://localhost:5173](http://localhost:5173)
- **Server (Backend API):** [http://localhost:5000](http://localhost:5000)
- **Swagger Docs:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

### 4. Log In to Admin Portal
1. Open [http://localhost:5173/login](http://localhost:5173/login)
2. Enter `admin@chainx.com` and `Admin@12345`
3. You will be redirected to the **Admin Dashboard** (`/admin/dashboard`) with full platform management privileges.
