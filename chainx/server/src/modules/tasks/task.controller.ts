import type { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../../types/index.js';
import { TaskService } from './task.service.js';
import { TaskCategory, TaskStatus, ProofType } from './task.model.js';

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(3000),
  instructions: z.string().min(5).max(5000),
  category: z.nativeEnum(TaskCategory),
  thumbnail: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  rewardAmount: z.number().int().positive('Reward amount must be a positive integer in paisa.'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  maxCompletionsPerUser: z.number().int().positive().optional(),
  targetAudience: z.string().optional(),
  requiredProofType: z.nativeEnum(ProofType),
  totalBudget: z.number().int().positive().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const submitTaskSchema = z.object({
  proofType: z.nativeEnum(ProofType),
  proofText: z.string().max(2000).optional(),
  proofImageUrl: z.string().url().optional().or(z.literal('')),
  proofUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});

const rejectSubmissionSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required.').max(500),
});

export class TaskController {
  // ─── USER CONTROLLERS ─────────────────────────────────────────────────────
  static async getAvailableTasks(req: Request, res: Response) {
    const { category, search, page, limit } = req.query;
    const result = await TaskService.getAvailableTasks({
      ...(category ? { category: String(category) } : {}),
      ...(search ? { search: String(search) } : {}),
      page: Number(page || 1),
      limit: Number(limit || 12),
    });
    res.json({ success: true, ...result });
  }

  static async getTaskById(req: Request, res: Response) {
    const { id } = req.params;
    const authUser = (req as AuthenticatedRequest).user;
    const result = await TaskService.getTaskById(id, authUser?.userId);
    res.json({ success: true, data: result });
  }

  static async submitTask(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const data = submitTaskSchema.parse(req.body);
    const submission = await TaskService.submitTask(authUser.userId, id, {
      proofType: data.proofType,
      ...(data.proofText ? { proofText: data.proofText } : {}),
      ...(data.proofImageUrl ? { proofImageUrl: data.proofImageUrl } : {}),
      ...(data.proofUrl ? { proofUrl: data.proofUrl } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
    });
    res.status(201).json({
      success: true,
      message: 'Task submission received and pending verification.',
      data: submission,
    });
  }

  static async getMySubmissions(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { status, page, limit } = req.query;
    const result = await TaskService.getMySubmissions(authUser.userId, {
      ...(status ? { status: String(status) } : {}),
      page: Number(page || 1),
      limit: Number(limit || 10),
    });
    res.json({ success: true, ...result });
  }

  static async getUserTaskEarnings(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const earnings = await TaskService.getUserTaskEarnings(authUser.userId);
    res.json({ success: true, data: earnings });
  }

  // ─── ADMIN CONTROLLERS ────────────────────────────────────────────────────
  static async createTask(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const data = createTaskSchema.parse(req.body);
    const task = await TaskService.createTask(authUser.userId, {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      category: data.category,
      rewardAmount: data.rewardAmount,
      requiredProofType: data.requiredProofType,
      ...(data.thumbnail ? { thumbnail: data.thumbnail } : {}),
      ...(data.videoUrl ? { videoUrl: data.videoUrl } : {}),
      ...(data.startDate ? { startDate: data.startDate } : {}),
      ...(data.endDate ? { endDate: data.endDate } : {}),
      ...(data.estimatedMinutes ? { estimatedMinutes: data.estimatedMinutes } : {}),
      ...(data.maxParticipants ? { maxParticipants: data.maxParticipants } : {}),
      ...(data.maxCompletionsPerUser ? { maxCompletionsPerUser: data.maxCompletionsPerUser } : {}),
      ...(data.targetAudience ? { targetAudience: data.targetAudience } : {}),
      ...(data.totalBudget ? { totalBudget: data.totalBudget } : {}),
      ...(data.status ? { status: data.status } : {}),
    });
    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: task,
    });
  }

  static async updateTask(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);
    const task = await TaskService.updateTask(id, authUser.userId, {
      ...(data.title ? { title: data.title } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.instructions ? { instructions: data.instructions } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.thumbnail !== undefined ? { thumbnail: data.thumbnail } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
      ...(data.rewardAmount ? { rewardAmount: data.rewardAmount } : {}),
      ...(data.startDate ? { startDate: data.startDate } : {}),
      ...(data.endDate ? { endDate: data.endDate } : {}),
      ...(data.estimatedMinutes ? { estimatedMinutes: data.estimatedMinutes } : {}),
      ...(data.maxParticipants ? { maxParticipants: data.maxParticipants } : {}),
      ...(data.maxCompletionsPerUser ? { maxCompletionsPerUser: data.maxCompletionsPerUser } : {}),
      ...(data.targetAudience ? { targetAudience: data.targetAudience } : {}),
      ...(data.requiredProofType ? { requiredProofType: data.requiredProofType } : {}),
      ...(data.totalBudget ? { totalBudget: data.totalBudget } : {}),
      ...(data.status ? { status: data.status } : {}),
    });
    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: task,
    });
  }

  static async updateTaskStatus(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const { status } = z.object({ status: z.nativeEnum(TaskStatus) }).parse(req.body);
    const task = await TaskService.updateTaskStatus(id, authUser.userId, status);
    res.json({
      success: true,
      message: `Task status updated to ${status}.`,
      data: task,
    });
  }

  static async getAllTasksAdmin(req: Request, res: Response) {
    const { status, category, search, page, limit } = req.query;
    const result = await TaskService.getAllTasksAdmin({
      ...(status ? { status: String(status) } : {}),
      ...(category ? { category: String(category) } : {}),
      ...(search ? { search: String(search) } : {}),
      page: Number(page || 1),
      limit: Number(limit || 20),
    });
    res.json({ success: true, ...result });
  }

  static async getSubmissionsAdmin(req: Request, res: Response) {
    const { taskId, status, userId, page, limit } = req.query;
    const result = await TaskService.getSubmissionsAdmin({
      ...(taskId ? { taskId: String(taskId) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      page: Number(page || 1),
      limit: Number(limit || 20),
    });
    res.json({ success: true, ...result });
  }

  static async approveSubmission(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const submission = await TaskService.approveSubmission(id, authUser.userId);
    res.json({
      success: true,
      message: `Submission approved and Rs. ${submission.rewardAmount / 100} credited to user wallet.`,
      data: submission,
    });
  }

  static async rejectSubmission(req: Request, res: Response) {
    const authUser = (req as AuthenticatedRequest).user;
    const { id } = req.params;
    const { reason } = rejectSubmissionSchema.parse(req.body);
    const submission = await TaskService.rejectSubmission(id, authUser.userId, reason);
    res.json({
      success: true,
      message: 'Submission rejected.',
      data: submission,
    });
  }

  static async getTaskSystemOverview(_req: Request, res: Response) {
    const overview = await TaskService.getTaskSystemOverview();
    res.json({ success: true, data: overview });
  }
}
