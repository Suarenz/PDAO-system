import api, { 
  ApiResponse, 
  PaginatedResponse, 
  PwdProfile, 
  PwdProfileFull,
  Lookups 
} from './client';

export interface PwdFilters {
  status?: string;
  barangay_id?: number;
  disability_type_id?: number;
  year?: number;
  search?: string;
  with_trashed?: boolean;
  page?: number;
  per_page?: number;
}

export interface PwdFormData {
  pwd_number?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  suffix?: string | null;
  date_applied?: string | null;
  remarks?: string | null;
  accessibility_needs?: string | null;
  service_needs?: string | null;
  submission_type?: 'NEW' | 'EXISTING' | 'RENEWAL';
  create_pending?: boolean;
  
  personal_info?: {
    birth_date?: string | null;
    birth_place?: string | null;
    sex?: 'Male' | 'Female' | null;
    religion?: string | null;
    ethnic_group?: string | null;
    civil_status?: string | null;
    blood_type?: string | null;
  };
  
  address?: {
    house_street?: string | null;
    barangay_id?: number | null;
    city?: string | null;
    province?: string | null;
    region?: string | null;
  };
  
  contacts?: {
    mobile?: string | null;
    landline?: string | null;
    email?: string | null;
    guardian_contact?: string | null;
  };
  
  disabilities?: {
    disability_type_id: number;
    cause?: 'Acquired' | 'Congenital' | null;
    cause_details?: string | null;
  }[];
  
  employment?: {
    status?: string | null;
    category?: string | null;
    type?: string | null;
    occupation?: string | null;
  };
  
  education?: {
    attainment?: string | null;
  };
  
  family?: {
    relation_type: 'Father' | 'Mother' | 'Guardian' | 'Spouse';
    first_name?: string | null;
    last_name?: string | null;
    middle_name?: string | null;
    age?: number | null;
  }[];
  
  government_ids?: {
    id_type: 'SSS' | 'GSIS' | 'PhilHealth' | 'Pag-IBIG';
    id_number?: string | null;
  }[];
  
  household_info?: {
    living_arrangement?: string | null;
    receiving_support?: boolean | null;
    is_pensioner?: boolean | null;
    pension_type?: string | null;
    monthly_pension?: number | null;
    income_source?: string | null;
    monthly_income?: number | null;
  };
  
  organization?: {
    organization_name?: string | null;
    contact_person?: string | null;
    address?: string | null;
    telephone?: string | null;
  };
}

export interface PwdVersion {
  id: number;
  version_number: number;
  change_summary: string;
  changed_by: string;
  changed_at: string;
}

export const pwdApi = {
  /**
   * Get all PWD profiles with pagination and filters
   */
  getAll: async (filters: PwdFilters = {}): Promise<PaginatedResponse<PwdProfile>> => {
    const response = await api.get<PaginatedResponse<PwdProfile>>('/pwd', { params: filters });
    return response.data;
  },

  /**
   * Get single PWD profile by ID
   */
  getById: async (id: number): Promise<PwdProfileFull> => {
    const response = await api.get<ApiResponse<PwdProfileFull>>(`/pwd/${id}`);
    return response.data.data;
  },

  /**
   * Create new PWD profile
   */
  create: async (data: PwdFormData): Promise<PwdProfile> => {
    const response = await api.post<ApiResponse<PwdProfile>>('/pwd', data);
    return response.data.data;
  },

  /**
   * Update PWD profile
   */
  update: async (id: number, data: Partial<PwdFormData>): Promise<PwdProfile> => {
    const response = await api.put<ApiResponse<PwdProfile>>(`/pwd/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete PWD profile (soft delete)
   */
  delete: async (id: number, force: boolean = false): Promise<void> => {
    await api.delete(`/pwd/${id}`, { params: { force } });
  },

  /**
   * Update PWD status
   */
  updateStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE' | 'DECEASED'): Promise<PwdProfile> => {
    const response = await api.patch<ApiResponse<PwdProfile>>(`/pwd/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Get PWD version history
   */
  getVersions: async (id: number): Promise<PwdVersion[]> => {
    const response = await api.get<ApiResponse<PwdVersion[]>>(`/pwd/${id}/versions`);
    return response.data.data;
  },

  /**
   * Restore PWD to specific version (Admin only)
   */
  restoreVersion: async (id: number, versionNumber: number): Promise<PwdProfile> => {
    const response = await api.post<ApiResponse<PwdProfile>>(`/pwd/${id}/restore-version/${versionNumber}`);
    return response.data.data;
  },

  /**
   * Get form lookups (barangays, disability types)
   */
  getLookups: async (): Promise<Lookups> => {
    const response = await api.get<ApiResponse<Lookups>>('/pwd/lookups');
    return response.data.data;
  },

  /**
   * Generate PWD Number for a profile
   */
  generatePwdNumber: async (id: number): Promise<PwdProfile> => {
    const response = await api.post<ApiResponse<PwdProfile>>(`/pwd/${id}/generate-number`);
    return response.data.data;
  },

  /**
   * Search for PWD by PWD Number
   */
  searchByPwdNumber: async (pwdNumber: string): Promise<PwdProfileFull | null> => {
    try {
      const response = await api.get<ApiResponse<PwdProfileFull>>('/pwd/search-by-number', { 
        params: { pwd_number: pwdNumber } 
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Mark PWD ID card as printed (notifies the user)
   */
  markAsPrinted: async (id: number): Promise<any> => {
    const response = await api.patch<ApiResponse<PwdProfile>>(`/pwd/${id}/mark-printed`);
    return response.data;
  },
};

export default pwdApi;
