import api, { 
  ApiResponse, 
  PaginatedResponse, 
  Backup 
} from './client';

export const backupsApi = {
  /**
   * Get all backups
   */
  getAll: async (page?: number, perPage?: number): Promise<PaginatedResponse<Backup>> => {
    const response = await api.get<PaginatedResponse<Backup>>('/backups', { 
      params: { page, per_page: perPage } 
    });
    return response.data;
  },

  /**
   * Create a new backup
   */
  create: async (notes?: string): Promise<Backup> => {
    const response = await api.post<ApiResponse<Backup>>('/backups', { notes });
    return response.data.data;
  },

  /**
   * Download a backup file
   */
  download: async (id: number): Promise<void> => {
    const response = await api.get(`/backups/${id}/download`, { 
      responseType: 'blob' 
    });
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'backup.sql';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Restore from a backup by ID
   */
  restoreFromBackup: async (backupId: number): Promise<void> => {
    await api.post('/backups/restore', { backup_id: backupId });
  },

  /**
   * Restore from uploaded file
   */
  restoreFromFile: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    
    await api.post('/backups/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete a backup
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/backups/${id}`);
  },
};

export default backupsApi;
