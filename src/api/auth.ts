import axios from 'axios';
import api, { 
  ApiResponse, 
  LoginCredentials, 
  LoginResponse, 
  User 
} from './client';

/**
 * Fetch CSRF cookie from Laravel Sanctum before making state-changing requests.
 * This sets the XSRF-TOKEN cookie which axios automatically sends as X-XSRF-TOKEN header.
 */
const getCsrfCookie = async (): Promise<void> => {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
};

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    await getCsrfCookie();
    const response = await api.post<ApiResponse<LoginResponse>>('/login', credentials);
    const { user, token } = response.data.data;
    
    // Store token and user in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data.data;
  },

  /**
   * Register user
   */
  register: async (data: any): Promise<LoginResponse> => {
    await getCsrfCookie();
    const response = await api.post<ApiResponse<LoginResponse>>('/register', data);
    const { user, token } = response.data.data;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch (error) {
      // Log the error but don't throw - logout should always clear local state
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   */
  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/me');
    return response.data.data;
  },

  /**
   * Get current user's application details and history
   */
  getApplication: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/me/application');
    return response.data.data;
  },

  /**
   * Resubmit a returned application with updated data
   */
  resubmitApplication: async (formData: Record<string, any>): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/me/application/resubmit', formData);
    return response.data.data;
  },

  /**
   * Update contact information
   */
  updateContact: async (mobile: string, email: string, landline: string, guardianContact: string): Promise<any> => {
    const response = await api.put<ApiResponse<any>>('/me/contact', {
      mobile,
      email,
      landline,
      guardian_contact: guardianContact,
    });
    return response.data.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    await api.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user has specific role
   */
  hasRole: (roles: string | string[]): boolean => {
    const user = authApi.getStoredUser();
    if (!user) return false;
    
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  },

  /**
   * Check if user is admin
   */
  isAdmin: (): boolean => {
    return authApi.hasRole('ADMIN');
  },
};

export default authApi;
