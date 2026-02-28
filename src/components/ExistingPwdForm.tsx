
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  MapPin, 
  Briefcase, 
  Save,
  IdCard,
  HeartHandshake,
  ShieldCheck,
  Search,
  AlertCircle,
  RefreshCw,
  Edit3,
  FileText,
  CheckCircle2,
  X,
  User,
  Phone,
  Home,
  Heart,
  GraduationCap,
  CreditCard,
  Building2,
  Calendar,
  Loader2
} from 'lucide-react';
import { BARANGAY_OPTIONS } from '../constants';
import { pwdApi } from '../api/pwd';
import type { Barangay, DisabilityType, PwdProfileFull, Lookups } from '../api/client';
import DatePicker from './DatePicker';
import Modal, { useModal } from './Modal';

interface FormProps {
  onCancel: () => void;
  isUserAccount?: boolean;
}

const InputWrapper = ({ label, children, required = false }: { label: string, children?: React.ReactNode, required?: boolean }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label} {required && <span className="text-rose-600 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const ExistingPwdForm: React.FC<FormProps> = ({ onCancel, isUserAccount = false }) => {
  const [mode, setMode] = useState<'lookup' | 'edit'>('lookup');
  const [lookupPwdId, setLookupPwdId] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionType, setActionType] = useState<'update' | 'renewal'>('update');
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [selectedPwd, setSelectedPwd] = useState<PwdProfileFull | null>(null);
  const { showAlert, ModalComponent } = useModal();

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    pwd_number: '',
    birth_date: '',
    birth_place: '',
    sex: '',
    civil_status: '',
    blood_type: '',
    religion: '',
    ethnic_group: '',
    mobile: '',
    landline: '',
    email: '',
    guardian_contact: '',
    house_street: '',
    barangay_id: 0,
    city: '',
    province: '',
    region: '',
    disability_type_id: 0,
    disability_cause: '',
    employment_status: '',
    employment_category: '',
    employment_type: '',
    occupation: '',
    education_attainment: '',
    living_arrangement: '',
    income_source: '',
    monthly_income: 0,
    accessibility_needs: '',
    service_needs: '',
    date_applied: '',
    sss_no: '',
    gsis_no: '',
    philhealth_no: '',
    pagibig_no: '',
    father_first_name: '',
    father_last_name: '',
    father_middle_name: '',
    mother_first_name: '',
    mother_last_name: '',
    mother_middle_name: '',
    guardian_first_name: '',
    guardian_last_name: '',
    guardian_middle_name: '',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_middle_name: '',
    remarks: ''
  });

  // Fetch lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const data = await pwdApi.getLookups();
        setLookups(data);
      } catch (error) {
        console.error('Failed to fetch lookups:', error);
      }
    };
    fetchLookups();
  }, []);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLookup = async () => {
    setLookupError('');
    setIsSearching(true);

    try {
      const pwdData = await pwdApi.searchByPwdNumber(lookupPwdId.trim());
      
      if (pwdData) {
        setSelectedPwd(pwdData);
        
        // Helper to find family member by relation
        const findFamily = (relation: string) => pwdData.family_members?.find(f => f.relation_type === relation);
        const father = findFamily('Father');
        const mother = findFamily('Mother');
        const guardian = findFamily('Guardian');
        const spouse = findFamily('Spouse');
        
        // Helper to find government ID by type
        const findGovId = (type: string) => pwdData.government_ids?.find(g => g.id_type === type);
        
        // Populate edit form with all fields
        setEditForm({
          first_name: pwdData.first_name || '',
          last_name: pwdData.last_name || '',
          middle_name: pwdData.middle_name || '',
          suffix: pwdData.suffix || '',
          pwd_number: pwdData.pwd_number || '',
          birth_date: pwdData.personal_info?.birth_date ? new Date(pwdData.personal_info.birth_date).toISOString().split('T')[0] : '',
          birth_place: pwdData.personal_info?.birth_place || '',
          sex: pwdData.personal_info?.sex || '',
          civil_status: pwdData.personal_info?.civil_status || '',
          blood_type: pwdData.personal_info?.blood_type || '',
          religion: pwdData.personal_info?.religion || '',
          ethnic_group: pwdData.personal_info?.ethnic_group || '',
          mobile: pwdData.contacts?.mobile || '',
          landline: pwdData.contacts?.landline || '',
          email: pwdData.contacts?.email || '',
          guardian_contact: pwdData.contacts?.guardian_contact || '',
          house_street: pwdData.address?.house_street || '',
          barangay_id: pwdData.address?.barangay_id || 0,
          city: pwdData.address?.city || 'Pagsanjan',
          province: pwdData.address?.province || 'Laguna',
          region: pwdData.address?.region || '4A',
          disability_type_id: pwdData.disabilities?.[0]?.disability_type_id || 0,
          disability_cause: pwdData.disabilities?.[0]?.cause || '',
          employment_status: pwdData.employment?.status || '',
          employment_category: pwdData.employment?.category || '',
          employment_type: pwdData.employment?.type || '',
          occupation: pwdData.employment?.occupation || '',
          education_attainment: pwdData.education?.attainment || '',
          living_arrangement: pwdData.household_info?.living_arrangement || '',
          income_source: pwdData.household_info?.income_source || '',
          monthly_income: pwdData.household_info?.monthly_income || 0,
          accessibility_needs: pwdData.accessibility_needs || '',
          service_needs: pwdData.service_needs || '',
          date_applied: pwdData.date_applied ? new Date(pwdData.date_applied).toISOString().split('T')[0] : '',
          sss_no: findGovId('SSS')?.id_number || '',
          gsis_no: findGovId('GSIS')?.id_number || '',
          philhealth_no: findGovId('PhilHealth')?.id_number || '',
          pagibig_no: findGovId('Pag-IBIG')?.id_number || '',
          father_first_name: father?.first_name || '',
          father_last_name: father?.last_name || '',
          father_middle_name: father?.middle_name || '',
          mother_first_name: mother?.first_name || '',
          mother_last_name: mother?.last_name || '',
          mother_middle_name: mother?.middle_name || '',
          guardian_first_name: guardian?.first_name || '',
          guardian_last_name: guardian?.last_name || '',
          guardian_middle_name: guardian?.middle_name || '',
          spouse_first_name: spouse?.first_name || '',
          spouse_last_name: spouse?.last_name || '',
          spouse_middle_name: spouse?.middle_name || '',
          remarks: pwdData.remarks || ''
        });
        
        setMode('edit');
      } else {
        setLookupError('PWD ID not found. Please check the ID number and try again.');
      }
    } catch (error: any) {
      console.error('Failed to search PWD:', error);
      setLookupError('Failed to search for PWD record. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPwd) return;

    // Validation
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.middle_name.trim()) {
      showAlert('Validation Error', 'First Name, Last Name, and Middle Name are required.', 'warning');
      return;
    }
    if (!editForm.birth_date) {
      showAlert('Validation Error', 'Date of Birth is required.', 'warning');
      return;
    }
    if (!editForm.disability_type_id) {
      showAlert('Validation Error', 'Type of Disability is required.', 'warning');
      return;
    }
    if (editForm.mobile) {
      const digitsOnly = editForm.mobile.replace(/\D/g, '');
      if (digitsOnly.length !== 11) {
        showAlert('Validation Error', 'Mobile Number must be exactly 11 digits.', 'warning');
        return;
      }
    } else {
      showAlert('Validation Error', 'Mobile Number is required.', 'warning');
      return;
    }

    setIsSaving(true);
    
    try {
      // Build family members array
      const familyMembers: any[] = [];
      if (editForm.father_first_name || editForm.father_last_name) {
        familyMembers.push({
          relation_type: 'Father',
          first_name: editForm.father_first_name || null,
          last_name: editForm.father_last_name || null,
          middle_name: editForm.father_middle_name || null
        });
      }
      if (editForm.mother_first_name || editForm.mother_last_name) {
        familyMembers.push({
          relation_type: 'Mother',
          first_name: editForm.mother_first_name || null,
          last_name: editForm.mother_last_name || null,
          middle_name: editForm.mother_middle_name || null
        });
      }
      if (editForm.guardian_first_name || editForm.guardian_last_name) {
        familyMembers.push({
          relation_type: 'Guardian',
          first_name: editForm.guardian_first_name || null,
          last_name: editForm.guardian_last_name || null,
          middle_name: editForm.guardian_middle_name || null
        });
      }
      if (editForm.spouse_first_name || editForm.spouse_last_name) {
        familyMembers.push({
          relation_type: 'Spouse',
          first_name: editForm.spouse_first_name || null,
          last_name: editForm.spouse_last_name || null,
          middle_name: editForm.spouse_middle_name || null
        });
      }

      // Build government IDs array
      const governmentIds: any[] = [];
      if (editForm.sss_no) governmentIds.push({ id_type: 'SSS', id_number: editForm.sss_no });
      if (editForm.gsis_no) governmentIds.push({ id_type: 'GSIS', id_number: editForm.gsis_no });
      if (editForm.philhealth_no) governmentIds.push({ id_type: 'PhilHealth', id_number: editForm.philhealth_no });
      if (editForm.pagibig_no) governmentIds.push({ id_type: 'Pag-IBIG', id_number: editForm.pagibig_no });

      await pwdApi.update(selectedPwd.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        middle_name: editForm.middle_name || null,
        suffix: editForm.suffix || null,
        pwd_number: editForm.pwd_number || null,
        date_applied: editForm.date_applied || null,
        remarks: editForm.remarks || null,
        accessibility_needs: editForm.accessibility_needs || null,
        service_needs: editForm.service_needs || null,
        personal_info: {
          birth_date: editForm.birth_date || null,
          birth_place: editForm.birth_place || null,
          sex: editForm.sex as 'Male' | 'Female' | null,
          civil_status: editForm.civil_status || null,
          blood_type: editForm.blood_type || null,
          religion: editForm.religion || null,
          ethnic_group: editForm.ethnic_group || null
        },
        contacts: {
          mobile: editForm.mobile || null,
          landline: editForm.landline || null,
          email: editForm.email || null,
          guardian_contact: editForm.guardian_contact || null
        },
        address: {
          house_street: editForm.house_street || null,
          barangay_id: editForm.barangay_id || null,
          city: editForm.city || null,
          province: editForm.province || null,
          region: editForm.region || null
        },
        disabilities: editForm.disability_type_id ? [{
          disability_type_id: editForm.disability_type_id,
          cause: editForm.disability_cause as 'Acquired' | 'Congenital' | null
        }] : undefined,
        employment: {
          status: editForm.employment_status || null,
          category: editForm.employment_category || null,
          type: editForm.employment_type || null,
          occupation: editForm.occupation || null
        },
        education: {
          attainment: editForm.education_attainment || null
        },
        household_info: {
          living_arrangement: editForm.living_arrangement || null,
          income_source: editForm.income_source || null,
          monthly_income: editForm.monthly_income || null
        },
        family: familyMembers.length > 0 ? familyMembers : undefined,
        government_ids: governmentIds.length > 0 ? governmentIds : undefined
      });
      
      const message = actionType === 'renewal' 
        ? "PWD ID Renewal Submitted Successfully!" 
        : "Record Updated Successfully!";
      setSuccessMessage(message);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to update record:', error);
      setSuccessMessage('Failed to update record. Please try again.');
      setShowSuccessDialog(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToLookup = () => {
    setMode('lookup');
    setLookupPwdId('');
    setLookupError('');
    setSelectedPwd(null);
  };

  // Lookup Screen
  if (mode === 'lookup') {
    return (
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-gray-900/10 flex flex-col h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        <style>{`
          .form-input-pdao {
              width: 100%;
              background-color: #fff;
              border: 1.5px solid #cbd5e1;
              border-radius: 0.85rem;
              padding: 0.85rem 1.25rem;
              font-size: 0.875rem;
              font-weight: 500;
              color: #334155;
              outline: none;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .dark .form-input-pdao {
              background-color: #0f172a;
              border-color: #334155;
              color: #f8fafc;
          }
          .form-input-pdao:focus {
              border-color: #9333ea;
              background-color: #fff;
              box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.1);
          }
          .dark .form-input-pdao:focus {
              background-color: #0f172a;
              box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.2);
          }
        `}</style>

        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">{isUserAccount ? 'Manage Account Information' : 'Existing PWD Record'}</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-widest">{isUserAccount ? 'View & Update Your Details' : 'Search & Update Record'}</p>
        </div>

        {/* Lookup Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="w-full max-w-lg space-y-6 sm:space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 sm:p-6 bg-purple-50 dark:bg-purple-500/10 rounded-2xl sm:rounded-3xl">
                <IdCard size={48} className="sm:w-16 sm:h-16 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Enter PWD ID Number</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm px-4">
                Enter the existing PWD ID number to retrieve and update the record.
              </p>
            </div>

            {/* Input Field */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={lookupPwdId}
                  onChange={(e) => {
                    setLookupPwdId(e.target.value);
                    setLookupError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && lookupPwdId.trim()) {
                      handleLookup();
                    }
                  }}
                  placeholder="e.g., 04-3409-PAG-0000001"
                  className="form-input-pdao text-center text-sm sm:text-lg font-mono tracking-wider pr-10 sm:pr-12"
                />
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                  <Search size={18} className="sm:w-5 sm:h-5 text-slate-400" />
                </div>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-3 sm:p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                  <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{lookupError}</span>
                </div>
              )}

              {/* Action Type Selection */}
              <div className="pt-4">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">Select Action Type</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => setActionType('update')}
                    className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                      actionType === 'update'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Edit3 size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-bold text-xs sm:text-sm">Update Record</span>
                  </button>
                  <button
                    onClick={() => setActionType('renewal')}
                    className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                      actionType === 'renewal'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <RefreshCw size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-bold text-xs sm:text-sm">ID Renewal</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleLookup}
              disabled={!lookupPwdId.trim() || isSearching}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/20 disabled:shadow-none transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Search Record
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        {!isUserAccount && (
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <button onClick={onCancel} className="text-[10px] sm:text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.15em] sm:tracking-[0.2em]">
              Back to selection
            </button>
          </div>
        )}
      </div>
    );
  }

  // Edit Mode - Full Edit Modal
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] shadow-2xl shadow-gray-900/10 flex flex-col h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Edit3 size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {actionType === 'renewal' ? 'PWD ID Renewal' : 'Update PWD Record'}
              </h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                actionType === 'renewal' 
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' 
                  : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
              }`}>
                {actionType === 'renewal' ? 'Renewal' : 'Edit Mode'}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {editForm.first_name} {editForm.middle_name} {editForm.last_name} • <span className="font-mono">{editForm.pwd_number}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={handleBackToLookup}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <X size={24} className="text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personal Information */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-blue-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {!isUserAccount && (
                <div className="md:col-span-4">
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Assigned ID Number</label>
                  <input type="text" value={editForm.pwd_number} onChange={(e) => setEditForm({...editForm, pwd_number: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">First Name *</label>
                <input type="text" value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Middle Name <span className="text-rose-600 ml-0.5">*</span></label>
                <input type="text" value={editForm.middle_name} onChange={(e) => setEditForm({...editForm, middle_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Last Name *</label>
                <input type="text" value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Suffix</label>
                <input type="text" value={editForm.suffix} onChange={(e) => setEditForm({...editForm, suffix: e.target.value})} placeholder="Jr., Sr., III"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <DatePicker 
                  label="Birth Date"
                  required
                  value={editForm.birth_date}
                  onChange={(date) => setEditForm({...editForm, birth_date: date})}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Sex</label>
                <select value={editForm.sex} onChange={(e) => setEditForm({...editForm, sex: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Civil Status</label>
                <select value={editForm.civil_status} onChange={(e) => setEditForm({...editForm, civil_status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Blood Type</label>
                <select value={editForm.blood_type} onChange={(e) => setEditForm({...editForm, blood_type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Religion</label>
                <input type="text" value={editForm.religion} onChange={(e) => setEditForm({...editForm, religion: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Ethnic Group</label>
                <input type="text" value={editForm.ethnic_group} onChange={(e) => setEditForm({...editForm, ethnic_group: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Birth Place</label>
                <input type="text" value={editForm.birth_place} onChange={(e) => setEditForm({...editForm, birth_place: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="text-green-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Mobile</label>
                <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Landline</label>
                <input type="text" value={editForm.landline} onChange={(e) => setEditForm({...editForm, landline: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Guardian Contact</label>
                <input type="text" value={editForm.guardian_contact} onChange={(e) => setEditForm({...editForm, guardian_contact: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Home className="text-orange-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Address</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">House/Street</label>
                <input type="text" value={editForm.house_street} onChange={(e) => setEditForm({...editForm, house_street: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Barangay</label>
                <select value={editForm.barangay_id} onChange={(e) => setEditForm({...editForm, barangay_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value={0}>Select Barangay...</option>
                  {lookups?.barangays.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">City</label>
                <input type="text" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Province</label>
                <input type="text" value={editForm.province} onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Region</label>
                <input type="text" value={editForm.region} onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Disability Info */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="text-red-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Disability Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Disability Type <span className="text-rose-600 ml-0.5">*</span></label>
                <select value={editForm.disability_type_id} onChange={(e) => setEditForm({...editForm, disability_type_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value={0}>Select Type...</option>
                  {lookups?.disability_types.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Cause</label>
                <select value={editForm.disability_cause} onChange={(e) => setEditForm({...editForm, disability_cause: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Acquired">Acquired</option>
                  <option value="Congenital">Congenital</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employment & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-purple-600" size={20} />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Employment</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
                  <select value={editForm.employment_status} onChange={(e) => setEditForm({...editForm, employment_status: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                    <option value="">Select...</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Self-Employed">Self-Employed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Category</label>
                  <select value={editForm.employment_category} onChange={(e) => setEditForm({...editForm, employment_category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                    <option value="">Select...</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Occupation</label>
                  <input type="text" value={editForm.occupation} onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="text-cyan-600" size={20} />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Education</h4>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Educational Attainment</label>
                <select value={editForm.education_attainment} onChange={(e) => setEditForm({...editForm, education_attainment: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="None">None</option>
                  <option value="Elementary">Elementary</option>
                  <option value="High School">High School</option>
                  <option value="Vocational">Vocational</option>
                  <option value="College">College</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Family Members */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-pink-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Family Members</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Father</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="First Name" value={editForm.father_first_name} onChange={(e) => setEditForm({...editForm, father_first_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Middle Name" value={editForm.father_middle_name} onChange={(e) => setEditForm({...editForm, father_middle_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Last Name" value={editForm.father_last_name} onChange={(e) => setEditForm({...editForm, father_last_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Mother</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="First Name" value={editForm.mother_first_name} onChange={(e) => setEditForm({...editForm, mother_first_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Middle Name" value={editForm.mother_middle_name} onChange={(e) => setEditForm({...editForm, mother_middle_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Last Name" value={editForm.mother_last_name} onChange={(e) => setEditForm({...editForm, mother_last_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Guardian</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="First Name" value={editForm.guardian_first_name} onChange={(e) => setEditForm({...editForm, guardian_first_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Middle Name" value={editForm.guardian_middle_name} onChange={(e) => setEditForm({...editForm, guardian_middle_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Last Name" value={editForm.guardian_last_name} onChange={(e) => setEditForm({...editForm, guardian_last_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Spouse</p>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="First Name" value={editForm.spouse_first_name} onChange={(e) => setEditForm({...editForm, spouse_first_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Middle Name" value={editForm.spouse_middle_name} onChange={(e) => setEditForm({...editForm, spouse_middle_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  <input type="text" placeholder="Last Name" value={editForm.spouse_last_name} onChange={(e) => setEditForm({...editForm, spouse_last_name: e.target.value})}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Government IDs */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-teal-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Government IDs</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">SSS No.</label>
                <input type="text" value={editForm.sss_no} onChange={(e) => setEditForm({...editForm, sss_no: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">GSIS No.</label>
                <input type="text" value={editForm.gsis_no} onChange={(e) => setEditForm({...editForm, gsis_no: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">PhilHealth No.</label>
                <input type="text" value={editForm.philhealth_no} onChange={(e) => setEditForm({...editForm, philhealth_no: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Pag-IBIG No.</label>
                <input type="text" value={editForm.pagibig_no} onChange={(e) => setEditForm({...editForm, pagibig_no: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Household Info */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-amber-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Household Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Living Arrangement</label>
                <select value={editForm.living_arrangement} onChange={(e) => setEditForm({...editForm, living_arrangement: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Living Alone">Living Alone</option>
                  <option value="Living with Husband/Wife">Living with Husband/Wife</option>
                  <option value="Living with Family">Living with Family</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Income Source</label>
                <input type="text" value={editForm.income_source} onChange={(e) => setEditForm({...editForm, income_source: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Monthly Income</label>
                <input type="number" value={editForm.monthly_income || ''} onChange={(e) => setEditForm({...editForm, monthly_income: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Accessibility & Service Needs */}
          <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-indigo-600" size={20} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Record Information</h4>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Accessibility Needs</label>
                  <input type="text" value={editForm.accessibility_needs} onChange={(e) => setEditForm({...editForm, accessibility_needs: e.target.value})}
                    placeholder="e.g., Wheelchair ramp, Sign language interpreter"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Service Needs</label>
                  <input type="text" value={editForm.service_needs} onChange={(e) => setEditForm({...editForm, service_needs: e.target.value})}
                    placeholder="e.g., Financial aid, Medical assistance"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Remarks</label>
                <textarea value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} rows={3} placeholder="Additional notes or remarks..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <DatePicker 
                    label="Date Applied"
                    value={editForm.date_applied}
                    onChange={(date) => setEditForm({...editForm, date_applied: date})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
        <button 
          onClick={handleBackToLookup}
          className="text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
        >
          ← Search Another Record
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleBackToLookup}
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveEdit}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'renewal' 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {actionType === 'renewal' ? 'Submit Renewal' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Success!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  setMode('lookup');
                  setLookupPwdId('');
                  setSelectedPwd(null);
                  onCancel();
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {ModalComponent}
    </div>
  );
};

export default ExistingPwdForm;
