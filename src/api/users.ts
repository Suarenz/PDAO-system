import api, { 
  ApiResponse, 
  PaginatedResponse, 
  User 
} from './client';

export interface UserFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  role?: string;
  search?: string;
  with_trashed?: boolean;
  page?: number;
  per_page?: number;
}

export interface CreateUserData {
  id_number?: string;
  username?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  password: string;
  role: 'ADMIN' | 'STAFF' | 'ENCODER' | 'USER' | 'PWD MEMBER';
  unit?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserData {
  id_number?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  password?: string;
  role?: 'ADMIN' | 'STAFF' | 'ENCODER' | 'USER' | 'PWD MEMBER';
  unit?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UserDetail extends User {
  username?: string;
  middle_name?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  /**
   * Get all users with pagination and filters
   */
  getAll: async (filters: UserFilters = {}): Promise<PaginatedResponse<UserDetail>> => {
    const response = await api.get<PaginatedResponse<UserDetail>>('/users', { params: filters });
    return response.data;
  },

  /**
   * Get single user by ID
   */
  getById: async (id: number): Promise<UserDetail> => {
    const response = await api.get<ApiResponse<UserDetail>>(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Create new user
   */
  create: async (data: CreateUserData): Promise<UserDetail> => {
    const response = await api.post<ApiResponse<UserDetail>>('/users', data);
    return response.data.data;
  },

  /**
   * Update user
   */
  update: async (id: number, data: UpdateUserData): Promise<UserDetail> => {
    const response = await api.put<ApiResponse<UserDetail>>(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete user (soft delete)
   */
  delete: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`/users/${id}`, { params: { force } });
  },

  /**
   * Restore soft-deleted user
   */
  restore: async (id: number): Promise<UserDetail> => {
    const response = await api.post<ApiResponse<UserDetail>>(`/users/${id}/restore`);
    return response.data.data;
  },
};

export default usersApi;
