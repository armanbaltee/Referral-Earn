import { User } from '../users/user.model.js';
import { AccountStatus } from '../users/user.types.js';
import { Order, OrderStatus } from '../products/order.model.js';
import { RegistrationPayment, RegPaymentStatus } from '../transactions/registrationPayment.model.js';
import { Deposit, DepositStatus } from '../deposits/deposit.model.js';
import { Withdrawal, WithdrawalStatus } from '../withdrawals/withdrawal.model.js';
import { Commission, CommissionType } from '../commissions/commission.model.js';
import { RegistrationRefund, RefundStatus } from '../referrals/registrationRefund.model.js';
import { Task, TaskStatus } from '../tasks/task.model.js';
import { TaskSubmission, TaskSubmissionStatus } from '../tasks/taskSubmission.model.js';
import { AuditLog } from './auditLog.model.js';
import { WalletTransaction, TransactionType, TransactionStatus } from '../transactions/walletTransaction.model.js';

export class AdminOverviewService {
  public static async getDashboardMetrics() {
    const [
      userCounts,
      orderStats,
      regPaymentStats,
      depositStats,
      withdrawalStats,
      commissionStats,
      milestoneBonusStats,
      refundStats,
      taskStats,
      taskSubStats,
      recentAuditLogs,
    ] = await Promise.all([
      // 1. User metrics
      User.aggregate([
        {
          $group: {
            _id: '$accountStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Product orders
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),

      // 3. Registration payments (verified)
      RegistrationPayment.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 4. Deposits
      Deposit.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 5. Withdrawals
      Withdrawal.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 6. Direct Referral Commissions
      Commission.aggregate([
        { $match: { type: CommissionType.REFERRAL } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 7. Milestone Bonuses
      Commission.aggregate([
        { $match: { type: CommissionType.MILESTONE_BONUS } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // 8. 10-Referral Fee Refunds
      RegistrationRefund.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$feeAmount' },
          },
        },
      ]),

      // 9. Tasks
      Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalBudget: { $sum: '$totalBudget' },
            rewardsPaid: { $sum: '$approvedRewardAmount' },
          },
        },
      ]),

      // 10. Task submissions
      TaskSubmission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRewards: { $sum: '$rewardAmount' },
          },
        },
      ]),

      // 11. Recent audit logs
      AuditLog.find()
        .populate('actor', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Parse User counts
    let totalUsers = 0;
    let activeUsers = 0;
    let pendingUsers = 0;
    let suspendedUsers = 0;
    for (const u of userCounts) {
      totalUsers += u.count;
      if (u._id === AccountStatus.ACTIVE) activeUsers = u.count;
      else if (u._id === AccountStatus.PENDING_PAYMENT || u._id === AccountStatus.PENDING_VERIFICATION) {
        pendingUsers += u.count;
      } else if (u._id === AccountStatus.SUSPENDED) {
        suspendedUsers = u.count;
      }
    }

    // Product Sales
    const completedOrders = orderStats.find((o) => o._id === OrderStatus.COMPLETED || o._id === OrderStatus.DELIVERED);
    const totalProductSalesPaisa = completedOrders?.totalAmount || 0;
    const totalOrdersCount = orderStats.reduce((acc, curr) => acc + curr.count, 0);

    // Verified Reg Payments
    const verifiedReg = regPaymentStats.find((r) => r._id === RegPaymentStatus.SUCCESS);
    const verifiedRegistrationPaymentsPaisa = verifiedReg?.totalAmount || 0;

    // Deposits
    const pendingDeposits = depositStats.find((d) => d._id === DepositStatus.PENDING);
    const approvedDeposits = depositStats.find((d) => d._id === DepositStatus.COMPLETED);

    // Withdrawals
    const pendingWithdrawals = withdrawalStats.find((w) => w._id === WithdrawalStatus.PENDING || w._id === WithdrawalStatus.APPROVED);
    const completedWithdrawals = withdrawalStats.find((w) => w._id === WithdrawalStatus.COMPLETED);

    // Commissions & Bonuses
    const approvedCommissions = commissionStats.find((c) => c._id === 'paid');
    const approvedBonuses = milestoneBonusStats.find((b) => b._id === 'paid');

    // Refunds
    const pendingRefunds = refundStats.find((rf) => rf._id === RefundStatus.REQUESTED || rf._id === RefundStatus.UNDER_REVIEW);

    // Tasks
    const activeTasks = taskStats.find((t) => t._id === TaskStatus.PUBLISHED);
    const pendingTaskSubs = taskSubStats.find((s) => s._id === TaskSubmissionStatus.PENDING);

    // ─── Monthly Financial Flow Trends (Past 6 Months) ──────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyFlowAgg = await WalletTransaction.aggregate([
      {
        $match: {
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type',
          },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    // Build monthly data array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyFlowMap: Record<string, { month: string; deposits: number; withdrawals: number; commissions: number }> = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyFlowMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`,
        deposits: 0,
        withdrawals: 0,
        commissions: 0,
      };
    }

    for (const row of monthlyFlowAgg) {
      const key = `${row._id.year}-${row._id.month}`;
      if (monthlyFlowMap[key]) {
        const amountPKR = Math.round(row.totalAmount / 100);
        if (row._id.type === TransactionType.DEPOSIT) {
          monthlyFlowMap[key]!.deposits += amountPKR;
        } else if (row._id.type === TransactionType.WITHDRAWAL) {
          monthlyFlowMap[key]!.withdrawals += amountPKR;
        } else if (
          row._id.type === TransactionType.REFERRAL_COMMISSION ||
          row._id.type === TransactionType.REFERRAL_BONUS ||
          row._id.type === TransactionType.TASK_REWARD
        ) {
          monthlyFlowMap[key]!.commissions += amountPKR;
        }
      }
    }

    const platformChart = Object.values(monthlyFlowMap);

    // ─── Pending Action Items for Immediate Attention ────────────────────────
    const [pendingWithdrawalDocs, pendingDepositDocs, pendingRefundDocs, pendingTaskSubDocs] = await Promise.all([
      Withdrawal.find({ status: WithdrawalStatus.PENDING })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Deposit.find({ status: DepositStatus.PENDING })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      RegistrationRefund.find({ status: { $in: [RefundStatus.REQUESTED, RefundStatus.UNDER_REVIEW] } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      TaskSubmission.find({ status: TaskSubmissionStatus.PENDING })
        .populate('task', 'title')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    const pendingActions = [
      ...pendingWithdrawalDocs.map((w: any) => ({
        id: w._id.toString(),
        type: 'Withdrawal Payout',
        user: `${w.user?.name || 'User'} (${w.user?.email || ''})`,
        amount: `Rs. ${(w.amount / 100).toLocaleString()}`,
        method: `${w.paymentMethod.toUpperCase()} (${w.accountNumber})`,
        time: w.createdAt,
        link: '/admin/withdrawals',
      })),
      ...pendingDepositDocs.map((d: any) => ({
        id: d._id.toString(),
        type: 'Deposit Review',
        user: `${d.user?.name || 'User'} (${d.user?.email || ''})`,
        amount: `Rs. ${(d.amount / 100).toLocaleString()}`,
        method: `${d.paymentMethod.toUpperCase()} (Ref: ${d.paymentReference})`,
        time: d.createdAt,
        link: '/admin/deposits',
      })),
      ...pendingRefundDocs.map((rf: any) => ({
        id: rf._id.toString(),
        type: 'Fee Refund Claim',
        user: `${rf.user?.name || 'User'} (${rf.user?.email || ''})`,
        amount: `Rs. ${(rf.feeAmount / 100).toLocaleString()}`,
        method: '10 Referrals Milestone Met',
        time: rf.createdAt,
        link: '/admin/refunds',
      })),
      ...pendingTaskSubDocs.map((ts: any) => ({
        id: ts._id.toString(),
        type: 'Task Proof Review',
        user: `${ts.user?.name || 'User'} (${ts.user?.email || ''})`,
        amount: `Rs. ${(ts.rewardAmount / 100).toLocaleString()}`,
        method: ts.task?.title || 'Daily Task',
        time: ts.createdAt,
        link: '/admin/task-submissions',
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

    return {
      kpis: {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        totalOrdersCount,
        totalProductSalesPaisa,
        verifiedRegistrationPaymentsPaisa,
        totalReferralCommissionsPaisa: approvedCommissions?.totalAmount || 0,
        totalMilestoneBonusesPaisa: approvedBonuses?.totalAmount || 0,
        pendingRefundsCount: pendingRefunds?.count || 0,
        pendingDepositsCount: pendingDeposits?.count || 0,
        pendingDepositsPaisa: pendingDeposits?.totalAmount || 0,
        approvedDepositsPaisa: approvedDeposits?.totalAmount || 0,
        pendingWithdrawalsCount: pendingWithdrawals?.count || 0,
        pendingWithdrawalsPaisa: pendingWithdrawals?.totalAmount || 0,
        completedWithdrawalsPaisa: completedWithdrawals?.totalAmount || 0,
        activeTasksCount: activeTasks?.count || 0,
        pendingTaskSubmissionsCount: pendingTaskSubs?.count || 0,
      },
      platformChart,
      pendingActions,
      recentAuditLogs,
    };
  }
}
