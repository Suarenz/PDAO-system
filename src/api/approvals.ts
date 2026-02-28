import api, { 
  ApiResponse, 
  PaginatedResponse, 
  PendingApproval 
} from './client';

export interface ApprovalStats {
  pending: number;
  under_review: number;
  approved_today: number;
  rejected_today: number;
}

export interface ApprovalFilters {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submission_type?: 'NEW' | 'EXISTING' | 'RENEWAL';
  search?: string;
  page?: number;
  per_page?: number;
}

export const approvalApi = {
  /**
   * Get all pending registrations
   */
  getAll: async (filters: ApprovalFilters = {}): Promise<PaginatedResponse<PendingApproval>> => {
    const response = await api.get<PaginatedResponse<PendingApproval>>('/approvals', { params: filters });
    return response.data;
  },

  /**
   * Get single approval by ID
   */
  getById: async (id: number): Promise<PendingApproval & { pwd_profile: any }> => {
    const response = await api.get<ApiResponse<PendingApproval & { pwd_profile: any }>>(`/approvals/${id}`);
    return response.data.data;
  },

  /**
   * Get approval statistics
   */
  getStats: async (): Promise<ApprovalStats> => {
    const response = await api.get<ApiResponse<ApprovalStats>>('/approvals/stats');
    return response.data.data;
  },

  /**
   * Approve a registration
   */
  approve: async (id: number, notes?: string, pwd_number?: string): Promise<void> => {
    await api.post(`/approvals/${id}/approve`, { notes, pwd_number });
  },

  /**
   * Reject a registration
   */
  reject: async (id: number, notes: string): Promise<void> => {
    await api.post(`/approvals/${id}/reject`, { notes });
  },

  /**
   * Mark registration for review
   */
  markForReview: async (id: number, notes?: string): Promise<void> => {
    await api.post(`/approvals/${id}/mark-review`, { notes });
  },
};

export default approvalApi;
