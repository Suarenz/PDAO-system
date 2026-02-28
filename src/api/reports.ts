import api, { 
  ApiResponse, 
  PaginatedResponse, 
  GeneratedReport 
} from './client';

export type ReportType = 'YOUTH_PWD' | 'DILG_FORMAT' | 'LGU_COMPLIANCE' | 'MASTERLIST' | 'STATISTICAL_REPORT' | 'QUARTERLY_REPORT' | 'CUSTOM';
export type FileType = 'PDF' | 'EXCEL' | 'CSV';

export interface ReportFilters {
  barangay_id?: number;
  barangay?: string;
  disability_type_id?: number;
  year?: number;
  as_of_date?: string;
  status?: string;
  has_pwd_number?: boolean;
  is_child?: boolean;
}

export interface GenerateReportParams {
  report_type: ReportType;
  file_type: FileType;
  filters?: ReportFilters;
}

export interface ReportPreview {
  title: string;
  generated_at: string;
  rows: Record<string, any>[];
  municipality?: string;
  province?: string;
  total_count?: number;
}

export const reportsApi = {
  /**
   * Get all generated reports
   */
  getAll: async (page?: number, perPage?: number): Promise<PaginatedResponse<GeneratedReport>> => {
    const response = await api.get<PaginatedResponse<GeneratedReport>>('/reports', { 
      params: { page, per_page: perPage } 
    });
    return response.data;
  },

  /**
   * Generate a new report
   */
  generate: async (params: GenerateReportParams): Promise<GeneratedReport> => {
    const response = await api.post<ApiResponse<GeneratedReport>>('/reports/generate', params);
    return response.data.data;
  },

  /**
   * Preview report data before generating
   */
  preview: async (reportType: ReportType, filters?: ReportFilters): Promise<ReportPreview> => {
    const response = await api.post<ApiResponse<ReportPreview>>('/reports/preview', { 
      report_type: reportType, 
      filters 
    });
    return response.data.data;
  },

  /**
   * Download a generated report
   */
  download: async (id: number): Promise<void> => {
    const response = await api.get(`/reports/${id}/download`, { 
      responseType: 'blob' 
    });
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    const contentType = response.headers['content-type'];
    
    let filename = 'report';
    if (contentDisposition) {
      // Improved regex to handle different filename formats
      const match = contentDisposition.match(/filename="?(.+?)"?($|;)/);
      if (match) filename = match[1];
    } else {
      // Fallback extension based on content type
      const extension = contentType === 'application/pdf' ? '.pdf' : '.xlsx';
      filename = `report_${new Date().getTime()}${extension}`;
    }
    
    // Create download link with correct MIME type
    const blob = new Blob([response.data], { type: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Delete a generated report
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/reports/${id}`);
  },
};

export default reportsApi;
