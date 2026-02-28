import api, { 
  ApiResponse, 
  PaginatedResponse, 
  DashboardStats 
} from './client';

export interface ChartData {
  name: string;
  count: number;
  value?: number;
  fill?: string;
}

export interface MonthlyTrendData {
  month: string;
  count: number;
}

export interface RecentPwd {
  id: number;
  name: string;
  pwd_number: string | null;
  barangay: string | null;
  disability_type: string | null;
  status: string;
  date_added: string;
}

export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  getStats: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/dashboard/stats', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by barangay
   */
  getByBarangay: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-barangay', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by disability type
   */
  getByDisabilityType: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-disability-type', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by age group
   */
  getByAgeGroup: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-age-group', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by employment status
   */
  getByEmployment: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-employment', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by gender
   */
  getByGender: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-gender', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by income bracket
   */
  getByIncome: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-income', { params });
    return response.data.data;
  },

  /**
   * Get PWD count by living arrangement
   */
  getByLivingArrangement: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/by-living-arrangement', { params });
    return response.data.data;
  },

  /**
   * Get deceased PWD count by age group
   */
  getDeceasedByAge: async (params?: Record<string, any>): Promise<ChartData[]> => {
    const response = await api.get<ApiResponse<ChartData[]>>('/dashboard/deceased-by-age', { params });
    return response.data.data;
  },

  /**
   * Get monthly registration trend
   */
  getMonthlyTrend: async (year?: number): Promise<MonthlyTrendData[]> => {
    const response = await api.get<ApiResponse<MonthlyTrendData[]>>('/dashboard/monthly-trend', { 
      params: { year } 
    });
    return response.data.data;
  },

  /**
   * Get recent PWD registrations
   */
  getRecentActivity: async (limit: number = 10): Promise<RecentPwd[]> => {
    const response = await api.get<ApiResponse<RecentPwd[]>>('/dashboard/recent-activity', { 
      params: { limit } 
    });
    return response.data.data;
  },
};

export default dashboardApi;
