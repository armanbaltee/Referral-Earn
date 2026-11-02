import mongoose from 'mongoose';
import crypto from 'crypto';
import {
  Task,
  TaskCategory,
  TaskStatus,
  ProofType,
  type ITaskDocument,
} from './task.model.js';
import {
  TaskSubmission,
  TaskSubmissionStatus,
  type ITaskSubmissionDocument,
} from './taskSubmission.model.js';
import { WalletService } from '../wallet/wallet.service.js';
import { TransactionType } from '../transactions/walletTransaction.model.js';
import { AuditLog, AuditAction } from '../admin/auditLog.model.js';
import { BadRequestError, NotFoundError } from '../../common/errors.js';

export interface CreateTaskDTO {
  title: string;
  description: string;
  instructions: string;
  category: TaskCategory;
  thumbnail?: string;
  videoUrl?: string;
  rewardAmount: number; // in paisa
  startDate?: string;
  endDate?: string;
  estimatedMinutes?: number;
  maxParticipants?: number;
  maxCompletionsPerUser?: number;
  targetAudience?: string;
  requiredProofType: ProofType;
  totalBudget?: number; // in paisa
  status?: TaskStatus;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  instructions?: string;
  category?: TaskCategory;
  thumbnail?: string;
  videoUrl?: string;
  rewardAmount?: number;
  startDate?: string;
  endDate?: string;
  estimatedMinutes?: number;
  maxParticipants?: number;
  maxCompletionsPerUser?: number;
  targetAudience?: string;
  requiredProofType?: ProofType;
  totalBudget?: number;
  status?: TaskStatus;
}

export interface SubmitTaskDTO {
  proofType: ProofType;
  proofText?: string;
  proofImageUrl?: string;
  proofUrl?: string;
  notes?: string;
}

export class TaskService {
  // ─── ADMIN: Create Task ───────────────────────────────────────────────────
  public static async createTask(adminId: string, data: CreateTaskDTO): Promise<ITaskDocument> {
    if (data.rewardAmount <= 0) {
      throw new BadRequestError('Reward amount must be greater than 0.');
    }

    const maxParticipants = data.maxParticipants || 100;
    const computedBudget = data.totalBudget && data.totalBudget > 0
      ? data.totalBudget
      : maxParticipants * data.rewardAmount;

    const task = await Task.create({
      title: data.title.trim(),
      description: data.description.trim(),
      instructions: data.instructions.trim(),
      category: data.category || TaskCategory.COMPLETE_TASK,
      thumbnail: data.thumbnail,
      videoUrl: data.videoUrl,
      rewardAmount: data.rewardAmount,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      estimatedMinutes: data.estimatedMinutes || 5,
      maxParticipants,
      maxCompletionsPerUser: data.maxCompletionsPerUser || 1,
      targetAudience: data.targetAudience || 'ALL',
      requiredProofType: data.requiredProofType || ProofType.SCREENSHOT,
      totalBudget: computedBudget,
      allocatedBudget: computedBudget,
      approvedRewardAmount: 0,
      remainingBudget: computedBudget,
      completionsCount: 0,
      status: data.status || TaskStatus.DRAFT,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.TASK_CREATED,
      target: task._id,
      targetModel: 'Task',
      description: `Task created: "${task.title}" with reward Rs. ${task.rewardAmount / 100} and budget Rs. ${task.totalBudget / 100}`,
    });

    return task;
  }

  // ─── ADMIN: Update Task ───────────────────────────────────────────────────
  public static async updateTask(taskId: string, adminId: string, data: UpdateTaskDTO): Promise<ITaskDocument> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found.');
    }

    // Safety rule: If published, only safe fields can be edited without resetting submissions
    if (task.status === TaskStatus.PUBLISHED) {
      if (data.rewardAmount && data.rewardAmount !== task.rewardAmount && task.completionsCount > 0) {
        throw new BadRequestError('Cannot change reward amount on an active task with existing completions.');
      }
    }

    if (data.title) task.title = data.title.trim();
    if (data.description) task.description = data.description.trim();
    if (data.instructions) task.instructions = data.instructions.trim();
    if (data.category) task.category = data.category;
    if (data.thumbnail !== undefined) task.thumbnail = data.thumbnail;
    if (data.videoUrl !== undefined) task.videoUrl = data.videoUrl;
    if (data.startDate !== undefined) {
      if (data.startDate) task.startDate = new Date(data.startDate);
      else (task as any).startDate = undefined;
    }
    if (data.endDate !== undefined) {
      if (data.endDate) task.endDate = new Date(data.endDate);
      else (task as any).endDate = undefined;
    }
    if (data.estimatedMinutes) task.estimatedMinutes = data.estimatedMinutes;
    if (data.maxParticipants) task.maxParticipants = data.maxParticipants;
    if (data.maxCompletionsPerUser) task.maxCompletionsPerUser = data.maxCompletionsPerUser;
    if (data.targetAudience) task.targetAudience = data.targetAudience;
    if (data.requiredProofType) task.requiredProofType = data.requiredProofType;
    if (data.status) task.status = data.status;

    if (data.totalBudget && data.totalBudget > task.approvedRewardAmount) {
      task.totalBudget = data.totalBudget;
      task.allocatedBudget = data.totalBudget;
      task.remainingBudget = data.totalBudget - task.approvedRewardAmount;
    }

    if (data.rewardAmount && task.completionsCount === 0) {
      task.rewardAmount = data.rewardAmount;
    }

    await task.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.TASK_UPDATED,
      target: task._id,
      targetModel: 'Task',
      description: `Task updated: "${task.title}" (Status: ${task.status})`,
    });

    return task;
  }

  // ─── ADMIN: Change Status ─────────────────────────────────────────────────
  public static async updateTaskStatus(taskId: string, adminId: string, status: TaskStatus): Promise<ITaskDocument> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found.');
    }

    task.status = status;
    await task.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.TASK_STATUS_CHANGED,
      target: task._id,
      targetModel: 'Task',
      description: `Task "${task.title}" status changed to ${status}`,
    });

    return task;
  }

  // ─── USER & ADMIN: Get Task by ID ─────────────────────────────────────────
  public static async getTaskById(taskId: string, userId?: string): Promise<{ task: ITaskDocument; userStats?: { userCompletions: number; hasPendingSubmission: boolean; canSubmit: boolean } | undefined }> {
    const task = await Task.findById(taskId).populate('createdBy', 'name email');
    if (!task) {
      throw new NotFoundError('Task not found.');
    }

    let userStats = undefined;
    if (userId) {
      const submissions = await TaskSubmission.find({
        task: task._id,
        user: new mongoose.Types.ObjectId(userId),
      });

      const approvedCount = submissions.filter((s) => s.status === TaskSubmissionStatus.APPROVED).length;
      const hasPending = submissions.some((s) => s.status === TaskSubmissionStatus.PENDING);
      const isExpired = task.endDate ? new Date() > task.endDate : false;
      const budgetExhausted = task.remainingBudget < task.rewardAmount;
      const maxParticipantsReached = task.maxParticipants ? task.completionsCount >= task.maxParticipants : false;

      const canSubmit =
        task.status === TaskStatus.PUBLISHED &&
        !isExpired &&
        !budgetExhausted &&
        !maxParticipantsReached &&
        !hasPending &&
        approvedCount < task.maxCompletionsPerUser;

      userStats = {
        userCompletions: approvedCount,
        hasPendingSubmission: hasPending,
        canSubmit,
      };
    }

    return { task, userStats };
  }

  // ─── USER: Browse Available Tasks ────────────────────────────────────────
  public static async getAvailableTasks(query: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 12)));
    const filter: Record<string, unknown> = {
      status: TaskStatus.PUBLISHED,
    };

    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search.trim(), $options: 'i' } },
        { description: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    // Exclude expired tasks
    filter.$or = filter.$or
      ? [{ $and: [{ $or: filter.$or }, { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: new Date() } }] }] }]
      : [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: new Date() } }];

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ─── ADMIN: List All Tasks ────────────────────────────────────────────────
  public static async getAllTasksAdmin(query: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.category && query.category !== 'all') filter.category = query.category;
    if (query.search) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ─── USER: Submit Task Evidence ───────────────────────────────────────────
  public static async submitTask(userId: string, taskId: string, data: SubmitTaskDTO): Promise<ITaskSubmissionDocument> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found.');
    }

    if (task.status !== TaskStatus.PUBLISHED) {
      throw new BadRequestError('This task is currently not accepting submissions.');
    }

    if (task.endDate && new Date() > task.endDate) {
      throw new BadRequestError('This task deadline has passed.');
    }

    if (task.remainingBudget < task.rewardAmount) {
      throw new BadRequestError('This task budget is exhausted.');
    }

    if (task.maxParticipants && task.completionsCount >= task.maxParticipants) {
      throw new BadRequestError('This task has reached its maximum participant limit.');
    }

    // Check user limits
    const existingSubmissions = await TaskSubmission.find({
      task: task._id,
      user: new mongoose.Types.ObjectId(userId),
    });

    const pending = existingSubmissions.some((s) => s.status === TaskSubmissionStatus.PENDING);
    if (pending) {
      throw new BadRequestError('You already have a submission pending review for this task.');
    }

    const approvedCount = existingSubmissions.filter((s) => s.status === TaskSubmissionStatus.APPROVED).length;
    if (approvedCount >= task.maxCompletionsPerUser) {
      throw new BadRequestError(`You have already completed this task the maximum allowed times (${task.maxCompletionsPerUser}).`);
    }

    const idempotencyKey = `TASK-SUB-${taskId}-${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const submission = await TaskSubmission.create({
      task: task._id,
      user: new mongoose.Types.ObjectId(userId),
      status: TaskSubmissionStatus.PENDING,
      proofType: data.proofType,
      proofText: data.proofText?.trim(),
      proofImageUrl: data.proofImageUrl,
      proofUrl: data.proofUrl?.trim(),
      notes: data.notes?.trim(),
      rewardAmount: task.rewardAmount,
      idempotencyKey,
    });

    return submission;
  }

  // ─── USER: Get My Submissions ─────────────────────────────────────────────
  public static async getMySubmissions(userId: string, query: { status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    const filter: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    const [submissions, total] = await Promise.all([
      TaskSubmission.find(filter)
        .populate('task', 'title category rewardAmount thumbnail')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TaskSubmission.countDocuments(filter),
    ]);

    return {
      submissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ─── ADMIN: Get All Submissions ───────────────────────────────────────────
  public static async getSubmissionsAdmin(query: {
    taskId?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const filter: Record<string, unknown> = {};

    if (query.taskId) filter.task = new mongoose.Types.ObjectId(query.taskId);
    if (query.userId) filter.user = new mongoose.Types.ObjectId(query.userId);
    if (query.status && query.status !== 'all') filter.status = query.status;

    const [submissions, total] = await Promise.all([
      TaskSubmission.find(filter)
        .populate('task', 'title category rewardAmount remainingBudget')
        .populate('user', 'name email phone referralCode')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TaskSubmission.countDocuments(filter),
    ]);

    return {
      submissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // ─── ADMIN: Approve Task Submission ───────────────────────────────────────
  public static async approveSubmission(submissionId: string, adminId: string): Promise<ITaskSubmissionDocument> {
    const submission = await TaskSubmission.findById(submissionId);
    if (!submission) {
      throw new NotFoundError('Task submission not found.');
    }

    if (submission.status === TaskSubmissionStatus.APPROVED) {
      throw new BadRequestError('This submission has already been approved.');
    }
    if (submission.status === TaskSubmissionStatus.REJECTED) {
      throw new BadRequestError('Cannot approve a rejected submission.');
    }

    const task = await Task.findById(submission.task);
    if (!task) {
      throw new NotFoundError('Associated task not found.');
    }

    // Budget check
    if (task.remainingBudget < submission.rewardAmount) {
      throw new BadRequestError(
        `Cannot approve submission: Task remaining budget (Rs. ${task.remainingBudget / 100}) is lower than reward (Rs. ${submission.rewardAmount / 100}).`
      );
    }

    // Atomic transaction for wallet crediting & task budget debit
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Update task budget & completions
      task.approvedRewardAmount += submission.rewardAmount;
      task.remainingBudget = Math.max(0, task.remainingBudget - submission.rewardAmount);
      task.completionsCount += 1;

      if (task.remainingBudget < task.rewardAmount || (task.maxParticipants && task.completionsCount >= task.maxParticipants)) {
        task.status = TaskStatus.COMPLETED;
      }
      await task.save({ session });

      // 2. Credit user wallet
      const idempotencyKey = `TASK-REWARD-${submission._id.toString()}`;
      const walletTx = await WalletService.credit({
        userId: submission.user.toString(),
        amount: submission.rewardAmount,
        type: TransactionType.TASK_REWARD,
        description: `Task reward: "${task.title}"`,
        idempotencyKey,
        sourceReference: submission._id.toString(),
        sourceModel: 'TaskSubmission',
        processedBy: adminId,
      });

      // 3. Update submission record
      submission.status = TaskSubmissionStatus.APPROVED;
      submission.reviewedBy = new mongoose.Types.ObjectId(adminId);
      submission.reviewedAt = new Date();
      submission.walletTransaction = walletTx._id as mongoose.Types.ObjectId;
      await submission.save({ session });

      // 4. Audit Log
      await AuditLog.create(
        [
          {
            actor: new mongoose.Types.ObjectId(adminId),
            action: AuditAction.TASK_SUBMISSION_APPROVED,
            target: submission._id,
            targetModel: 'TaskSubmission',
            description: `Task submission approved: Rs. ${submission.rewardAmount / 100} awarded to user ${submission.user} for task "${task.title}".`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return submission;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }

  // ─── ADMIN: Reject Task Submission ────────────────────────────────────────
  public static async rejectSubmission(submissionId: string, adminId: string, reason: string): Promise<ITaskSubmissionDocument> {
    if (!reason || reason.trim().length < 3) {
      throw new BadRequestError('A valid rejection reason is required.');
    }

    const submission = await TaskSubmission.findById(submissionId);
    if (!submission) {
      throw new NotFoundError('Task submission not found.');
    }

    if (submission.status === TaskSubmissionStatus.APPROVED) {
      throw new BadRequestError('Cannot reject an already approved submission.');
    }
    if (submission.status === TaskSubmissionStatus.REJECTED) {
      throw new BadRequestError('Submission is already rejected.');
    }

    submission.status = TaskSubmissionStatus.REJECTED;
    submission.rejectionReason = reason.trim();
    submission.reviewedBy = new mongoose.Types.ObjectId(adminId);
    submission.reviewedAt = new Date();
    await submission.save();

    await AuditLog.create({
      actor: new mongoose.Types.ObjectId(adminId),
      action: AuditAction.TASK_SUBMISSION_REJECTED,
      target: submission._id,
      targetModel: 'TaskSubmission',
      description: `Task submission rejected for user ${submission.user}. Reason: ${reason}`,
    });

    return submission;
  }

  // ─── ADMIN: Budget & Task System Overview ─────────────────────────────────
  public static async getTaskSystemOverview() {
    const [taskStats] = await Task.aggregate([
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          totalBudgetAllocated: { $sum: '$totalBudget' },
          totalRewardsPaid: { $sum: '$approvedRewardAmount' },
          totalRemainingBudget: { $sum: '$remainingBudget' },
          totalCompletions: { $sum: '$completionsCount' },
        },
      },
    ]);

    const [submissionStats] = await TaskSubmission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$rewardAmount' },
        },
      },
    ]);

    const categoryBreakdown = await Task.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRewards: { $sum: '$approvedRewardAmount' },
        },
      },
    ]);

    return {
      stats: taskStats || {
        totalTasks: 0,
        totalBudgetAllocated: 0,
        totalRewardsPaid: 0,
        totalRemainingBudget: 0,
        totalCompletions: 0,
      },
      submissionStats,
      categoryBreakdown,
    };
  }

  // ─── USER: Task Earnings Summary ──────────────────────────────────────────
  public static async getUserTaskEarnings(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [earnings] = await TaskSubmission.aggregate([
      { $match: { user: userObjId, status: TaskSubmissionStatus.APPROVED } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$rewardAmount' },
          completedTasksCount: { $sum: 1 },
        },
      },
    ]);

    const pendingCount = await TaskSubmission.countDocuments({
      user: userObjId,
      status: TaskSubmissionStatus.PENDING,
    });

    return {
      totalEarnedPaisa: earnings?.totalEarned || 0,
      totalEarnedPKR: (earnings?.totalEarned || 0) / 100,
      completedTasksCount: earnings?.completedTasksCount || 0,
      pendingTasksCount: pendingCount,
    };
  }
}
