import { ChartDataPoint, BarangayData, RecentActivity, PendingRegistration } from './types';

export const GENDER_DATA: ChartDataPoint[] = [];

export const AGE_GROUP_DATA: { name: string; value: number }[] = [];

export const BARANGAY_DATA: BarangayData[] = [];

export const DISABILITY_TYPE_DATA: { name: string; value: number }[] = [];

export const EMPLOYMENT_DATA: { name: string; value: number; fill: string }[] = [];

export const INCOME_DATA: { name: string; value: number; fill: string }[] = [];

export const LIVING_ARRANGEMENT_DATA: { name: string; value: number; fill: string }[] = [];

export const SUPPORT_TYPE_DATA: { name: string; value: number; fill: string }[] = [];

export const BARANGAY_OPTIONS = [
  "All Barangays", "Anibong", "Poblacion I", "Poblacion II", "Biñan", "Buboy", 
  "Cabanbanan", "Calusiche", "Dingin", "Lambac", "Layugan", "Magdapio", 
  "Maulawin", "Pinagsanjan", "Sabang", "Sampaloc", "San Isidro"
];

// Generate years dynamically: from current year + 5 down to 2019
const generateYearOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear + 5;
  const endYear = 2019;
  const years: string[] = ['All Years'];
  for (let y = startYear; y >= endYear; y--) {
    years.push(String(y));
  }
  return years;
};

export const YEARS_OPTIONS = generateYearOptions();

export const DISABILITY_OPTIONS = [
  "All Types", "Cancer (RA11215)", "Chronic Illness", "Deaf or Hard of Hearing", "Intellectual Disability",
  "Learning Disability", "Mental Disability", "Orthopedic Disability", "Physical Disability", "Psychosocial Disability",
  "Rare Disease (RA10747)", "Speech and Language Impairment", "Visual Disability"
];

export const RECENT_ACTIVITY_DATA: RecentActivity[] = [];

export const PENDING_REGISTRATIONS_DATA: PendingRegistration[] = [];

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'PWD MEMBER' | 'MAYOR';
  unit: string;
  status: 'ACTIVE' | 'INACTIVE';
  initial: string;
}

export const MOCK_ACCOUNTS_DATA: UserAccount[] = [];

export interface LogEntry {
  id: string;
  type: 'approval' | 'update' | 'error' | 'security' | 'report';
  message: string;
  refId: string;
  timestamp: string;
  user: string;
}

export const MOCK_LOGS_DATA: LogEntry[] = [];

export interface GeneratedReport {
  id: string;
  fileName: string;
  type: 'EXCEL' | 'PDF';
  reportType: string;
  dateGenerated: string;
  size: string;
}

export const MOCK_REPORTS_HISTORY: GeneratedReport[] = [];

// ========================================
// REPORT TABLES DATA
// ========================================

export interface YouthDisabilityRow {
  disabilityType: string;
  male: number;
  female: number;
  total: number;
}

export const YOUTH_DISABILITY_DATA: YouthDisabilityRow[] = [];

export interface DILGReportRow {
  disabilityType: string;
  totalIndividuals: number;
  ageRange: string;
  male: number;
  female: number;
  totalInJurisdiction: number;
}

export const DILG_REPORT_DATA: DILGReportRow[] = [];

export interface LGUComplianceRow {
  dataField: string;
  male: number;
  female: number;
  total: number;
  description?: string;
}

export const LGU_COMPLIANCE_DATA: LGUComplianceRow[] = [];