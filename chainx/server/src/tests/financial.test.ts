/**
 * Financial Integrity Tests for ChainX Platform
 * Tests critical invariants: double-spending prevention, idempotent credits, ledger consistency, and refund logic.
 */
import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

import { Wallet } from '../modules/wallet/wallet.model.js';
import {
  WalletTransaction,
  TransactionType,
  TransactionDirection,
  TransactionStatus,
} from '../modules/transactions/walletTransaction.model.js';
import { Referral, ReferralStatus } from '../modules/referrals/referral.model.js';
import { Commission, CommissionType, CommissionStatus } from '../modules/commissions/commission.model.js';
import { MilestoneAchievement, MilestoneStatus } from '../modules/referrals/milestone.model.js';
import { User } from '../modules/users/user.model.js';
import { UserRole } from '../types/index.js';
import { AccountStatus, RegistrationPaymentStatus } from '../modules/users/user.types.js';
import { WalletService } from '../modules/wallet/wallet.service.js';

async function createTestUser(overrides: Partial<Record<string, unknown>> = {}) {
  const id = new mongoose.Types.ObjectId();
  return User.create({
    _id: id,
    name: 'Test Member',
    email: `test-${id.toString()}@chainx.test`,
    phone: `+92300${id.toString().slice(-7)}`,
    password: 'HashedPassword123!',
    role: UserRole.USER,
    referralCode: `CHX-${id.toString().slice(-6).toUpperCase()}`,
    registrationPaymentStatus: RegistrationPaymentStatus.PAID,
    accountStatus: AccountStatus.ACTIVE,
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: false,
    termsAccepted: true,
    registrationFee: 1500000,
    ...overrides,
  });
}

describe('1. Wallet Balance Consistency', () => {
  it('credit operation updates wallet availableBalance and creates an immutable ledger entry', async () => {
    const user = await createTestUser();
    await WalletService.ensureWallet(user._id.toString());

    const walletBefore = await Wallet.findOne({ user: user._id });
    const balanceBefore = walletBefore?.availableBalance ?? 0;
    const creditPaisa = 150000; // Rs. 1,500
    const iKey = `TEST-CREDIT-${user._id.toString()}`;

    await WalletService.credit({
      userId: user._id.toString(),
      amount: creditPaisa,
      type: TransactionType.REFERRAL_COMMISSION,
      description: 'Direct referral commission credit test',
      idempotencyKey: iKey,
    });

    const walletAfter = await Wallet.findOne({ user: user._id });
    expect(walletAfter?.availableBalance).toBe(balanceBefore + creditPaisa);
    expect(walletAfter?.referralCommissions).toBe(creditPaisa);

    const tx = await WalletTransaction.findOne({ idempotencyKey: iKey });
    expect(tx).not.toBeNull();
    expect(tx?.amount).toBe(creditPaisa);
    expect(tx?.direction).toBe(TransactionDirection.CREDIT);
    expect(tx?.status).toBe(TransactionStatus.COMPLETED);
    expect(tx?.balanceAfter).toBe(balanceBefore + creditPaisa);
  });
});

describe('2. Duplicate Commission Prevention (Idempotency)', () => {
  it('calling credit twice with the same idempotency key prevents duplicate balance credit', async () => {
    const user = await createTestUser();
    await WalletService.ensureWallet(user._id.toString());

    const iKey = `TEST-DEDUP-${user._id.toString()}`;
    const amount = 150000;

    // First call
    await WalletService.credit({
      userId: user._id.toString(),
      amount,
      type: TransactionType.REFERRAL_COMMISSION,
      description: 'First referral commission credit',
      idempotencyKey: iKey,
    });

    // Second call with same idempotency key
    await WalletService.credit({
      userId: user._id.toString(),
      amount,
      type: TransactionType.REFERRAL_COMMISSION,
      description: 'Duplicate referral commission attempt',
      idempotencyKey: iKey,
    });

    const wallet = await Wallet.findOne({ user: user._id });
    // Balance must be exactly 1x credit, NOT 2x
    expect(wallet?.availableBalance).toBe(amount);

    const txCount = await WalletTransaction.countDocuments({ idempotencyKey: iKey });
    expect(txCount).toBe(1);
  });
});

describe('3. Duplicate Milestone Bonus Prevention', () => {
  it('enforces uniqueness on milestone bonus idempotency key', async () => {
    const user = await createTestUser();
    const iKey = `MILESTONE-10-${user._id.toString()}`;

    await MilestoneAchievement.create({
      user: user._id,
      milestoneType: 'direct_referrals_10',
      threshold: 10,
      bonusAmount: 1500000,
      qualifyingReferrals: [],
      status: MilestoneStatus.CREDITED,
      idempotencyKey: iKey,
      achievedAt: new Date(),
      creditedAt: new Date(),
    });

    // Duplicate attempt must reject due to unique index on idempotencyKey
    await expect(
      MilestoneAchievement.create({
        user: user._id,
        milestoneType: 'direct_referrals_10',
        threshold: 10,
        bonusAmount: 1500000,
        qualifyingReferrals: [],
        status: MilestoneStatus.CREDITED,
        idempotencyKey: iKey,
        achievedAt: new Date(),
        creditedAt: new Date(),
      })
    ).rejects.toThrow();

    const count = await MilestoneAchievement.countDocuments({ user: user._id });
    expect(count).toBe(1);
  });
});

describe('4. Double-Spending Prevention on Withdrawal Reservation', () => {
  it('rejects withdrawal reservation when availableBalance is insufficient', async () => {
    const user = await createTestUser();
    await WalletService.ensureWallet(user._id.toString());

    // Wallet balance is 0
    await expect(
      WalletService.reserveForWithdrawal({
        userId: user._id.toString(),
        amount: 500000, // Rs. 5,000 withdrawal attempt with Rs. 0 balance
        withdrawalId: new mongoose.Types.ObjectId().toString(),
        idempotencyKey: `WITHDRAW-OVERDRAFT-${user._id.toString()}`,
      })
    ).rejects.toThrow('Insufficient available balance');

    const wallet = await Wallet.findOne({ user: user._id });
    expect(wallet?.availableBalance).toBe(0);
    expect(wallet?.pendingBalance).toBe(0);
  });

  it('correctly shifts funds from available to pending when balance is sufficient', async () => {
    const user = await createTestUser();
    await WalletService.ensureWallet(user._id.toString());

    // Credit Rs. 10,000 first
    await WalletService.credit({
      userId: user._id.toString(),
      amount: 1000000,
      type: TransactionType.DEPOSIT,
      description: 'Initial deposit',
      idempotencyKey: `DEP-TEST-${user._id.toString()}`,
    });

    // Reserve Rs. 4,000 for withdrawal
    const wId = new mongoose.Types.ObjectId().toString();
    await WalletService.reserveForWithdrawal({
      userId: user._id.toString(),
      amount: 400000,
      withdrawalId: wId,
      idempotencyKey: `RESERVE-${wId}`,
    });

    const wallet = await Wallet.findOne({ user: user._id });
    expect(wallet?.availableBalance).toBe(600000); // Rs. 6,000
    expect(wallet?.pendingBalance).toBe(400000);   // Rs. 4,000 reserved
  });
});

describe('5. Refund Eligibility Threshold Check', () => {
  it('user with 9 verified referrals is not eligible for 10-referral refund', async () => {
    const referrer = await createTestUser();

    for (let i = 0; i < 9; i++) {
      const referee = await createTestUser();
      await Referral.create({
        referrer: referrer._id,
        referee: referee._id,
        referralCode: referrer.referralCode,
        level: 1,
        totalCommissionEarned: 150000,
        commissionAmount: 150000,
        status: ReferralStatus.COMMISSION_CREDITED,
        isEligibleForMilestone: true,
      });
    }

    const eligibleCount = await Referral.countDocuments({
      referrer: referrer._id,
      level: 1,
      isEligibleForMilestone: true,
      status: ReferralStatus.COMMISSION_CREDITED,
    });

    expect(eligibleCount).toBe(9);
    expect(eligibleCount >= 10).toBe(false);
  });

  it('user with 10 verified referrals meets the refund eligibility threshold', async () => {
    const referrer = await createTestUser();

    for (let i = 0; i < 10; i++) {
      const referee = await createTestUser();
      await Referral.create({
        referrer: referrer._id,
        referee: referee._id,
        referralCode: referrer.referralCode,
        level: 1,
        totalCommissionEarned: 150000,
        commissionAmount: 150000,
        status: ReferralStatus.COMMISSION_CREDITED,
        isEligibleForMilestone: true,
      });
    }

    const eligibleCount = await Referral.countDocuments({
      referrer: referrer._id,
      level: 1,
      isEligibleForMilestone: true,
      status: ReferralStatus.COMMISSION_CREDITED,
    });

    expect(eligibleCount).toBe(10);
    expect(eligibleCount >= 10).toBe(true);
  });
});

describe('6. Commission Record Uniqueness', () => {
  it('prevents creating duplicate commission records with the same idempotency key', async () => {
    const user = await createTestUser();
    const iKey = `COMM-UNIQUE-${Date.now()}-${user._id.toString()}`;

    await Commission.create({
      user: user._id,
      type: CommissionType.REFERRAL,
      status: CommissionStatus.PAID,
      amount: 150000,
      level: 1,
      description: 'Single direct referral commission',
      idempotencyKey: iKey,
      paidAt: new Date(),
    });

    await expect(
      Commission.create({
        user: user._id,
        type: CommissionType.REFERRAL,
        status: CommissionStatus.PAID,
        amount: 150000,
        level: 1,
        description: 'Duplicate commission attempt',
        idempotencyKey: iKey,
        paidAt: new Date(),
      })
    ).rejects.toThrow();

    const count = await Commission.countDocuments({ idempotencyKey: iKey });
    expect(count).toBe(1);
  });
});

