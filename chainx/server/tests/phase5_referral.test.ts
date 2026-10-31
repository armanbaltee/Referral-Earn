import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/modules/users/user.model.js';
import { AccountStatus, RegistrationPaymentStatus } from '../src/modules/users/user.types.js';
import { Referral, ReferralStatus } from '../src/modules/referrals/referral.model.js';
import { MilestoneAchievement, MilestoneStatus } from '../src/modules/referrals/milestone.model.js';
import { RegistrationRefund, RefundStatus, RefundPayoutMethod } from '../src/modules/referrals/registrationRefund.model.js';
import { Wallet } from '../src/modules/wallet/wallet.model.js';
import { WalletTransaction, TransactionType, TransactionStatus } from '../src/modules/transactions/walletTransaction.model.js';
import { Commission, CommissionType } from '../src/modules/commissions/commission.model.js';
import { ReferralService } from '../src/modules/referrals/referral.service.js';
import { SystemSettingService } from '../src/modules/admin/systemSetting.service.js';

describe('PHASE 5: Direct Referral System, Commissions & Milestone Bonus', () => {
  let referrerUser: any;
  let adminUser: any;

  beforeAll(async () => {
    await connectDatabase();
    // Clean test collection
    await Promise.all([
      User.deleteMany({ email: /@phase5test\.com/ }),
      Referral.deleteMany({}),
      MilestoneAchievement.deleteMany({}),
      RegistrationRefund.deleteMany({}),
      Wallet.deleteMany({}),
      WalletTransaction.deleteMany({}),
      Commission.deleteMany({}),
    ]);

    // Create active referrer user who has paid their own registration fee
    referrerUser = await User.create({
      name: 'Referrer Lead',
      email: 'referrer@phase5test.com',
      phone: '+923000000001',
      password: 'Password123!',
      referralCode: 'TESTREF001',
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
      registrationFee: 1500000,
    });

    // Create Admin user
    adminUser = await User.create({
      name: 'Admin Tester',
      email: 'admin@phase5test.com',
      phone: '+923000000002',
      password: 'Password123!',
      referralCode: 'ADMINREF01',
      accountStatus: AccountStatus.ACTIVE,
      role: 'admin',
      isActive: true,
    });

    // Create wallet for referrer
    await Wallet.create({ user: referrerUser._id, balance: 0, totalCommissionEarned: 0 });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: /@phase5test\.com/ }),
      Referral.deleteMany({}),
      MilestoneAchievement.deleteMany({}),
      RegistrationRefund.deleteMany({}),
      Wallet.deleteMany({}),
      WalletTransaction.deleteMany({}),
      Commission.deleteMany({}),
    ]);
    await disconnectDatabase();
  });

  it('1. Rejects anti-fraud self-referrals', async () => {
    const selfReferral = await Referral.create({
      referrer: referrerUser._id,
      referee: referrerUser._id,
      referralCode: referrerUser.referralCode,
      status: ReferralStatus.PAYMENT_PENDING,
      level: 1,
    });

    await ReferralService.evaluateAndAdvanceReferralLifecycle(referrerUser._id.toString());
    const reloaded = await Referral.findById(selfReferral._id);

    expect(reloaded?.status).toBe(ReferralStatus.REJECTED);
    expect(reloaded?.isEligibleForMilestone).toBe(false);
  });

  it('2. Keeps unpaid referrals as fee pending and does not credit commission', async () => {
    const unpaidReferee = await User.create({
      name: 'Unpaid User',
      email: 'unpaid@phase5test.com',
      phone: '+923000000003',
      password: 'Password123!',
      referralCode: 'UNPAID01',
      referredBy: referrerUser._id,
      accountStatus: AccountStatus.PENDING_PAYMENT,
      registrationPaymentStatus: RegistrationPaymentStatus.UNPAID,
      isActive: false,
    });

    const referral = await Referral.create({
      referrer: referrerUser._id,
      referee: unpaidReferee._id,
      referralCode: referrerUser.referralCode,
      status: ReferralStatus.PAYMENT_PENDING,
      level: 1,
      totalCommissionEarned: 0,
    });

    await ReferralService.evaluateAndAdvanceReferralLifecycle(unpaidReferee._id.toString());
    const reloaded = await Referral.findById(referral._id);

    expect(reloaded?.status).toBe(ReferralStatus.PAYMENT_PENDING);
    expect(reloaded?.isEligibleForMilestone).toBe(false);

    const wallet = await Wallet.findOne({ user: referrerUser._id });
    expect(wallet?.balance).toBe(0);
  });

  it('3. Advances paid and verified referee to COMMISSION_CREDITED (Rs. 1,500) and updates wallet balance', async () => {
    const paidReferee = await User.create({
      name: 'Paid Referee 1',
      email: 'paid1@phase5test.com',
      phone: '+923000000004',
      password: 'Password123!',
      referralCode: 'PAIDREF01',
      referredBy: referrerUser._id,
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
    });

    const referral = await Referral.create({
      referrer: referrerUser._id,
      referee: paidReferee._id,
      referralCode: referrerUser.referralCode,
      status: ReferralStatus.PAYMENT_PENDING,
      level: 1,
      totalCommissionEarned: 0,
    });

    await ReferralService.evaluateAndAdvanceReferralLifecycle(paidReferee._id.toString());

    const reloaded = await Referral.findById(referral._id);
    expect(reloaded?.status).toBe(ReferralStatus.COMMISSION_CREDITED);
    expect(reloaded?.isEligibleForMilestone).toBe(true);
    expect(reloaded?.commissionAmount).toBe(150000); // Rs. 1,500

    const wallet = await Wallet.findOne({ user: referrerUser._id });
    expect(wallet?.balance).toBe(150000); // Rs. 1,500
    expect(wallet?.totalCommissionEarned).toBe(150000);

    // Verify Commission record created
    const comm = await Commission.findOne({ referral: referral._id });
    expect(comm).toBeDefined();
    expect(comm?.amount).toBe(150000);
    expect(comm?.type).toBe(CommissionType.REFERRAL);

    // Verify WalletTransaction created
    const tx = await WalletTransaction.findOne({ referenceId: referral._id.toString() });
    expect(tx).toBeDefined();
    expect(tx?.amount).toBe(150000);
    expect(tx?.type).toBe(TransactionType.COMMISSION);
    expect(tx?.status).toBe(TransactionStatus.COMPLETED);
  });

  it('4. Duplicate processing idempotency: running lifecycle repeatedly does NOT double credit commission', async () => {
    const paidReferee = await User.findOne({ email: 'paid1@phase5test.com' });
    const initialWallet = await Wallet.findOne({ user: referrerUser._id });

    // Call advance lifecycle second time
    await ReferralService.evaluateAndAdvanceReferralLifecycle(paidReferee!._id.toString());

    const walletAfter = await Wallet.findOne({ user: referrerUser._id });
    expect(walletAfter?.balance).toBe(initialWallet?.balance);
    expect(walletAfter?.totalCommissionEarned).toBe(initialWallet?.totalCommissionEarned);

    const commCount = await Commission.countDocuments({ user: referrerUser._id, type: CommissionType.REFERRAL });
    expect(commCount).toBe(1);
  });

  it('5. Nine referrals: awards 9 x Rs. 1,500 = Rs. 13,500, but does NOT award milestone bonus', async () => {
    // Add 8 more paid referrals (total = 1 + 8 = 9)
    for (let i = 2; i <= 9; i++) {
      const referee = await User.create({
        name: `Paid Referee ${i}`,
        email: `paid${i}@phase5test.com`,
        phone: `+92300000000${i + 4}`,
        password: 'Password123!',
        referralCode: `PAIDREF0${i}`,
        referredBy: referrerUser._id,
        accountStatus: AccountStatus.ACTIVE,
        registrationPaymentStatus: RegistrationPaymentStatus.PAID,
        isActive: true,
      });

      await Referral.create({
        referrer: referrerUser._id,
        referee: referee._id,
        referralCode: referrerUser.referralCode,
        status: ReferralStatus.PAYMENT_PENDING,
        level: 1,
        totalCommissionEarned: 0,
      });

      await ReferralService.evaluateAndAdvanceReferralLifecycle(referee._id.toString());
    }

    const wallet = await Wallet.findOne({ user: referrerUser._id });
    // 9 * 1500 = Rs. 13,500 (1,350,000 paisa)
    expect(wallet?.balance).toBe(1350000);

    // Milestone must NOT exist yet
    const milestone = await MilestoneAchievement.findOne({ user: referrerUser._id });
    expect(milestone).toBeNull();

    // Refund must NOT be eligible yet
    const refund = await RegistrationRefund.findOne({ user: referrerUser._id });
    expect(refund?.status).not.toBe(RefundStatus.ELIGIBLE);
  });

  it('6. Ten referrals: triggers Rs. 15,000 Milestone Bonus (Total Rs. 30,000) and marks refund eligible', async () => {
    // Add 10th paid referee
    const referee10 = await User.create({
      name: 'Paid Referee 10',
      email: 'paid10@phase5test.com',
      phone: '+923000000015',
      password: 'Password123!',
      referralCode: 'PAIDREF010',
      referredBy: referrerUser._id,
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
    });

    await Referral.create({
      referrer: referrerUser._id,
      referee: referee10._id,
      referralCode: referrerUser.referralCode,
      status: ReferralStatus.PAYMENT_PENDING,
      level: 1,
      totalCommissionEarned: 0,
    });

    await ReferralService.evaluateAndAdvanceReferralLifecycle(referee10._id.toString());

    // Referrer should now have:
    // 10 direct commissions: 10 * Rs. 1,500 = Rs. 15,000
    // + 1 milestone bonus: Rs. 15,000
    // Total = Rs. 30,000 (3,000,000 paisa)
    const wallet = await Wallet.findOne({ user: referrerUser._id });
    expect(wallet?.balance).toBe(3000000);
    expect(wallet?.totalCommissionEarned).toBe(3000000);

    // Verify MilestoneAchievement record created
    const milestone = await MilestoneAchievement.findOne({ user: referrerUser._id });
    expect(milestone).toBeDefined();
    expect(milestone?.threshold).toBe(10);
    expect(milestone?.bonusAmount).toBe(1500000);
    expect(milestone?.status).toBe(MilestoneStatus.CREDITED);
    expect(milestone?.qualifyingReferrals.length).toBe(10);

    // Verify milestone bonus Commission record
    const bonusComm = await Commission.findOne({
      user: referrerUser._id,
      type: CommissionType.MILESTONE_BONUS,
    });
    expect(bonusComm).toBeDefined();
    expect(bonusComm?.amount).toBe(1500000);

    // Verify refund eligibility marked as ELIGIBLE
    const refund = await RegistrationRefund.findOne({ user: referrerUser._id });
    expect(refund).toBeDefined();
    expect(refund?.status).toBe(RefundStatus.ELIGIBLE);
    expect(refund?.qualifyingReferralsCount).toBe(10);
  });

  it('7. Milestone bonus issued exactly once even when an 11th referral is added', async () => {
    const referee11 = await User.create({
      name: 'Paid Referee 11',
      email: 'paid11@phase5test.com',
      phone: '+923000000016',
      password: 'Password123!',
      referralCode: 'PAIDREF011',
      referredBy: referrerUser._id,
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
    });

    await Referral.create({
      referrer: referrerUser._id,
      referee: referee11._id,
      referralCode: referrerUser.referralCode,
      status: ReferralStatus.PAYMENT_PENDING,
      level: 1,
      totalCommissionEarned: 0,
    });

    await ReferralService.evaluateAndAdvanceReferralLifecycle(referee11._id.toString());

    // 11th lead earns Rs. 1,500 direct commission
    // Balance: Rs. 30,000 + Rs. 1,500 = Rs. 31,500 (3,150,000 paisa)
    const wallet = await Wallet.findOne({ user: referrerUser._id });
    expect(wallet?.balance).toBe(3150000);

    // Milestone record count must STILL be exactly 1!
    const milestoneCount = await MilestoneAchievement.countDocuments({ user: referrerUser._id });
    expect(milestoneCount).toBe(1);
  });

  it('8. Separate refund claim: user requests refund, admin approves, funds credited as REFUND without counting as commission earnings', async () => {
    // User claims refund via wallet_credit
    const refundClaim = await ReferralService.requestRegistrationFeeRefund(
      referrerUser._id.toString(),
      RefundPayoutMethod.WALLET_CREDIT
    );

    expect(refundClaim.status).toBe(RefundStatus.REQUESTED);

    const balanceBeforeAdmin = (await Wallet.findOne({ user: referrerUser._id }))!.balance;
    const commissionBeforeAdmin = (await Wallet.findOne({ user: referrerUser._id }))!.totalCommissionEarned;

    // Admin approves refund
    const approvedRefund = await ReferralService.adminProcessRefund(
      refundClaim._id.toString(),
      adminUser._id.toString(),
      'approve',
      'Verified 10 qualifying leads.'
    );

    expect(approvedRefund.status).toBe(RefundStatus.COMPLETED);
    expect(approvedRefund.paidAt).toBeDefined();

    const walletAfterRefund = await Wallet.findOne({ user: referrerUser._id });
    // Balance increases by Rs. 15,000 (1,500,000 paisa)
    expect(walletAfterRefund?.balance).toBe(balanceBeforeAdmin + 1500000);

    // CRITICAL SPEC REQUIREMENT:
    // "Never count the user's own registration payment as earnings."
    expect(walletAfterRefund?.totalCommissionEarned).toBe(commissionBeforeAdmin);

    // Verify separate REFUND transaction
    const refundTx = await WalletTransaction.findOne({
      user: referrerUser._id,
      type: TransactionType.REFUND,
    });
    expect(refundTx).toBeDefined();
    expect(refundTx?.amount).toBe(1500000);
  });

  it('9. Admin Reversal: reversing a referral lead debits Rs. 1,500 from referrer wallet and records REVERSAL', async () => {
    // Find referral for referee 11
    const ref11User = await User.findOne({ email: 'paid11@phase5test.com' });
    const ref11 = await Referral.findOne({ referee: ref11User!._id });

    const balanceBeforeReversal = (await Wallet.findOne({ user: referrerUser._id }))!.balance;

    const reversed = await ReferralService.adminReverseReferral(
      ref11!._id.toString(),
      adminUser._id.toString(),
      'Chargeback on payment'
    );

    expect(reversed.status).toBe(ReferralStatus.REVERSED);
    expect(reversed.reversalReason).toBe('Chargeback on payment');
    expect(reversed.isEligibleForMilestone).toBe(false);

    const walletAfterReversal = await Wallet.findOne({ user: referrerUser._id });
    // Debited by Rs. 1,500
    expect(walletAfterReversal?.balance).toBe(balanceBeforeReversal - 150000);

    // Reversal transaction recorded
    const reversalTx = await WalletTransaction.findOne({
      referenceId: ref11!._id.toString(),
      type: TransactionType.REVERSAL,
    });
    expect(reversalTx).toBeDefined();
    expect(reversalTx?.amount).toBe(150000);
  });
});
