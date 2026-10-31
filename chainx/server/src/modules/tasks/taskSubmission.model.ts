import mongoose, { type Document, Schema } from 'mongoose';

export enum TaskSubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ITaskSubmission {
  task: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: TaskSubmissionStatus;
  proof?: string;
  notes?: string;
  rejectionReason?: string;
  /** Reward paid in paisa */
  rewardPaid?: number;
  walletTransaction?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
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
    proof: { type: String },
    notes: { type: String, maxlength: 500 },
    rejectionReason: { type: String, maxlength: 500 },
    rewardPaid: { type: Number, min: 0 },
    walletTransaction: { type: Schema.Types.ObjectId, ref: 'WalletTransaction' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// A user can only submit a task once
taskSubmissionSchema.index({ task: 1, user: 1 }, { unique: true });
taskSubmissionSchema.index({ user: 1, status: 1, createdAt: -1 });
taskSubmissionSchema.index({ task: 1, status: 1 });

export const TaskSubmission = mongoose.model<ITaskSubmission>(
  'TaskSubmission',
  taskSubmissionSchema
);
