import api from './client';

export interface IdCardLayoutItem {
  id: string;
  label: string;
  top: number;
  left: number;
  fontSize: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
}

export interface IdCardTemplateData {
  front: IdCardLayoutItem[];
  back: IdCardLayoutItem[];
  front_image: string | null;
  back_image: string | null;
}

export interface IdCardTemplateRecord {
  id: number;
  template_name: string;
  side: 'front' | 'back';
  styles: IdCardLayoutItem[];
  image_path: string | null;
  image_url: string | null;
  is_active: boolean;
  created_by: number | null;
  creator?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

const templateApi = {
  /**
   * Get the currently active template (both sides) with image URLs.
   */
  async getActive(): Promise<IdCardTemplateData> {
    const { data } = await api.get('/id-templates/active');
    return data.data;
  },

  /**
   * Get all template history (admin only).
   */
  async getAll(): Promise<IdCardTemplateRecord[]> {
    const { data } = await api.get('/id-templates');
    return data.data;
  },

  /**
   * Save both sides of the template at once (admin only).
   */
  async saveBoth(
    front: IdCardLayoutItem[],
    back: IdCardLayoutItem[],
    templateName?: string
  ): Promise<{ front: IdCardTemplateRecord; back: IdCardTemplateRecord }> {
    const { data } = await api.post('/id-templates/save-both', {
      front,
      back,
      template_name: templateName || 'Default',
    });
    return data.data;
  },

  /**
   * Save one side of the template (admin only).
   */
  async save(
    side: 'front' | 'back',
    styles: IdCardLayoutItem[],
    templateName?: string
  ): Promise<IdCardTemplateRecord> {
    const { data } = await api.post('/id-templates', {
      side,
      styles,
      template_name: templateName || 'Default',
    });
    return data.data;
  },

  /**
   * Upload a background image for a side of the card.
   */
  async uploadImage(
    side: 'front' | 'back',
    file: File
  ): Promise<{ side: string; image_url: string; path: string }> {
    const formData = new FormData();
    formData.append('side', side);
    formData.append('image', file);
    const { data } = await api.post('/id-templates/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  /**
   * Revert a side's background image to the built-in default.
   */
  async revertImage(side: 'front' | 'back'): Promise<{ side: string }> {
    const { data } = await api.post('/id-templates/revert-image', { side });
    return data.data;
  },
};

export default templateApi;
