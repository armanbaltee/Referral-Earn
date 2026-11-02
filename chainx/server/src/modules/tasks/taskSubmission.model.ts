import mongoose, { type Document, Schema } from 'mongoose';
import { ProofType } from './task.model.js';

export enum TaskSubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ITaskSubmission {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: TaskSubmissionStatus;
  proofType: ProofType;
  proofText?: string;
  proofImageUrl?: string;
  proofUrl?: string;
  notes?: string;
  rejectionReason?: string;
  /** Reward paid in paisa */
  rewardAmount: number;
  walletTransaction?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ITaskSubmissionDocument = Document & ITaskSubmission;

const taskSubmissionSchema = new Schema<ITaskSubmission>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(TaskSubmissionStatus),
      default: TaskSubmissionStatus.PENDING,
    },
    proofType: {
      type: String,
      enum: Object.values(ProofType),
      required: true,
    },
    proofText: { type: String, maxlength: 2000 },
    proofImageUrl: { type: String },
    proofUrl: { type: String },
    notes: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    rewardAmount: { type: Number, required: true, min: 0 },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

taskSubmissionSchema.index({ task: 1, user: 1 });
taskSubmissionSchema.index({ user: 1, status: 1, createdAt: -1 });
taskSubmissionSchema.index({ task: 1, status: 1, createdAt: -1 });
taskSubmissionSchema.index({ idempotencyKey: 1 }, { unique: true });

export const TaskSubmission = mongoose.model<ITaskSubmission>(
  'TaskSubmission',
  taskSubmissionSchema
);
