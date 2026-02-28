import api, { 
  ApiResponse, 
  PaginatedResponse, 
  ActivityLog 
} from './client';

export interface LogFilters {
  month?: string;  // YYYY-MM format
  action_type?: string;
  user_id?: number;
  model_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface LogDetail extends ActivityLog {
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user_agent: string | null;
}

export interface LogMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  is_archive: boolean;
  month: string;
}

export const logsApi = {
  /**
   * Get activity logs (current or archived)
   */
  getAll: async (filters: LogFilters = {}): Promise<{ data: ActivityLog[]; meta: LogMeta }> => {
    const response = await api.get<PaginatedResponse<ActivityLog> & { meta: LogMeta }>('/logs', { 
      params: filters 
    });
    return { data: response.data.data, meta: response.data.meta };
  },

  /**
   * Get single log entry with details
   */
  getById: async (id: number, month?: string): Promise<LogDetail> => {
    const response = await api.get<ApiResponse<LogDetail>>(`/logs/${id}`, { 
      params: { month } 
    });
    return response.data.data;
  },

  /**
   * Get available archive months
   */
  getArchiveMonths: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/logs/archive-months');
    return response.data.data;
  },

  /**
   * Clear current logs (archives them first) - Admin only
   */
  clearCurrent: async (): Promise<void> => {
    await api.delete('/logs/clear');
  },
};

export default logsApi;
