import { User } from '../users/user.model.js';
import { Order } from '../products/order.model.js';
import { RegistrationPayment } from '../transactions/registrationPayment.model.js';
import { Deposit } from '../deposits/deposit.model.js';
import { Withdrawal } from '../withdrawals/withdrawal.model.js';
import { Commission } from '../commissions/commission.model.js';
import { RegistrationRefund } from '../referrals/registrationRefund.model.js';
import { Task } from '../tasks/task.model.js';
import { WalletTransaction } from '../transactions/walletTransaction.model.js';

export class AdminReportsService {
  private static escapeCsvCell(val: unknown): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  public static async generateCsvReport(type: string, startDate?: string, endDate?: string): Promise<{ filename: string; csv: string }> {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const filter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    let headers: string[] = [];
    const rows: string[][] = [];
    const timestampStr = new Date().toISOString().slice(0, 10);
    let filename = `chainx-${type}-report-${timestampStr}.csv`;

    switch (type) {
      case 'users': {
        headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Account Status', 'Reg Payment Status', 'Referral Code', 'Created At'];
        const users = await User.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
        for (const u of users) {
          rows.push([
            u._id.toString(),
            u.name,
            u.email,
            u.phone,
            u.role,
            u.accountStatus,
            u.registrationPaymentStatus,
            u.referralCode,
            new Date(u.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'orders': {
        headers = ['Order ID', 'User', 'Product', 'Status', 'Total (PKR)', 'Quantity', 'Created At'];
        const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const o of orders) {
          rows.push([
            o._id.toString(),
            (o.user as any)?.name || 'N/A',
            o.productSnapshot?.name || 'N/A',
            o.status,
            (o.totalAmount / 100).toFixed(2),
            String(o.quantity || 1),
            new Date(o.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'registration-payments': {
        headers = ['Payment ID', 'User', 'Method', 'Reference', 'Amount (PKR)', 'Status', 'Verification', 'Created At'];
        const regs = await RegistrationPayment.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const r of regs) {
          rows.push([
            r._id.toString(),
            (r.user as any)?.name || 'N/A',
            r.paymentMethod,
            r.paymentReference || '',
            (r.amount / 100).toFixed(2),
            r.paymentStatus,
            r.verificationStatus,
            new Date(r.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'deposits': {
        headers = ['Deposit ID', 'User', 'Method', 'TRX Reference', 'Amount (PKR)', 'Status', 'Created At'];
        const deposits = await Deposit.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const d of deposits) {
          rows.push([
            d._id.toString(),
            (d.user as any)?.name || 'N/A',
            d.paymentMethod,
            d.paymentReference || '',
            (d.amount / 100).toFixed(2),
            d.status,
            new Date(d.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'withdrawals': {
        headers = ['Withdrawal ID', 'User', 'Method', 'Account Title', 'Account Number', 'Amount (PKR)', 'Status', 'Gateway TID', 'Created At'];
        const withdrawals = await Withdrawal.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const w of withdrawals) {
          rows.push([
            w._id.toString(),
            (w.user as any)?.name || 'N/A',
            w.paymentMethod,
            w.accountTitle,
            w.accountNumber,
            (w.amount / 100).toFixed(2),
            w.status,
            w.gatewayTransactionId || '',
            new Date(w.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'commissions': {
        headers = ['Commission ID', 'User', 'Type', 'Amount (PKR)', 'Status', 'Description', 'Created At'];
        const comms = await Commission.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const c of comms) {
          rows.push([
            c._id.toString(),
            (c.user as any)?.name || 'N/A',
            c.type,
            (c.amount / 100).toFixed(2),
            c.status,
            c.description,
            new Date(c.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'refunds': {
        headers = ['Refund ID', 'User', 'Fee Amount (PKR)', 'Payout Method', 'Status', 'Reference', 'Created At'];
        const refunds = await RegistrationRefund.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(5000).lean();
        for (const rf of refunds) {
          rows.push([
            rf._id.toString(),
            (rf.user as any)?.name || 'N/A',
            (rf.feeAmount / 100).toFixed(2),
            rf.payoutMethod,
            rf.status,
            rf.transactionReference || '',
            new Date(rf.createdAt).toISOString(),
          ]);
        }
        break;
      }

      case 'tasks': {
        headers = ['Task ID', 'Title', 'Category', 'Reward (PKR)', 'Total Budget', 'Remaining Budget', 'Completions', 'Status'];
        const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
        for (const t of tasks) {
          rows.push([
            t._id.toString(),
            t.title,
            t.category,
            (t.rewardAmount / 100).toFixed(2),
            (t.totalBudget / 100).toFixed(2),
            (t.remainingBudget / 100).toFixed(2),
            String(t.completionsCount),
            t.status,
          ]);
        }
        break;
      }

      case 'ledger':
      default: {
        filename = `chainx-financial-ledger-${timestampStr}.csv`;
        headers = ['Tx ID', 'Timestamp', 'User', 'Type', 'Direction', 'Amount (PKR)', 'Balance Before', 'Balance After', 'Description', 'Status'];
        const txs = await WalletTransaction.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(10000).lean();
        for (const tx of txs) {
          rows.push([
            tx._id.toString(),
            new Date(tx.createdAt).toISOString(),
            (tx.user as any)?.name || 'N/A',
            tx.type,
            tx.direction,
            (tx.amount / 100).toFixed(2),
            (tx.balanceBefore / 100).toFixed(2),
            (tx.balanceAfter / 100).toFixed(2),
            tx.description,
            tx.status,
          ]);
        }
        break;
      }
    }

    const csvContent = [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map((r) => r.map(this.escapeCsvCell).join(',')),
    ].join('\r\n');

    return { filename, csv: csvContent };
  }
}
