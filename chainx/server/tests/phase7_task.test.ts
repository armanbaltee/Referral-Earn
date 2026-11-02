import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/modules/users/user.model.js';
import { AccountStatus, RegistrationPaymentStatus } from '../src/modules/users/user.types.js';
import { UserRole } from '../src/types/index.js';
import { Task, TaskCategory, TaskStatus, ProofType } from '../src/modules/tasks/task.model.js';
import { TaskSubmission, TaskSubmissionStatus } from '../src/modules/tasks/taskSubmission.model.js';
import { Wallet } from '../src/modules/wallet/wallet.model.js';
import { WalletTransaction, TransactionType, TransactionStatus } from '../src/modules/transactions/walletTransaction.model.js';
import { TaskService } from '../src/modules/tasks/task.service.js';

describe('PHASE 7: Daily Task Management & Reward System', () => {
  let adminUser: any;
  let testUser1: any;
  let testUser2: any;

  beforeAll(async () => {
    await connectDatabase();
    await Promise.all([
      User.deleteMany({ email: /@phase7test\.com/ }),
      Task.deleteMany({}),
      TaskSubmission.deleteMany({}),
      Wallet.deleteMany({}),
      WalletTransaction.deleteMany({}),
    ]);

    adminUser = await User.create({
      name: 'Task Admin',
      email: 'admin@phase7test.com',
      phone: '+923007000001',
      password: 'Password123!',
      role: UserRole.ADMIN,
      referralCode: 'ADMINTASK',
      accountStatus: AccountStatus.ACTIVE,
      isActive: true,
    });

    testUser1 = await User.create({
      name: 'Task Worker 1',
      email: 'worker1@phase7test.com',
      phone: '+923007000002',
      password: 'Password123!',
      role: UserRole.USER,
      referralCode: 'WORKER001',
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
    });

    testUser2 = await User.create({
      name: 'Task Worker 2',
      email: 'worker2@phase7test.com',
      phone: '+923007000003',
      password: 'Password123!',
      role: UserRole.USER,
      referralCode: 'WORKER002',
      accountStatus: AccountStatus.ACTIVE,
      registrationPaymentStatus: RegistrationPaymentStatus.PAID,
      isActive: true,
    });
  }, 60000);

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('1. Admin creates task with budget allocation and published status', async () => {
    const task = await TaskService.createTask(adminUser._id.toString(), {
      title: 'Watch & Like Product Intro Video',
      description: 'Watch the official ChainX product video and like on YouTube.',
      instructions: '1. Watch video for at least 60 seconds.\n2. Like the video.\n3. Take a screenshot showing your like.',
      category: TaskCategory.WATCH_VIDEO,
      rewardAmount: 5000, // Rs. 50 in paisa
      maxParticipants: 10,
      maxCompletionsPerUser: 1,
      requiredProofType: ProofType.SCREENSHOT,
      status: TaskStatus.PUBLISHED,
    });

    expect(task).toBeDefined();
    expect(task.rewardAmount).toBe(5000);
    expect(task.totalBudget).toBe(50000); // 10 * 5000
    expect(task.remainingBudget).toBe(50000);
    expect(task.status).toBe(TaskStatus.PUBLISHED);
    expect(task.completionsCount).toBe(0);
  });

  it('2. User can view available published tasks', async () => {
    const res = await TaskService.getAvailableTasks({ category: TaskCategory.WATCH_VIDEO });
    expect(res.tasks.length).toBeGreaterThanOrEqual(1);
    expect(res.tasks[0]?.category).toBe(TaskCategory.WATCH_VIDEO);
  });

  it('3. User submits completion proof (screenshot URL)', async () => {
    const tasks = await Task.find({ status: TaskStatus.PUBLISHED });
    const task = tasks[0]!;

    const submission = await TaskService.submitTask(testUser1._id.toString(), task._id.toString(), {
      proofType: ProofType.SCREENSHOT,
      proofImageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      notes: 'Watched all 90 seconds and liked!',
    });

    expect(submission).toBeDefined();
    expect(submission.status).toBe(TaskSubmissionStatus.PENDING);
    expect(submission.rewardAmount).toBe(task.rewardAmount);
  });

  it('4. Prevents duplicate submission while pending or exceeding limit', async () => {
    const tasks = await Task.find({ status: TaskStatus.PUBLISHED });
    const task = tasks[0]!;

    await expect(
      TaskService.submitTask(testUser1._id.toString(), task._id.toString(), {
        proofType: ProofType.SCREENSHOT,
        proofImageUrl: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
      })
    ).rejects.toThrow(/already have a submission pending/);
  });

  it('5. Admin approves submission: atomically credits user wallet and debits budget', async () => {
    const pendingSub = await TaskSubmission.findOne({
      user: testUser1._id,
      status: TaskSubmissionStatus.PENDING,
    });
    expect(pendingSub).toBeDefined();

    const approvedSub = await TaskService.approveSubmission(
      pendingSub!._id.toString(),
      adminUser._id.toString()
    );

    expect(approvedSub.status).toBe(TaskSubmissionStatus.APPROVED);
    expect(approvedSub.reviewedBy?.toString()).toBe(adminUser._id.toString());
    expect(approvedSub.walletTransaction).toBeDefined();

    // Verify User Wallet
    const wallet = await Wallet.findOne({ user: testUser1._id });
    expect(wallet).toBeDefined();
    expect(wallet?.availableBalance).toBe(5000); // Rs. 50
    expect(wallet?.taskEarnings).toBe(5000);
    expect(wallet?.totalEarned).toBe(5000);

    // Verify Ledger Entry
    const tx = await WalletTransaction.findOne({
      sourceReference: approvedSub._id.toString(),
      sourceModel: 'TaskSubmission',
    });
    expect(tx).toBeDefined();
    expect(tx?.type).toBe(TransactionType.TASK_REWARD);
    expect(tx?.amount).toBe(5000);
    expect(tx?.status).toBe(TransactionStatus.COMPLETED);

    // Verify Task Budget was decremented
    const task = await Task.findById(approvedSub.task);
    expect(task?.approvedRewardAmount).toBe(5000);
    expect(task?.remainingBudget).toBe(45000); // 50000 - 5000
    expect(task?.completionsCount).toBe(1);
  });

  it('6. Prevents re-approving an already approved submission', async () => {
    const approvedSub = await TaskSubmission.findOne({
      user: testUser1._id,
      status: TaskSubmissionStatus.APPROVED,
    });

    await expect(
      TaskService.approveSubmission(approvedSub!._id.toString(), adminUser._id.toString())
    ).rejects.toThrow(/already been approved/);
  });

  it('7. Admin rejects submission with reason', async () => {
    const tasks = await Task.find({ status: TaskStatus.PUBLISHED });
    const task = tasks[0]!;

    // Worker 2 submits
    const sub2 = await TaskService.submitTask(testUser2._id.toString(), task._id.toString(), {
      proofType: ProofType.SCREENSHOT,
      proofImageUrl: 'https://res.cloudinary.com/demo/image/upload/fake.jpg',
    });

    const rejected = await TaskService.rejectSubmission(
      sub2._id.toString(),
      adminUser._id.toString(),
      'Screenshot does not show video activity.'
    );

    expect(rejected.status).toBe(TaskSubmissionStatus.REJECTED);
    expect(rejected.rejectionReason).toBe('Screenshot does not show video activity.');

    // User wallet should not have received any credit
    const wallet = await Wallet.findOne({ user: testUser2._id });
    expect(wallet?.availableBalance || 0).toBe(0);
  });

  it('8. Enforces budget exhaustion and auto-completes task', async () => {
    // Create a small budget task (only 1 completion allowed)
    const smallTask = await TaskService.createTask(adminUser._id.toString(), {
      title: 'Quick Survey',
      description: 'Answer 3 questions',
      instructions: 'Complete survey form',
      category: TaskCategory.COMPLETE_TASK,
      rewardAmount: 2000,
      totalBudget: 2000, // Exactly 1 completion
      maxParticipants: 1,
      requiredProofType: ProofType.TEXT,
      status: TaskStatus.PUBLISHED,
    });

    const sub = await TaskService.submitTask(testUser1._id.toString(), smallTask._id.toString(), {
      proofType: ProofType.TEXT,
      proofText: 'Answers: 1: Yes, 2: Good, 3: Agree',
    });

    await TaskService.approveSubmission(sub._id.toString(), adminUser._id.toString());

    // Task should now be COMPLETED
    const updated = await Task.findById(smallTask._id);
    expect(updated?.status).toBe(TaskStatus.COMPLETED);
    expect(updated?.remainingBudget).toBe(0);

    // Another user cannot submit because task is completed / budget exhausted
    await expect(
      TaskService.submitTask(testUser2._id.toString(), smallTask._id.toString(), {
        proofType: ProofType.TEXT,
        proofText: 'My answers',
      })
    ).rejects.toThrow();
  });
});
