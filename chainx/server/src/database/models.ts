// ─── Re-export all models from a single entry point ───────────────────────────
// This ensures all models are registered with Mongoose before any queries run.

export { User } from '../modules/users/user.model.js';
export { Session } from '../modules/users/session.model.js';
export { AccountStatus, RegistrationPaymentStatus } from '../modules/users/user.types.js';
export { Product, ProductStatus } from '../modules/products/product.model.js';
export { Order, OrderStatus } from '../modules/products/order.model.js';
export { Referral, ReferralStatus } from '../modules/referrals/referral.model.js';
export { Wallet } from '../modules/wallet/wallet.model.js';
export {
  WalletTransaction,
  TransactionType,
  TransactionStatus,
} from '../modules/transactions/walletTransaction.model.js';
export { Deposit, DepositStatus, PaymentMethod } from '../modules/deposits/deposit.model.js';
export { Withdrawal, WithdrawalStatus } from '../modules/withdrawals/withdrawal.model.js';
export {
  Commission,
  CommissionType,
  CommissionStatus,
} from '../modules/commissions/commission.model.js';
export { Refund, RefundStatus } from '../modules/refunds/refund.model.js';
export { Task, TaskType, TaskStatus } from '../modules/tasks/task.model.js';
export { TaskSubmission, TaskSubmissionStatus } from '../modules/tasks/taskSubmission.model.js';
export { Notification, NotificationType } from '../modules/notifications/notification.model.js';
export {
  Announcement,
  AnnouncementStatus,
  AnnouncementPriority,
} from '../modules/announcements/announcement.model.js';
export { AuditLog, AuditAction } from '../modules/admin/auditLog.model.js';
export {
  Payment,
  PaymentStatus,
  PaymentGateway,
  PaymentMode,
} from '../modules/transactions/payment.model.js';
export { IdempotencyRecord } from '../modules/transactions/idempotencyRecord.model.js';
