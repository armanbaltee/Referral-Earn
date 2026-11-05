import api from '@/lib/axios';

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

export interface TaskItem {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  category: TaskCategory;
  status: TaskStatus;
  thumbnail?: string | undefined;
  videoUrl?: string | undefined;
  rewardAmount: number;
  startDate?: string | undefined;
  endDate?: string | undefined;
  estimatedMinutes: number;
  maxParticipants?: number | undefined;
  maxCompletionsPerUser: number;
  targetAudience: string;
  requiredProofType: ProofType;
  totalBudget: number;
  allocatedBudget: number;
  approvedRewardAmount: number;
  remainingBudget: number;
  completionsCount: number;
  createdAt: string;
  createdBy?: { _id: string; name: string; email: string } | undefined;
}

export interface TaskSubmissionItem {
  _id: string;
  task: {
    _id: string;
    title: string;
    category: TaskCategory;
    rewardAmount: number;
    thumbnail?: string | undefined;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
  } | undefined;
  status: 'pending' | 'approved' | 'rejected';
  proofType: ProofType;
  proofText?: string | undefined;
  proofImageUrl?: string | undefined;
  proofUrl?: string | undefined;
  notes?: string | undefined;
  rejectionReason?: string | undefined;
  rewardAmount: number;
  createdAt: string;
  reviewedAt?: string | undefined;
  reviewedBy?: { _id: string; name: string; email: string } | undefined;
}

export interface TaskEarnings {
  totalEarnedPaisa: number;
  totalEarnedPKR: number;
  completedTasksCount: number;
  pendingTasksCount: number;
}

export const taskApi = {
  // User APIs
  getAvailableTasks: async (params?: { category?: string | undefined; search?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      tasks: TaskItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/tasks', { params });
    return res.data;
  },

  getTaskById: async (id: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        task: TaskItem;
        userStats?: {
          userCompletions: number;
          hasPendingSubmission: boolean;
          canSubmit: boolean;
        } | undefined;
      };
    }>(`/api/v1/tasks/${id}`);
    return res.data.data;
  },

  submitTask: async (id: string, data: {
    proofType: ProofType;
    proofText?: string | undefined;
    proofImageUrl?: string | undefined;
    proofUrl?: string | undefined;
    notes?: string | undefined;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: TaskSubmissionItem }>(
      `/api/v1/tasks/${id}/submit`,
      data
    );
    return res.data;
  },

  getMySubmissions: async (params?: { status?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      submissions: TaskSubmissionItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/tasks/me/submissions', { params });
    return res.data;
  },

  getUserEarnings: async () => {
    const res = await api.get<{ success: boolean; data: TaskEarnings }>('/tasks/earnings');
    return res.data.data;
  },

  // Admin APIs
  getOverview: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/tasks/admin/overview');
    return res.data.data;
  },

  getAllTasksAdmin: async (params?: { status?: string | undefined; category?: string | undefined; search?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      tasks: TaskItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/tasks/admin/all', { params });
    return res.data;
  },

  createTask: async (data: Partial<TaskItem>) => {
    const res = await api.post<{ success: boolean; message: string; data: TaskItem }>(
      '/tasks/admin/create',
      data
    );
    return res.data;
  },

  updateTask: async (id: string, data: Partial<TaskItem>) => {
    const res = await api.put<{ success: boolean; message: string; data: TaskItem }>(
      `/api/v1/tasks/admin/${id}`,
      data
    );
    return res.data;
  },

  updateTaskStatus: async (id: string, status: TaskStatus) => {
    const res = await api.patch<{ success: boolean; message: string; data: TaskItem }>(
      `/api/v1/tasks/admin/${id}/status`,
      { status }
    );
    return res.data;
  },

  getSubmissionsAdmin: async (params?: { taskId?: string | undefined; status?: string | undefined; userId?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined) => {
    const res = await api.get<{
      success: boolean;
      submissions: TaskSubmissionItem[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/tasks/admin/submissions/all', { params });
    return res.data;
  },

  approveSubmission: async (id: string) => {
    const res = await api.patch<{ success: boolean; message: string; data: TaskSubmissionItem }>(
      `/api/v1/tasks/admin/submissions/${id}/approve`
    );
    return res.data;
  },

  rejectSubmission: async (id: string, reason: string) => {
    const res = await api.patch<{ success: boolean; message: string; data: TaskSubmissionItem }>(
      `/api/v1/tasks/admin/submissions/${id}/reject`,
      { reason }
    );
    return res.data;
  },
};
