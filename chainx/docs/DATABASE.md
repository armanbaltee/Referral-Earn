# Database Schema & Relationships

## Overview

All monetary values are stored as **integer paisa** (PKR minor units).  
`1 PKR = 100 paisa`. Display formatting: `PKR X.XX`.

---

## Models & Relationships

```
User
 ├── has one  → Wallet
 ├── has many → Order
 ├── has many → Referral (as referrer)
 ├── has one  → Referral (as referee)
 ├── has many → Deposit
 ├── has many → Withdrawal
 ├── has many → Commission
 ├── has many → WalletTransaction
 ├── has many → TaskSubmission
 ├── has many → Notification
 └── has many → Payment

Product
 └── has many → Order

Order
 ├── belongs to → User
 ├── belongs to → Product
 └── has one  → WalletTransaction

Referral
 ├── belongs to → User (referrer)
 └── belongs to → User (referee)

Commission
 ├── belongs to → User
 └── belongs to → Referral

WalletTransaction
 ├── belongs to → Wallet
 └── belongs to → User

Deposit / Withdrawal / Payment
 └── belong to → User

Task
 └── has many → TaskSubmission

TaskSubmission
 ├── belongs to → Task
 └── belongs to → User

AuditLog
 └── belongs to → User (actor)
```

---

## Indexes

| Model             | Index                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| User              | email (unique), phone (unique), referralCode (unique), referredBy, role+isActive |
| Product           | slug (unique), status+level, category, full-text                                 |
| Referral          | referee (unique), referrer+status                                                |
| Wallet            | user (unique)                                                                    |
| WalletTransaction | wallet+createdAt, user+type+createdAt                                            |
| Deposit           | user+status+createdAt, idempotencyKey (unique)                                   |
| Withdrawal        | user+status+createdAt, idempotencyKey (unique)                                   |
| Commission        | user+type+status, idempotencyKey (unique)                                        |
| Order             | user+status+createdAt, status+expiresAt                                          |
| Payment           | merchantOrderId (unique), idempotencyKey (unique)                                |
| Notification      | user+isRead+createdAt, TTL 90 days                                               |
| IdempotencyRecord | key (unique), TTL on expiresAt                                                   |
| AuditLog          | actor+action+createdAt, action+createdAt                                         |

---

## Financial Integrity Rules

1. Never directly update `Wallet.balance` — always create a `WalletTransaction` inside a MongoDB session.
2. Never delete or silently edit a `WalletTransaction` — use `REVERSAL` type entries.
3. Every `Deposit`, `Withdrawal`, and `Commission` has a unique `idempotencyKey` to prevent double processing.
4. Snapshot financial values in `Order` at purchase time — do not rely on current `Product.price`.
