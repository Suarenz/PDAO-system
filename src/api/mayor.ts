import api, { ApiResponse } from './client';

// ═══════════════════════════════════════════
// MAYOR EXECUTIVE DASHBOARD API TYPES
// ═══════════════════════════════════════════

export interface MayorOverview {
  total_pwd: number;
  active_count: number;
  deceased_count: number;
  new_this_month: number;
  new_this_year: number;
  male_count: number;
  female_count: number;
  pending_approvals: number;
  employed_count: number;
  employment_rate: number;
}

export interface DistributionItem {
  name: string;
  count: number;
}

export interface MonthlyTrendItem {
  month: string;
  count: number;
}

export interface ServiceRequestsSummary {
  total: number;
  pending: number;
  completed: number;
}

export interface AppointmentsSummary {
  total: number;
  upcoming: number;
  completed: number;
}

export interface MayorExecutiveSummary {
  overview: MayorOverview;
  barangay_distribution: DistributionItem[];
  disability_distribution: DistributionItem[];
  gender_distribution: DistributionItem[];
  age_demographics: DistributionItem[];
  monthly_trend: MonthlyTrendItem[];
  service_requests_summary: ServiceRequestsSummary;
  appointments_summary: AppointmentsSummary;
}

export const mayorApi = {
  /**
   * Get the full executive summary in a single API call
   */
  getExecutiveSummary: async (): Promise<MayorExecutiveSummary> => {
    const response = await api.get<MayorExecutiveSummary>('/mayor/executive-summary');
    return response.data;
  },
};

export default mayorApi;
