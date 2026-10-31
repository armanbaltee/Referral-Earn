import mongoose, { type Document, Schema } from 'mongoose';

export enum TaskType {
  SOCIAL_SHARE = 'social_share',
  VIDEO_WATCH = 'video_watch',
  SURVEY = 'survey',
  REVIEW = 'review',
  APP_INSTALL = 'app_install',
  CUSTOM = 'custom',
}

export enum TaskStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export interface ITask {
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  /** Reward in paisa */
  reward: number;
  instructions: string;
  link?: string;
  thumbnail?: string;
  maxCompletions?: number;
  totalCompletions: number;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ITaskDocument = Document & ITask;

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: Object.values(TaskType), required: true },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.ACTIVE },
    reward: { type: Number, required: true, min: 0 },
    instructions: { type: String, required: true, maxlength: 5000 },
    link: { type: String },
    thumbnail: { type: String },
    maxCompletions: { type: Number, min: 1 },
    totalCompletions: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, type: 1 });
taskSchema.index({ expiresAt: 1 });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
