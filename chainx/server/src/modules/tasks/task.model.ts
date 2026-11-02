import mongoose, { type Document, Schema } from 'mongoose';

export enum TaskCategory {
  WATCH_VIDEO = 'watch_video',
  COMPLETE_TASK = 'complete_task',
  PROMOTIONAL = 'promotional',
  PRODUCT_RELATED = 'product_related',
  OTHER = 'other',
}

export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ProofType {
  SCREENSHOT = 'screenshot',
  TEXT = 'text',
  EXTERNAL_URL = 'external_url',
  VIDEO_URL = 'video_url',
  OTHER = 'other',
}

export interface ITask {
  title: string;
  description: string;
  instructions: string;
  category: TaskCategory;
  status: TaskStatus;
  thumbnail?: string;
  videoUrl?: string;
  /** Reward in paisa (e.g. 50000 = Rs. 500) */
  rewardAmount: number;
  startDate?: Date;
  endDate?: Date;
  estimatedMinutes?: number;
  maxParticipants?: number;
  maxCompletionsPerUser: number;
  targetAudience: string;
  requiredProofType: ProofType;
  /** Budget Controls */
  totalBudget: number; // in paisa
  allocatedBudget: number; // in paisa
  approvedRewardAmount: number; // in paisa
  remainingBudget: number; // in paisa
  completionsCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ITaskDocument = Document & ITask;

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },
    instructions: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: Object.values(TaskCategory),
      default: TaskCategory.COMPLETE_TASK,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.DRAFT,
    },
    thumbnail: { type: String },
    videoUrl: { type: String },
    rewardAmount: { type: Number, required: true, min: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedMinutes: { type: Number, default: 5 },
    maxParticipants: { type: Number, min: 1 },
    maxCompletionsPerUser: { type: Number, default: 1, min: 1 },
    targetAudience: { type: String, default: 'ALL' },
    requiredProofType: {
      type: String,
      enum: Object.values(ProofType),
      default: ProofType.SCREENSHOT,
    },
    totalBudget: { type: Number, default: 0, min: 0 },
    allocatedBudget: { type: Number, default: 0, min: 0 },
    approvedRewardAmount: { type: Number, default: 0, min: 0 },
    remainingBudget: { type: Number, default: 0, min: 0 },
    completionsCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, category: 1, createdAt: -1 });
taskSchema.index({ endDate: 1 });
taskSchema.index({ createdBy: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
