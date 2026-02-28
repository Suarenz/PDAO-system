import api, { ApiResponse, PaginatedResponse } from './client';

export interface ServiceRequestData {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string | null;
  user_email: string | null;
  pwd_profile_id: number | null;
  type: 'LOST_ID' | 'DAMAGED_ID' | 'RENEWAL';
  type_label: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  notes: string | null;
  affidavit_path: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface ServiceRequestStats {
  total_pending: number;
  total_processing: number;
  total_completed: number;
  total_rejected: number;
  lost_id_count: number;
  damaged_id_count: number;
  renewal_count: number;
}

export interface ServiceRequestFilters {
  status?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const serviceRequestsApi = {
  getAll: async (filters: ServiceRequestFilters = {}): Promise<PaginatedResponse<ServiceRequestData>> => {
    const response = await api.get<PaginatedResponse<ServiceRequestData>>('/service-requests', { params: filters });
    return response.data;
  },

  submit: async (data: FormData): Promise<ServiceRequestData> => {
    const response = await api.post<ApiResponse<ServiceRequestData>>('/service-requests', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  getStats: async (): Promise<ServiceRequestStats> => {
    const response = await api.get<ApiResponse<ServiceRequestStats>>('/service-requests/stats');
    return response.data.data;
  },

  updateStatus: async (id: number, status: string, adminNotes?: string): Promise<void> => {
    await api.patch(`/service-requests/${id}/status`, { status, admin_notes: adminNotes });
  },
};

export default serviceRequestsApi;
