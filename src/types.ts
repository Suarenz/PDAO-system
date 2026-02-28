import { LucideIcon } from "lucide-react";

export interface StatCardData {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string; // Tailwind class for background
  description?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface FilterState {
  barangay: string;
  year: string;
  disabilityType: string;
}

export enum Gender {
  Male = "Male",
  Female = "Female"
}

// Data definitions for specific charts
export interface AgeGroupData {
  range: string;
  count: number;
}

export interface BarangayData {
  name: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  name: string;
  pwdNumber: string | null; // Null if new applicant
  barangay: string;
  dateAdded: string;
  status: 'Active' | 'Pending' | 'Review';
  type: string;
  avatarUrl: string;
}

export interface PendingRegistration {
  id: string;
  name: string;
  dateSubmitted: string;
  barangay: string;
  category: string;
  submissionType: 'NEW' | 'EXISTING';
  status: 'PENDING' | 'REJECTED' | 'UNDER_REVIEW';
}