import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  MapPin,
  Briefcase,
  Activity,
  HeartHandshake,
  ShieldCheck,
  Save,
  Send,
  Loader2,
  AlertCircle,
  Eye,
  Edit3,
  MessageSquare,
  CheckCircle2,
  FileText,
  Calendar,
} from 'lucide-react';
import type { ApplicationStatus, ApplicationStep } from './types';
import { BARANGAY_OPTIONS } from '../constants';
import { pwdApi } from '../api/pwd';
import { authApi } from '../api/auth';
import { extractApiErrorMessage } from '../api/errors';
import type { DisabilityType, Barangay } from '../api/client';
import Modal from '../components/Modal';

const DRAFT_STORAGE_KEY_BASE = 'pdao_application_draft';

interface MyApplicationProps {
  userId?: string | number;
  applicationStatus?: ApplicationStatus;
  returnComment?: string;
  returnedFields?: string[];
  onSaveDraft?: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onStatusChange?: (status: ApplicationStatus) => void;
}

const STEPS: { label: string; icon: React.ReactNode; description: string }[] = [
  { label: 'Personal Info', icon: <User size={18} />, description: 'Basic personal details' },
  { label: 'Address', icon: <MapPin size={18} />, description: 'Current residence' },
  { label: 'Disability', icon: <Activity size={18} />, description: 'Disability details' },
  { label: 'Employment', icon: <Briefcase size={18} />, description: 'Work & education' },
  { label: 'Family', icon: <HeartHandshake size={18} />, description: 'Guardian & family info' },
  { label: 'Review', icon: <ShieldCheck size={18} />, description: 'Confirm & submit' },
];

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, disabled, highlighted, type = 'text', placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 min-h-[44px]
        ${highlighted
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 ring-2 ring-amber-400/30'
          : disabled
            ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        } outline-none`}
      aria-required={required}
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
}> = ({ label, value, onChange, options, required, disabled, highlighted }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 min-h-[44px]
        ${highlighted
          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 ring-2 ring-amber-400/30'
          : disabled
            ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        } outline-none`}
      aria-required={required}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const MyApplication: React.FC<MyApplicationProps> = ({
  userId,
  applicationStatus,
  returnComment,
  returnedFields = [],
  onSaveDraft,
  onSubmit,
  onStatusChange,
}) => {
  const DRAFT_STORAGE_KEY = userId ? `${DRAFT_STORAGE_KEY_BASE}_${userId}` : DRAFT_STORAGE_KEY_BASE;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showSubmitSuccessModal, setShowSubmitSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [disabilityTypes, setDisabilityTypes] = useState<DisabilityType[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const isSubmitted = applicationStatus && !['DRAFT', 'RETURNED'].includes(applicationStatus);
  const isReturned = applicationStatus === 'RETURNED';
  const isReadOnly = isSubmitted && !isReturned;

  const initialFormData = {
    lastName: '', firstName: '', middleName: '', suffix: '',
    dob: '', sex: '', civilStatus: '', bloodType: '',
    religion: '', ethnicGroup: '',
    houseNoStreet: '', barangay: '', city: 'Pagsanjan', province: 'Laguna', region: '4A',
    mobileNo: '', email: '', landlineNo: '',
    disabilityType: '', disabilityTypeSpecify: '', causeOfDisability: '',
    educationalAttainment: '', employmentStatus: '',
    occupation: '', typeOfEmployment: '',
    sourceOfIncome: '', sssNo: '', gsisNo: '', pagibigNo: '', philhealthNo: '',
    husbandName: '', wifeName: '', spouseName: '', spouseAge: '', livingArrangement: '',
    fatherLName: '', fatherFName: '', fatherMName: '',
    motherLName: '', motherFName: '', motherMName: '',
    guardianLName: '', guardianFName: '', guardianMName: '',
    guardianContactNo: '',
  };

  // Load draft from localStorage on mount
  const [formData, setFormData] = useState(() => {
    try {
      // If we are in read-only mode, we'll fetch from API instead of draft
      if (applicationStatus && applicationStatus !== 'DRAFT' && applicationStatus !== 'RETURNED') {
        return initialFormData;
      }

      // Try user-specific key first
      let saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      
      // Migration: If no user-specific draft, try the legacy generic key
      if (!saved && userId) {
        saved = localStorage.getItem(DRAFT_STORAGE_KEY_BASE);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialFormData, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    return initialFormData;
  });

  // Fetch application data from API if already submitted
  useEffect(() => {
    if (applicationStatus && applicationStatus !== 'DRAFT') {
      const fetchApplication = async () => {
        setIsLoading(true);
        try {
          const data = await authApi.getApplication();
          if (data && data.formData) {
            setFormData(prev => ({ ...prev, ...data.formData }));
          }
        } catch (error) {
          console.error('Failed to fetch application data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchApplication();
    }
  }, [applicationStatus]);

  // Fetch disability types from API on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const lookups = await pwdApi.getLookups();
        setDisabilityTypes(lookups.disability_types);
        setBarangays(lookups.barangays);
      } catch (error) {
        console.error('Failed to fetch lookups:', error);
      }
    };
    fetchLookups();
  }, []);

  // Auto-save draft to localStorage whenever formData changes (debounced)
  useEffect(() => {
    if (isReadOnly) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, isReadOnly]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const isFieldHighlighted = (field: string) => isReturned && returnedFields.includes(field);
  const isFieldDisabled = (field: string) => {
    if (!isReturned && isReadOnly) return true;
    if (isReturned && !returnedFields.includes(field) && returnedFields.length > 0) return true;
    return false;
  };

  // Validate current step before allowing next
  const validateCurrentStep = (): string[] => {
    const errors: string[] = [];
    switch (currentStep) {
      case 0: // Personal Info
        if (!formData.lastName.trim()) errors.push('Last Name is required');
        if (!formData.firstName.trim()) errors.push('First Name is required');
        if (!formData.dob) errors.push('Date of Birth is required');
        if (!formData.sex) errors.push('Sex is required');
        if (!formData.civilStatus) errors.push('Civil Status is required');
        break;
      case 1: // Address
        if (!formData.houseNoStreet.trim()) errors.push('House No. / Street is required');
        if (!formData.barangay) errors.push('Barangay is required');
        if (!formData.mobileNo.trim()) errors.push('Mobile Number is required');
        if (formData.mobileNo && formData.mobileNo.replace(/\D/g, '').length !== 11) {
          errors.push('Mobile Number must be exactly 11 digits');
        }
        break;
      case 2: // Disability
        if (!formData.disabilityType) errors.push('Type of Disability is required');
        if (!formData.causeOfDisability) errors.push('Cause of Disability is required');
        break;
      case 3: // Employment - no required fields
        break;
      case 4: // Family - no required fields
        break;
    }
    return errors;
  };

  const handleNextStep = () => {
    // Skip validation if in read-only mode, as data is already submitted 
    // and we want to allow the user to navigate through the steps
    if (!isReadOnly) {
      const errors = validateCurrentStep();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
    }
    setValidationErrors([]);
    setCurrentStep(currentStep + 1);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      onSaveDraft?.(formData);
      setSavedMessage('Draft saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // Find barangay ID from name
      const barangayId = barangays.find(b => b.name === formData.barangay)?.id || null;

      // Find disability type ID
      const disabilityType = disabilityTypes.find(dt => dt.name === formData.disabilityType);
      const disabilities = disabilityType ? [{
        disability_type_id: disabilityType.id,
        cause: formData.causeOfDisability as 'Acquired' | 'Congenital' | null || null,
        cause_details: formData.disabilityType === 'Other' ? formData.disabilityTypeSpecify : null,
      }] : undefined;

      // Build family members array
      const family: any[] = [];
      if (formData.spouseName) {
        // Simple splitting for spouse name
        const spouseNames = formData.spouseName.trim().split(' ');
        family.push({ 
          relation_type: 'Spouse', 
          first_name: spouseNames[0] || null, 
          last_name: spouseNames.slice(1).join(' ') || null, 
          middle_name: null,
          age: formData.spouseAge ? parseInt(formData.spouseAge) : null 
        });
      }
      if (formData.fatherFName || formData.fatherLName) {
        family.push({ relation_type: 'Father', first_name: formData.fatherFName || null, last_name: formData.fatherLName || null, middle_name: formData.fatherMName || null });
      }
      if (formData.motherFName || formData.motherLName) {
        family.push({ relation_type: 'Mother', first_name: formData.motherFName || null, last_name: formData.motherLName || null, middle_name: formData.motherMName || null });
      }
      if (formData.guardianFName || formData.guardianLName) {
        family.push({ relation_type: 'Guardian', first_name: formData.guardianFName || null, last_name: formData.guardianLName || null, middle_name: formData.guardianMName || null });
      }

      const government_ids = [];
      if (formData.sssNo) government_ids.push({ id_type: 'SSS', id_number: formData.sssNo });
      if (formData.gsisNo) government_ids.push({ id_type: 'GSIS', id_number: formData.gsisNo });
      if (formData.pagibigNo) government_ids.push({ id_type: 'Pag-IBIG', id_number: formData.pagibigNo });
      if (formData.philhealthNo) government_ids.push({ id_type: 'PhilHealth', id_number: formData.philhealthNo });

      // Build the API payload
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        suffix: formData.suffix || null,
        date_applied: new Date().toISOString().split('T')[0],
        submission_type: 'NEW' as const,
        create_pending: true, // Always require approval for user submissions

        personal_info: {
          birth_date: formData.dob || null,
          sex: (formData.sex as 'Male' | 'Female') || null,
          religion: formData.religion || null,
          ethnic_group: formData.ethnicGroup || null,
          civil_status: formData.civilStatus || null,
          blood_type: formData.bloodType || null,
        },

        address: {
          house_street: formData.houseNoStreet || null,
          barangay_id: barangayId,
          city: formData.city || null,
          province: formData.province || null,
          region: formData.region || null,
        },

        contacts: {
          mobile: formData.mobileNo || null,
          landline: formData.landlineNo || null,
          email: formData.email || null,
          guardian_contact: formData.guardianContactNo || null,
        },

        disabilities,

        employment: {
          status: formData.employmentStatus || null,
          type: formData.typeOfEmployment || null,
          occupation: formData.occupation || null,
        },

        education: {
          attainment: formData.educationalAttainment || null,
        },

        family: family.length > 0 ? family : undefined,
        government_ids: government_ids.length > 0 ? government_ids : undefined,
        household_info: {
          income_source: formData.sourceOfIncome || null,
          living_arrangement: formData.livingArrangement || null,
        },
      };

      if (isReturned) {
        // Resubmit updated application through the resubmit endpoint
        await authApi.resubmitApplication(payload as any);
      } else {
        await pwdApi.create(payload as any);
      }

      // Clear draft from localStorage on successful submission
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_STORAGE_KEY_BASE);

      onSubmit?.(formData);
      onStatusChange?.('SUBMITTED');
      setShowSubmitSuccessModal(true);
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      setSubmitError(extractApiErrorMessage(error, 'Failed to submit application. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your application details...</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Last Name" value={formData.lastName} onChange={(v) => updateField('lastName', v)} required disabled={isFieldDisabled('lastName')} highlighted={isFieldHighlighted('lastName')} />
            <InputField label="First Name" value={formData.firstName} onChange={(v) => updateField('firstName', v)} required disabled={isFieldDisabled('firstName')} highlighted={isFieldHighlighted('firstName')} />
            <InputField label="Middle Name" value={formData.middleName} onChange={(v) => updateField('middleName', v)} disabled={isFieldDisabled('middleName')} highlighted={isFieldHighlighted('middleName')} />
            <InputField label="Suffix" value={formData.suffix} onChange={(v) => updateField('suffix', v)} disabled={isFieldDisabled('suffix')} highlighted={isFieldHighlighted('suffix')} placeholder="Jr., Sr., III, etc." />
            <InputField label="Date of Birth" value={formData.dob} onChange={(v) => updateField('dob', v)} required type="date" disabled={isFieldDisabled('dob')} highlighted={isFieldHighlighted('dob')} />
            <SelectField label="Sex" value={formData.sex} onChange={(v) => updateField('sex', v)} options={['Male', 'Female']} required disabled={isFieldDisabled('sex')} highlighted={isFieldHighlighted('sex')} />
            <SelectField label="Civil Status" value={formData.civilStatus} onChange={(v) => updateField('civilStatus', v)} options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced']} required disabled={isFieldDisabled('civilStatus')} highlighted={isFieldHighlighted('civilStatus')} />
            <SelectField label="Blood Type" value={formData.bloodType} onChange={(v) => updateField('bloodType', v)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} disabled={isFieldDisabled('bloodType')} highlighted={isFieldHighlighted('bloodType')} />
            <InputField label="Religion" value={formData.religion} onChange={(v) => updateField('religion', v)} disabled={isFieldDisabled('religion')} highlighted={isFieldHighlighted('religion')} />
            <InputField label="Ethnic Group" value={formData.ethnicGroup} onChange={(v) => updateField('ethnicGroup', v)} disabled={isFieldDisabled('ethnicGroup')} highlighted={isFieldHighlighted('ethnicGroup')} />
          </div>
        );

      case 1: // Address
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField label="House No. / Street" value={formData.houseNoStreet} onChange={(v) => updateField('houseNoStreet', v)} required disabled={isFieldDisabled('houseNoStreet')} highlighted={isFieldHighlighted('houseNoStreet')} />
            </div>
            <SelectField label="Barangay" value={formData.barangay} onChange={(v) => updateField('barangay', v)} options={BARANGAY_OPTIONS.filter(b => b !== 'All Barangays')} required disabled={isFieldDisabled('barangay')} highlighted={isFieldHighlighted('barangay')} />
            <InputField label="City / Municipality" value={formData.city} onChange={(v) => updateField('city', v)} disabled={true} />
            <InputField label="Province" value={formData.province} onChange={(v) => updateField('province', v)} disabled={true} />
            <InputField label="Region" value={formData.region} onChange={(v) => updateField('region', v)} disabled={true} />
            <InputField label="Mobile Number" value={formData.mobileNo} onChange={(v) => updateField('mobileNo', v)} required type="tel" disabled={isFieldDisabled('mobileNo')} highlighted={isFieldHighlighted('mobileNo')} placeholder="09XXXXXXXXX" />
            <InputField label="Email Address" value={formData.email} onChange={(v) => updateField('email', v)} type="email" disabled={isFieldDisabled('email')} highlighted={isFieldHighlighted('email')} />
            <InputField label="Landline Number" value={formData.landlineNo} onChange={(v) => updateField('landlineNo', v)} type="tel" disabled={isFieldDisabled('landlineNo')} highlighted={isFieldHighlighted('landlineNo')} />
          </div>
        );

      case 2: // Disability
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Type of Disability" value={formData.disabilityType} onChange={(v) => updateField('disabilityType', v)} options={disabilityTypes.map(dt => dt.name)} required disabled={isFieldDisabled('disabilityType')} highlighted={isFieldHighlighted('disabilityType')} />
            {formData.disabilityType === 'Other' && (
              <InputField label="Others (Specify)" value={formData.disabilityTypeSpecify} onChange={(v) => updateField('disabilityTypeSpecify', v)} required disabled={isFieldDisabled('disabilityTypeSpecify')} highlighted={isFieldHighlighted('disabilityTypeSpecify')} />
            )}
            <SelectField label="Cause of Disability" value={formData.causeOfDisability} onChange={(v) => updateField('causeOfDisability', v)} options={['Congenital', 'Acquired']} required disabled={isFieldDisabled('causeOfDisability')} highlighted={isFieldHighlighted('causeOfDisability')} />
          </div>
        );

      case 3: // Employment
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Educational Attainment" value={formData.educationalAttainment} onChange={(v) => updateField('educationalAttainment', v)} options={['None', 'Kindergarten', 'Elementary', 'Junior High School', 'Senior High School', 'College', 'Vocational', 'Post Graduate']} disabled={isFieldDisabled('educationalAttainment')} highlighted={isFieldHighlighted('educationalAttainment')} />
              <SelectField label="Employment Status" value={formData.employmentStatus} onChange={(v) => updateField('employmentStatus', v)} options={['Employed', 'Unemployed', 'Self-Employed']} disabled={isFieldDisabled('employmentStatus')} highlighted={isFieldHighlighted('employmentStatus')} />
              <InputField label="Occupation" value={formData.occupation} onChange={(v) => updateField('occupation', v)} disabled={isFieldDisabled('occupation')} highlighted={isFieldHighlighted('occupation')} />
              <SelectField label="Type of Employment" value={formData.typeOfEmployment} onChange={(v) => updateField('typeOfEmployment', v)} options={['Permanent/Regular', 'Seasonal', 'Casual', 'Emergency']} disabled={isFieldDisabled('typeOfEmployment')} highlighted={isFieldHighlighted('typeOfEmployment')} />
              <InputField label="Source of Income" value={formData.sourceOfIncome} onChange={(v) => updateField('sourceOfIncome', v)} disabled={isFieldDisabled('sourceOfIncome')} highlighted={isFieldHighlighted('sourceOfIncome')} />
            </div>
            
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Government IDs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="SSS No." value={formData.sssNo} onChange={(v) => updateField('sssNo', v)} disabled={isFieldDisabled('sssNo')} highlighted={isFieldHighlighted('sssNo')} />
                <InputField label="GSIS No." value={formData.gsisNo} onChange={(v) => updateField('gsisNo', v)} disabled={isFieldDisabled('gsisNo')} highlighted={isFieldHighlighted('gsisNo')} />
                <InputField label="PAG-IBIG No." value={formData.pagibigNo} onChange={(v) => updateField('pagibigNo', v)} disabled={isFieldDisabled('pagibigNo')} highlighted={isFieldHighlighted('pagibigNo')} />
                <InputField label="PHILHEALTH No." value={formData.philhealthNo} onChange={(v) => updateField('philhealthNo', v)} disabled={isFieldDisabled('philhealthNo')} highlighted={isFieldHighlighted('philhealthNo')} />
              </div>
            </div>
          </div>
        );

      case 4: // Family
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Spouse & Living Arrangement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <InputField label="Name of Spouse" value={formData.spouseName} onChange={(v) => updateField('spouseName', v)} disabled={isFieldDisabled('spouseName')} placeholder="Last Name, First Name Middle Name" />
                </div>
                <InputField label="Spouse Age" value={formData.spouseAge} onChange={(v) => updateField('spouseAge', v)} type="number" disabled={isFieldDisabled('spouseAge')} />
                <div className="md:col-span-3">
                  <SelectField label="Living Arrangement" value={formData.livingArrangement} onChange={(v) => updateField('livingArrangement', v)} options={['Living Alone', 'Living with Husband/Wife', 'Living with Family']} disabled={isFieldDisabled('livingArrangement')} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Father's Name
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Last Name" value={formData.fatherLName} onChange={(v) => updateField('fatherLName', v)} disabled={isFieldDisabled('fatherLName')} />
                <InputField label="First Name" value={formData.fatherFName} onChange={(v) => updateField('fatherFName', v)} disabled={isFieldDisabled('fatherFName')} />
                <InputField label="Middle Name" value={formData.fatherMName} onChange={(v) => updateField('fatherMName', v)} disabled={isFieldDisabled('fatherMName')} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Mother's Name
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Last Name" value={formData.motherLName} onChange={(v) => updateField('motherLName', v)} disabled={isFieldDisabled('motherLName')} />
                <InputField label="First Name" value={formData.motherFName} onChange={(v) => updateField('motherFName', v)} disabled={isFieldDisabled('motherFName')} />
                <InputField label="Middle Name" value={formData.motherMName} onChange={(v) => updateField('motherMName', v)} disabled={isFieldDisabled('motherMName')} />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Guardian
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Last Name" value={formData.guardianLName} onChange={(v) => updateField('guardianLName', v)} disabled={isFieldDisabled('guardianLName')} />
                <InputField label="First Name" value={formData.guardianFName} onChange={(v) => updateField('guardianFName', v)} disabled={isFieldDisabled('guardianFName')} />
                <InputField label="Middle Name" value={formData.guardianMName} onChange={(v) => updateField('guardianMName', v)} disabled={isFieldDisabled('guardianMName')} />
              </div>
              <div className="mt-4">
                <InputField label="Guardian Contact No." value={formData.guardianContactNo} onChange={(v) => updateField('guardianContactNo', v)} type="tel" disabled={isFieldDisabled('guardianContactNo')} placeholder="09XXXXXXXXX" />
              </div>
            </div>
          </div>
        );

      case 5: // Review
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                <Eye size={16} />
                Please review all information before submitting. Once submitted, you will not be able to edit until reviewed.
              </p>
            </div>

            {/* Summary */}
            {[
              { title: 'Personal Information', fields: [
                { label: 'Full Name', value: `${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`.trim() },
                { label: 'Date of Birth', value: formData.dob },
                { label: 'Sex', value: formData.sex },
                { label: 'Civil Status', value: formData.civilStatus },
              ]},
              { title: 'Address', fields: [
                { label: 'Full Address', value: `${formData.houseNoStreet}, ${formData.barangay}, ${formData.city}, ${formData.province}` },
                { label: 'Mobile', value: formData.mobileNo },
                { label: 'Email', value: formData.email || 'N/A' },
              ]},
              { title: 'Disability', fields: [
                { label: 'Type', value: formData.disabilityType },
                { label: 'Cause', value: formData.causeOfDisability },
                ...(formData.disabilityType === 'Other' ? [{ label: 'Specified', value: formData.disabilityTypeSpecify }] : [])
              ]},
              { title: 'Employment', fields: [
                { label: 'Education', value: formData.educationalAttainment || 'N/A' },
                { label: 'Status', value: formData.employmentStatus || 'N/A' },
                { label: 'Occupation', value: formData.occupation || 'N/A' },
                { label: 'Income Source', value: formData.sourceOfIncome || 'N/A' },
                { label: 'SSS', value: formData.sssNo || 'N/A' },
                { label: 'GSIS', value: formData.gsisNo || 'N/A' },
                { label: 'Pag-IBIG', value: formData.pagibigNo || 'N/A' },
                { label: 'PhilHealth', value: formData.philhealthNo || 'N/A' },
              ]}, 
              { title: 'Family', fields: [
                { label: 'Spouse', value: formData.spouseName || 'N/A' },
                { label: 'Spouse Age', value: formData.spouseAge || 'N/A' },
                { label: 'Living Arrangement', value: formData.livingArrangement || 'N/A' },
                { label: 'Guardian', value: `${formData.guardianFName} ${formData.guardianLName}`.trim() || 'N/A' },
              ]},
            ].map((section) => (
              <div key={section.title} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.fields.map((f) => (
                    <div key={f.label}>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">{f.label}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            My Application
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isReadOnly ? 'Your submitted application (read-only)' : isReturned ? 'Please update the highlighted fields and resubmit' : 'Complete all steps to submit your PWD ID application'}
          </p>
        </div>
        {isReadOnly && (
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Read Only
          </span>
        )}
      </div>

      {/* Return Comment */}
      {isReturned && returnComment && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <MessageSquare size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Admin Comment</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{returnComment}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <React.Fragment key={step.label}>
                <button
                  onClick={() => !isReadOnly && setCurrentStep(index)}
                  disabled={isReadOnly}
                  className={`flex flex-col items-center gap-1.5 min-w-[80px] px-2 py-2 rounded-xl transition-all
                    ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                    ${!isReadOnly ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : 'cursor-default'}
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
                  `}>
                    {isCompleted ? <Check size={18} /> : step.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center
                    ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}
                  `}>
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm min-h-[300px]">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
          {STEPS[currentStep].icon}
          {STEPS[currentStep].label}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{STEPS[currentStep].description}</p>
        {renderStep()}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Please fix the following:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-300">{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-fadeIn">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {submitError}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => { setCurrentStep(Math.max(0, currentStep - 1)); setValidationErrors([]); }}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[48px]"
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div className="flex items-center gap-3">
          {/* Saved confirmation */}
          {savedMessage && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 size={16} /> {savedMessage}
            </span>
          )}

          {/* Save Draft */}
          {!isReadOnly && (
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all min-h-[48px]"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Draft
            </button>
          )}

          {/* Next / Submit */}
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all min-h-[48px]"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : !isReadOnly ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-lg shadow-green-600/20 transition-all min-h-[48px]"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isReturned ? 'Resubmit Application' : 'Submit Application'}
            </button>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={showSubmitSuccessModal}
        onClose={() => setShowSubmitSuccessModal(false)}
        onConfirm={() => setShowSubmitSuccessModal(false)}
        type="success"
        title="Application Submitted"
        message={isReturned
          ? 'Your application has been resubmitted successfully and is now back in the review queue.'
          : 'Your application has been submitted successfully and is now in the review queue.'}
        confirmText="OK"
        showCancel={false}
      />
    </div>
  );
};

export default MyApplication;
