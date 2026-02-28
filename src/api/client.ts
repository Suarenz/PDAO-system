import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Base URL - uses Vite proxy in development, direct URL in production
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

const getHeaderValue = (headers: any, name: string): string => {
  if (!headers) return '';
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct.join(';');
  return typeof direct === 'string' ? direct : '';
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const responseType = response.config.responseType;
    const skipContentValidation = response.status === 204 || responseType === 'blob' || responseType === 'arraybuffer' || responseType === 'stream';

    if (!skipContentValidation) {
      const contentType = getHeaderValue(response.headers, 'content-type').toLowerCase();
      if (contentType && !contentType.includes('application/json')) {
        const formatError = new Error('Unexpected server response format.');
        (formatError as any).response = response;
        return Promise.reject(formatError);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      // Only redirect if we're not already logging out
      const url = (error.config?.url || '');
      if (!url.includes('/logout')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Use a small delay to ensure state updates complete
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    
    // Check if the response is HTML (often happens with 500 errors or proxy issues)
    const contentType = error.response?.headers && (error.response.headers['content-type'] || error.response.headers['Content-Type']);
    if (contentType && typeof contentType === 'string' && contentType.includes('text/html')) {
        // Create a user-friendly error instead of returning raw HTML
        const newError = new Error('Server error: The server returned an HTML page instead of JSON. This suggests a backend crash or configuration issue.');
        (newError as any).response = error.response;
        // Strip the data to prevent rendering raw HTML
        if ((newError as any).response) {
            (newError as any).response.data = { message: 'Server returned an invalid response (HTML). Please check server logs.' };
        }
        return Promise.reject(newError);
    }
    
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Auth types
export interface LoginCredentials {
  id_number: string;
  password: string;
}

export interface User {
  id: number;
  id_number?: string;
  username?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STAFF' | 'ENCODER' | 'USER' | 'PWD MEMBER' | 'MAYOR';
  unit?: string;
  initials: string;
  application_status?: string | null;
  pwd_number?: string | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// PWD Profile types
export interface PwdProfile {
  id: number;
  pwd_number: string | null;
  name: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  age: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED';
  barangay: string | null;
  disability_type: string | null;
  sex: 'Male' | 'Female' | null;
  date_applied: string | null;
  created_at: string;
}

export interface PwdProfileFull extends PwdProfile {
  current_version: number;
  remarks: string | null;
  personal_info: {
    birth_date: string | null;
    birth_place: string | null;
    sex: 'Male' | 'Female' | null;
    religion: string | null;
    ethnic_group: string | null;
    civil_status: string | null;
    blood_type: string | null;
  } | null;
  address: {
    house_street: string | null;
    barangay_id: number | null;
    barangay_name: string | null;
    city: string | null;
    province: string | null;
    region: string | null;
  } | null;
  contacts: {
    mobile: string | null;
    landline: string | null;
    email: string | null;
    guardian_contact: string | null;
  } | null;
  disabilities: {
    id: number;
    disability_type_id: number;
    disability_type_name: string;
    cause: 'Acquired' | 'Congenital' | null;
    cause_details: string | null;
    is_primary: boolean;
  }[];
  employment: {
    status: string | null;
    category: string | null;
    type: string | null;
    occupation: string | null;
  } | null;
  education: {
    attainment: string | null;
  } | null;
  family_members: {
    id: number;
    relation_type: string;
    first_name: string | null;
    last_name: string | null;
    middle_name: string | null;
    age: number | null;
  }[];
  government_ids: {
    id: number;
    id_type: string;
    id_number: string | null;
  }[];
  household_info: {
    living_arrangement: string | null;
    receiving_support: boolean | null;
    is_pensioner: boolean | null;
    pension_type: string | null;
    monthly_pension: number | null;
    income_source: string | null;
    monthly_income: number | null;
  } | null;
  organization: {
    organization_name: string | null;
    contact_person: string | null;
    address: string | null;
    telephone: string | null;
  } | null;
  accessibility_needs?: string | null;
  service_needs?: string | null;
}

// Lookup types
export interface Barangay {
  id: number;
  name: string;
  code: string;
}

export interface DisabilityType {
  id: number;
  name: string;
  code: string;
}

export interface Lookups {
  barangays: Barangay[];
  disability_types: DisabilityType[];
}

// Dashboard stats
export interface DashboardStats {
  total_pwd: number;
  male_count: number;
  female_count: number;
  new_this_month: number;
  pending_approvals: number;
  active_count: number;
  inactive_count: number;
  deceased_count: number;
}

// Activity log
export interface ActivityLog {
  id: number;
  action_type: string;
  model_type: string | null;
  model_id: number | null;
  description: string;
  user: string;
  ip_address: string | null;
  created_at: string;
}

// Approval
export interface PendingApproval {
  id: number;
  pwd_profile_id: number;
  name: string;
  submission_type: 'NEW' | 'EXISTING' | 'RENEWAL';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  barangay: string | null;
  disability_type: string | null;
  date_submitted: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

// Backup
export interface Backup {
  id: number;
  file_name: string;
  size: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  notes: string | null;
  created_by: string;
  created_at: string;
  file_exists: boolean;
}

// Report
export interface GeneratedReport {
  id: number;
  file_name: string;
  file_type: 'PDF' | 'EXCEL';
  report_type: string;
  size: string;
  generated_by: string;
  created_at: string;
  file_exists: boolean;
}

export default api;
