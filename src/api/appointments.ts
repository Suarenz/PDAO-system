import api, { ApiResponse, PaginatedResponse } from './client';

export interface AppointmentData {
  id: number;
  user_id: number;
  user_name: string;
  pwd_profile_id: number | null;
  appointment_date: string;
  appointment_time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  proxy_name: string | null;
  proxy_relationship: string | null;
  notes: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface AppointmentSlotAvailability {
  time: string;
  booked: number;
  max: number;
  available: boolean;
}

export interface AppointmentStats {
  today_count: number;
  total_scheduled: number;
  total_completed: number;
  total_cancelled: number;
  total_no_show: number;
}

export interface AppointmentFilters {
  status?: string;
  date?: string;
  page?: number;
  per_page?: number;
}

export const appointmentsApi = {
  getAll: async (filters: AppointmentFilters = {}): Promise<PaginatedResponse<AppointmentData>> => {
    const response = await api.get<PaginatedResponse<AppointmentData>>('/appointments', { params: filters });
    return response.data;
  },

  getMy: async (): Promise<AppointmentData | null> => {
    const response = await api.get<{ success: boolean; data: AppointmentData | null }>('/appointments/my');
    return response.data.data;
  },

  book: async (data: { appointment_date: string; appointment_time: string; proxy_name?: string; proxy_relationship?: string; notes?: string }): Promise<AppointmentData> => {
    const response = await api.post<ApiResponse<AppointmentData>>('/appointments', data);
    return response.data.data;
  },

  getAvailableSlots: async (date: string): Promise<AppointmentSlotAvailability[]> => {
    const response = await api.get<{ success: boolean; data: AppointmentSlotAvailability[]; date: string }>('/appointments/available-slots', { params: { date } });
    return response.data.data;
  },

  getStats: async (): Promise<AppointmentStats> => {
    const response = await api.get<ApiResponse<AppointmentStats>>('/appointments/stats');
    return response.data.data;
  },

  cancel: async (id: number): Promise<void> => {
    await api.post(`/appointments/${id}/cancel`);
  },

  updateStatus: async (id: number, status: string, adminNotes?: string): Promise<void> => {
    await api.patch(`/appointments/${id}/status`, { status, admin_notes: adminNotes });
  },

  notifyIdReady: async (id: number, message?: string): Promise<void> => {
    await api.post(`/appointments/${id}/notify-id-ready`, { message });
  },
};

export default appointmentsApi;
