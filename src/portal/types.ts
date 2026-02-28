// Portal-specific types for PWD User Portal

/**
 * Application Status Flow (Business Rules v2.0):
 * 0 = DRAFT       → User can edit all fields.
 * 1 = PENDING     → Submitted, awaiting review. Read-only.
 * 2 = APPROVED    → Admin verified. Digital ID unlocked. Profile editing restricted (minor fields only).
 * 3 = PRINTED     → Admin marked card as printed. Appointment module unlocked.
 * 4 = ISSUED      → User claimed the physical card. Full Services access (Renewal/Lost).
 */
export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'RETURNED'
  | 'FOR_PRINTING'
  | 'APPROVED'
  | 'PRINTED'
  | 'ISSUED'
  | 'REJECTED';

/** Status IDs mapping from spec */
export const STATUS_ID_MAP: Record<string, number> = {
  DRAFT: 0,
  SUBMITTED: 1,
  PENDING_REVIEW: 1,
  UNDER_REVIEW: 1,
  RETURNED: 1,
  FOR_PRINTING: 1,
  APPROVED: 2,
  PRINTED: 3,
  ISSUED: 4,
  REJECTED: -1,
};

/**
 * Major Details — locked after submission (identity fields).
 * Change requires formal request to Admin.
 */
export const MAJOR_DETAIL_FIELDS = [
  'lastName', 'firstName', 'middleName', 'suffix',
  'dob', 'sex', 'civilStatus', 'bloodType',
  'religion', 'ethnicGroup',
  'disabilityType', 'disabilityTypeSpecify', 'causeOfDisability',
  'houseNoStreet', 'barangay', 'city', 'province', 'region',
  'photo', 'signature',
] as const;

/**
 * Minor Details — always editable by the user (contact fields).
 */
export const MINOR_DETAIL_FIELDS = [
  'mobileNo', 'email', 'landlineNo',
  'guardianContactNo',
] as const;

/**
 * Helper: check if Digital ID should be unlocked
 */
export function isDigitalIdUnlocked(status?: ApplicationStatus): boolean {
  if (!status) return false;
  return ['APPROVED', 'PRINTED', 'ISSUED'].includes(status);
}

/**
 * Helper: check if Appointment module should be unlocked
 */
export function isAppointmentUnlocked(status?: ApplicationStatus): boolean {
  if (!status) return false;
  return ['PRINTED', 'ISSUED'].includes(status);
}

/**
 * Helper: check if Services (Renewal/Lost) should be fully accessible
 */
export function isServicesFullAccess(status?: ApplicationStatus): boolean {
  return status === 'ISSUED';
}

/**
 * Helper: check if the application has been accepted/approved by admin
 * Used to gate Services access and Contact Information visibility
 */
export function isApplicationApproved(status?: ApplicationStatus): boolean {
  if (!status) return false;
  return ['APPROVED', 'FOR_PRINTING', 'PRINTED', 'ISSUED'].includes(status);
}

/**
 * Helper: check if a field is a "Major Detail" (locked post-submission)
 */
export function isMajorDetailField(field: string): boolean {
  return (MAJOR_DETAIL_FIELDS as readonly string[]).includes(field);
}

/**
 * Helper: check if a field is a "Minor Detail" (always editable)
 */
export function isMinorDetailField(field: string): boolean {
  return (MINOR_DETAIL_FIELDS as readonly string[]).includes(field);
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ServiceRequestType =
  | 'LOST_ID'
  | 'DAMAGED_ID'
  | 'RENEWAL';

export type FontSize = 'normal' | 'large' | 'extra-large';
export type ContrastMode = 'light' | 'dark' | 'high-contrast';

export interface ApplicationStep {
  id: number;
  label: string;
  description: string;
  icon: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface ApplicationData {
  id?: string;
  status: ApplicationStatus;
  currentStep: number;
  totalSteps: number;
  submittedAt?: string;
  updatedAt?: string;
  pwdNumber?: string;
  returnComment?: string;
  returnedFields?: string[];
  formData: Record<string, any>;
}

export interface DigitalIdData {
  pwdNumber: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  address: string;
  disabilityType: string;
  bloodType: string;
  photo?: string;
  dateIssued: string;
  expiryDate: string;
  qrCodeData: string;
  guardian?: string;
  contactNo?: string;
}

export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  proxyName?: string;
  proxyRelationship?: string;
  notes?: string;
}

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  createdAt: string;
  affidavitUrl?: string;
  notes?: string;
}

export interface AccessibilitySettings {
  fontSize: FontSize;
  contrastMode: ContrastMode;
  screenReaderMode: boolean;
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

/** Application History timeline event */
export interface ApplicationTimelineEvent {
  status: string;
  label: string;
  date: string;
  description?: string;
}

export type PortalView =
  | 'portal-dashboard'
  | 'portal-application'
  | 'portal-digital-id'
  | 'portal-appointment'
  | 'portal-services'
  | 'portal-profile'
  | 'portal-history';
