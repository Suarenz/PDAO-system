
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Activity, 
  MapPin, 
  Briefcase, 
  Save,
  HeartHandshake,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { BARANGAY_OPTIONS } from '../constants';
import { pwdApi, PwdFormData } from '../api/pwd';
import type { Barangay, DisabilityType } from '../api/client';
import { extractApiErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker';
import Modal, { useModal } from './Modal';

interface FormProps {
  onCancel: () => void;
  isUserRegistration?: boolean;
}

const InputWrapper = ({ label, children, required = false }: { label: string, children?: React.ReactNode, required?: boolean }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label} {required && <span className="text-rose-600 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const NewApplicantForm: React.FC<FormProps> = ({ onCancel, isUserRegistration = false }) => {
  const { isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = isUserRegistration ? 6 : 7;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { showAlert, ModalComponent } = useModal();
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [disabilityTypes, setDisabilityTypes] = useState<DisabilityType[]>([]);

  const initialFormState = {
    lastName: '', firstName: '', middleName: '', suffix: '',
    dob: '', age: '', placeOfBirth: '',
    sex: '', religion: '', ethnicGroup: '', civilStatus: '', bloodType: '',
    disabilityType: [] as string[],
    causeOfDisability: '', 
    acquiredDetails: [] as string[],
    congenitalDetails: [] as string[],
    otherCause: '',
    houseNoStreet: '', barangay: '', city: 'Pagsanjan', province: 'Laguna', region: '4A',
    mobileNo: '', email: '', landlineNo: '', guardianContactNo: '',
    educationalAttainment: '', employmentStatus: '', categoryOfEmployment: '', typeOfEmployment: '', occupation: '',
    orgAffiliated: '', orgContactPerson: '', orgAddress: '', orgTelNo: '',
    sssNo: '', gsisNo: '', pagibigNo: '', philhealthNo: '',
    fatherLName: '', fatherFName: '', fatherMName: '',
    motherLName: '', motherFName: '', motherMName: '',
    guardianLName: '', guardianFName: '', guardianMName: '',
    accomplishedByLName: '', accomplishedByFName: '', accomplishedByMName: '',
    reportingUnit: '', registrationNo: '',
    livingArrangement: '', 
    receivingSupport: false,
    isPensioner: false,
    pensionType: '',
    monthlyPension: '',
    sourceOfIncome: '',
    monthlyIncome: '',
    spouseName: '',
    spouseAge: '',
    remarks: '',
    interviewBy: 'Admin User',
    accessibility_needs: '',
    service_needs: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const lookups = await pwdApi.getLookups();
        setBarangays(lookups.barangays);
        setDisabilityTypes(lookups.disability_types);
      } catch (error) {
        console.error('Failed to fetch lookups:', error);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.dob]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCheckboxList = (field: 'disabilityType' | 'acquiredDetails' | 'congenitalDetails', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const nextStep = () => {
    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.lastName.trim() || !formData.firstName.trim() || !formData.middleName.trim()) {
        showAlert('Validation Error', 'Last Name, First Name, and Middle Name are required.', 'warning');
        return;
      }
      if (!formData.dob) {
        showAlert('Validation Error', 'Date of Birth is required.', 'warning');
        return;
      }
    }

    // Validation for Step 2
    if (currentStep === 2) {
      if (formData.disabilityType.length === 0) {
        showAlert('Validation Error', 'Please select at least one Type of Disability.', 'warning');
        return;
      }
    }

    // Validation for Step 3
    if (currentStep === 3) {
      if (!formData.houseNoStreet.trim() || !formData.barangay) {
        showAlert('Validation Error', 'House No. & Street and Barangay are required.', 'warning');
        return;
      }
      if (formData.mobileNo) {
        const digitsOnly = formData.mobileNo.replace(/\D/g, '');
        if (digitsOnly.length !== 11) {
          showAlert('Validation Error', 'Mobile Number must be exactly 11 digits.', 'warning');
          return;
        }
      } else {
        showAlert('Validation Error', 'Mobile Number is required.', 'warning');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => currentStep > 1 && setCurrentStep(prev => prev - 1);

  const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Disability', icon: Activity },
    { id: 3, title: 'Residence', icon: MapPin },
    { id: 4, title: 'Work & ID', icon: Briefcase },
    { id: 5, title: 'Family', icon: ShieldCheck },
    { id: 6, title: 'Household Information', icon: HeartHandshake },
    ...(!isUserRegistration ? [{ id: 7, title: 'Other', icon: Save }] : []),
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Find barangay ID from name
      const barangayId = barangays.find(b => b.name === formData.barangay)?.id || null;

      // Map disability types to their IDs
      const disabilities = formData.disabilityType
        .map(typeName => {
          const disabilityType = disabilityTypes.find(dt => dt.name === typeName);
          if (!disabilityType) return null;

          // Determine cause details based on causeOfDisability
          let causeDetails = '';
          if (formData.causeOfDisability === 'Acquired') {
            causeDetails = formData.acquiredDetails.join(', ');
          } else if (formData.causeOfDisability === 'Congenital') {
            causeDetails = formData.congenitalDetails.join(', ');
          }
          if (formData.otherCause) {
            causeDetails = causeDetails ? `${causeDetails}, ${formData.otherCause}` : formData.otherCause;
          }

          return {
            disability_type_id: disabilityType.id,
            cause: formData.causeOfDisability as 'Acquired' | 'Congenital' | null || null,
            cause_details: causeDetails || null,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null);

      // Build family members array
      const family: PwdFormData['family'] = [];
      if (formData.fatherFName || formData.fatherLName) {
        family.push({
          relation_type: 'Father',
          first_name: formData.fatherFName || null,
          last_name: formData.fatherLName || null,
          middle_name: formData.fatherMName || null,
        });
      }
      if (formData.motherFName || formData.motherLName) {
        family.push({
          relation_type: 'Mother',
          first_name: formData.motherFName || null,
          last_name: formData.motherLName || null,
          middle_name: formData.motherMName || null,
        });
      }
      if (formData.guardianFName || formData.guardianLName) {
        family.push({
          relation_type: 'Guardian',
          first_name: formData.guardianFName || null,
          last_name: formData.guardianLName || null,
          middle_name: formData.guardianMName || null,
        });
      }
      if (formData.spouseName) {
        const spouseNames = formData.spouseName.split(' ');
        family.push({
          relation_type: 'Spouse',
          first_name: spouseNames[0] || null,
          last_name: spouseNames.slice(1).join(' ') || null,
          age: formData.spouseAge ? parseInt(formData.spouseAge) : null,
        });
      }

      // Build government IDs array
      const governmentIds: PwdFormData['government_ids'] = [];
      if (formData.sssNo) {
        governmentIds.push({ id_type: 'SSS', id_number: formData.sssNo });
      }
      if (formData.gsisNo) {
        governmentIds.push({ id_type: 'GSIS', id_number: formData.gsisNo });
      }
      if (formData.philhealthNo) {
        governmentIds.push({ id_type: 'PhilHealth', id_number: formData.philhealthNo });
      }
      if (formData.pagibigNo) {
        governmentIds.push({ id_type: 'Pag-IBIG', id_number: formData.pagibigNo });
      }

      // Build the API payload
      const payload: PwdFormData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        suffix: formData.suffix || null,
        pwd_number: formData.registrationNo || null,
        date_applied: new Date().toISOString().split('T')[0],
        remarks: formData.remarks || null,
        accessibility_needs: formData.accessibility_needs || null,
        service_needs: formData.service_needs || null,
        submission_type: 'NEW',
        create_pending: !isAdmin, // Non-admin users need approval, admin adds directly to masterlist

        personal_info: {
          birth_date: formData.dob || null,
          birth_place: formData.placeOfBirth || null,
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

        disabilities: (() => {
          let list = [...disabilities];
          return list.length > 0 ? list : undefined;
        })(),

        employment: {
          status: formData.employmentStatus || null,
          category: formData.categoryOfEmployment || null,
          type: formData.typeOfEmployment || null,
          occupation: formData.occupation || null,
        },

        education: {
          attainment: formData.educationalAttainment || null,
        },

        family: family.length > 0 ? family : undefined,

        government_ids: governmentIds.length > 0 ? governmentIds : undefined,

        household_info: {
          living_arrangement: formData.livingArrangement || null,
          receiving_support: formData.receivingSupport,
          is_pensioner: formData.isPensioner,
          pension_type: formData.pensionType || null,
          monthly_pension: formData.monthlyPension ? parseFloat(formData.monthlyPension.replace(/,/g, '')) : null,
          income_source: formData.sourceOfIncome || null,
          monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome.replace(/,/g, '')) : null,
        },

        organization: formData.orgAffiliated ? {
          organization_name: formData.orgAffiliated || null,
          contact_person: formData.orgContactPerson || null,
          address: formData.orgAddress || null,
          telephone: formData.orgTelNo || null,
        } : undefined,
      };

      await pwdApi.create(payload);
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      const errorMessage = extractApiErrorMessage(error, 'Failed to submit application. Please try again.');
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-gray-900/10 flex flex-col h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
      <style>{`
        .form-input-pdao {
            width: 100%;
            background-color: #fff;
            border: 1.5px solid #cbd5e1; /* Darker border for visibility (Slate 300) */
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
            border-color: #334155; /* Visible border for dark mode (Slate 700) */
            color: #f8fafc;
        }
        .form-input-pdao:focus {
            border-color: #3b82f6;
            background-color: #fff;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .dark .form-input-pdao:focus {
            background-color: #0f172a;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        .form-input-pdao::placeholder {
            color: #94a3b8;
        }
        select.form-input-pdao {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1rem;
            padding-right: 2.5rem;
        }
        .dark select.form-input-pdao {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }
      `}</style>

      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{isUserRegistration ? 'Register New PWD' : 'PWD Registration Portal'}</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{isUserRegistration ? 'Submit your PWD application for approval' : 'New Applicant Entry'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${currentStep >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                {currentStep > s.id ? <Check size={14} /> : s.id}
              </div>
              {i < steps.length - 1 && <div className={`w-4 h-0.5 mx-1 rounded-full ${currentStep > s.id ? 'bg-gray-700' : 'bg-slate-200 dark:bg-slate-800'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
           <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 rounded-2xl">
                 {(() => {
                    const Icon = steps[currentStep-1].icon;
                    return <Icon size={24} />;
                 })()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                  {steps[currentStep-1].title === 'Household Information' ? 'Household Information' : `${steps[currentStep-1].title} Details`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Step {currentStep} of {totalSteps}</p>
              </div>
           </div>

           {/* Step Content Inlined to maintain focus */}
           {currentStep === 1 && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                 <InputWrapper label="Last Name" required><input name="lastName" value={formData.lastName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="First Name" required><input name="firstName" value={formData.firstName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="Middle Name" required><input name="middleName" value={formData.middleName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="Suffix"><input name="suffix" value={formData.suffix} onChange={handleInputChange} className="form-input-pdao" placeholder="Jr., III" /></InputWrapper>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                 <div className="md:col-span-1">
                   <DatePicker 
                     label="Date of Birth"
                     required
                     value={formData.dob}
                     onChange={(date) => setFormData(prev => ({ ...prev, dob: date }))}
                   />
                 </div>
                 <InputWrapper label="Age"><input readOnly value={formData.age} className="form-input-pdao bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800" /></InputWrapper>
                 <InputWrapper label="Place of Birth"><input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="Sex" required>
                     <div className="flex gap-6 py-3 px-1">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 group">
                             <input type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleInputChange} className="w-4 h-4 accent-gray-700" />
                             <span className="group-hover:text-gray-700 transition-colors">Male</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 group">
                             <input type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleInputChange} className="w-4 h-4 accent-gray-700" />
                             <span className="group-hover:text-gray-700 transition-colors">Female</span>
                         </label>
                     </div>
                 </InputWrapper>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                 <InputWrapper label="Religion"><input name="religion" value={formData.religion} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="Ethnic Group"><input name="ethnicGroup" value={formData.ethnicGroup} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 <InputWrapper label="Civil Status">
                     <select name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} className="form-input-pdao">
                         <option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option><option value="Divorced">Divorced</option>
                     </select>
                 </InputWrapper>
                 <InputWrapper label="Blood Type">
                     <select name="bloodType" value={formData.bloodType} onChange={handleInputChange} className="form-input-pdao">
                         <option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                     </select>
                 </InputWrapper>
               </div>
             </div>
           )}

           {currentStep === 2 && (
             <div className="space-y-8 animate-in fade-in duration-150">
               <div>
                 <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4">10. Type of Disability <span className="text-rose-600 ml-0.5">*</span></h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     {disabilityTypes.filter(t => t.name !== 'Other').map(type => (
                         <label key={type.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.disabilityType.includes(type.name) ? 'bg-gray-700 border-gray-700 text-white shadow-lg shadow-gray-700/20' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-gray-600 shadow-sm'}`}>
                             <input type="checkbox" className="hidden" checked={formData.disabilityType.includes(type.name)} onChange={() => toggleCheckboxList('disabilityType', type.name)} />
                             <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.disabilityType.includes(type.name) ? 'bg-white border-white' : 'bg-transparent border-slate-300'}`}>
                                 {formData.disabilityType.includes(type.name) && <Check size={12} className="text-gray-700 stroke-[4]" />}
                             </div>
                             <span className="text-xs font-bold uppercase tracking-tight">{type.name}</span>
                         </label>
                     ))}
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                 <InputWrapper label="11. Cause of Disability">
                     <select name="causeOfDisability" value={formData.causeOfDisability} onChange={handleInputChange} className="form-input-pdao">
                         <option value="">Select Primary Cause</option>
                         <option value="Acquired">Acquired</option>
                         <option value="Congenital">Congenital</option>
                     </select>
                 </InputWrapper>
                 <InputWrapper label="Others (Specify)"><input name="otherCause" value={formData.otherCause} onChange={handleInputChange} className="form-input-pdao" placeholder="Specify if not in list" /></InputWrapper>
               </div>
             </div>
           )}

           {currentStep === 3 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="12. House No. & Street" required><input name="houseNoStreet" value={formData.houseNoStreet} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Select Barangay" required>
                         <select name="barangay" value={formData.barangay} onChange={handleInputChange} className="form-input-pdao">
                             {BARANGAY_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                         </select>
                     </InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <InputWrapper label="Municipality"><input readOnly value="Pagsanjan" className="form-input-pdao bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800" /></InputWrapper>
                     <InputWrapper label="Province"><input readOnly value="Laguna" className="form-input-pdao bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800" /></InputWrapper>
                     <InputWrapper label="Region"><input readOnly value="4A" className="form-input-pdao bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed border-slate-200 dark:border-slate-800" /></InputWrapper>
                 </div>
                 <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="Mobile Number" required><input name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} className="form-input-pdao" placeholder="09XX-XXX-XXXX" /></InputWrapper>
                     <InputWrapper label="E-mail Address"><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input-pdao" placeholder="example@email.com" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="Landline No."><input name="landlineNo" value={formData.landlineNo} onChange={handleInputChange} className="form-input-pdao" placeholder="(XXX) XXX-XXXX" /></InputWrapper>
                     <InputWrapper label="Parent/Guardian Contact No."><input name="guardianContactNo" value={formData.guardianContactNo} onChange={handleInputChange} className="form-input-pdao" placeholder="09XX-XXX-XXXX" /></InputWrapper>
                 </div>
             </div>
           )}

           {currentStep === 4 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <InputWrapper label="14. Educational Attainment">
                         <select name="educationalAttainment" value={formData.educationalAttainment} onChange={handleInputChange} className="form-input-pdao">
                             <option value="">Select</option>
                             <option value="None">None</option>
                             <option value="Elementary Education">Elementary Education</option>
                             <option value="Highschool Education">Highschool Education</option>
                             <option value="College">College</option>
                             <option value="Postgraduate Program">Postgraduate Program</option>
                             <option value="Non-formal">Non-formal</option>
                             <option value="Vocational">Vocational</option>
                         </select>
                     </InputWrapper>
                     <InputWrapper label="15. Status of Employment">
                         <select name="employmentStatus" value={formData.employmentStatus} onChange={handleInputChange} className="form-input-pdao">
                             <option value="">Select</option><option value="Employed">Employed</option><option value="Unemployed">Unemployed</option><option value="Self-Employed">Self-Employed</option>
                         </select>
                     </InputWrapper>
                     <InputWrapper label="16. Occupation"><input name="occupation" value={formData.occupation} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="Category of Employment">
                         <select name="categoryOfEmployment" value={formData.categoryOfEmployment} onChange={handleInputChange} className="form-input-pdao">
                             <option value="">None</option>
                             <option value="Government">Government</option>
                             <option value="Private">Private</option>
                         </select>
                     </InputWrapper>
                     <InputWrapper label="Types of Employment">
                         <select name="typeOfEmployment" value={formData.typeOfEmployment} onChange={handleInputChange} className="form-input-pdao">
                             <option value="">None</option>
                             <option value="Permanent/Regular">Permanent/Regular</option>
                             <option value="Seasonal">Seasonal</option>
                             <option value="Casual">Casual</option>
                             <option value="Emergency">Emergency</option>
                         </select>
                     </InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="Source of Income"><input name="sourceOfIncome" value={formData.sourceOfIncome} onChange={handleInputChange} className="form-input-pdao" placeholder="e.g., Salary, Business, Pension" /></InputWrapper>
                     <InputWrapper label="Estimated Monthly Income"><input name="monthlyIncome" value={formData.monthlyIncome} onChange={handleInputChange} className="form-input-pdao" placeholder="Php 0.00" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                     <InputWrapper label="SSS NO."><input name="sssNo" value={formData.sssNo} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="GSIS NO."><input name="gsisNo" value={formData.gsisNo} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Pag-IBIG NO."><input name="pagibigNo" value={formData.pagibigNo} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="PhilHealth NO."><input name="philhealthNo" value={formData.philhealthNo} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 </div>
             </div>
           )}

           {currentStep === 5 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h4 className="text-[10px] font-black text-gray-700 uppercase border-b pb-2 tracking-widest border-slate-200">19. Family Background</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <InputWrapper label="Father's Last Name"><input name="fatherLName" value={formData.fatherLName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Father's First Name"><input name="fatherFName" value={formData.fatherFName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Father's Middle Name"><input name="fatherMName" value={formData.fatherMName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <InputWrapper label="Mother's Last Name"><input name="motherLName" value={formData.motherLName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Mother's First Name"><input name="motherFName" value={formData.motherFName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Mother's Middle Name"><input name="motherMName" value={formData.motherMName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                     <InputWrapper label="Guardian's Last Name"><input name="guardianLName" value={formData.guardianLName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Guardian's First Name"><input name="guardianFName" value={formData.guardianFName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                     <InputWrapper label="Guardian's Middle Name"><input name="guardianMName" value={formData.guardianMName} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                 </div>
             </div>
           )}

           {currentStep === 6 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <InputWrapper label="Name of Spouse"><input name="spouseName" value={formData.spouseName} onChange={handleInputChange} className="form-input-pdao" placeholder="Full Name" /></InputWrapper>
                     <InputWrapper label="Spouse Age"><input name="spouseAge" value={formData.spouseAge} onChange={handleInputChange} className="form-input-pdao" placeholder="Age" /></InputWrapper>
                 </div>
                 <div className="pt-6 border-t border-slate-200">
                     <InputWrapper label="Living Arrangement">
                         <div className="flex gap-6 py-3 px-1 flex-wrap">
                             <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 group">
                                 <input type="radio" name="livingArrangement" value="Living Alone" checked={formData.livingArrangement === 'Living Alone'} onChange={handleInputChange} className="w-4 h-4 accent-gray-700" />
                                 <span className="group-hover:text-gray-700 transition-colors">Living Alone</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 group">
                                 <input type="radio" name="livingArrangement" value="Living with Husband/Wife" checked={formData.livingArrangement === 'Living with Husband/Wife'} onChange={handleInputChange} className="w-4 h-4 accent-gray-700" />
                                 <span className="group-hover:text-gray-700 transition-colors">Living with Husband/Wife</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 group">
                                 <input type="radio" name="livingArrangement" value="Living with Family" checked={formData.livingArrangement === 'Living with Family'} onChange={handleInputChange} className="w-4 h-4 accent-gray-700" />
                                 <span className="group-hover:text-gray-700 transition-colors">Living with Family</span>
                             </label>
                         </div>
                     </InputWrapper>
                 </div>
             </div>
           )}

           {currentStep === 7 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h4 className="text-[10px] font-black text-gray-700 uppercase border-b pb-2 tracking-widest border-slate-200">Additional Information</h4>
                 <InputWrapper label="Accomplished By">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                         <input name="accomplishedByLName" value={formData.accomplishedByLName} onChange={handleInputChange} className="form-input-pdao" placeholder="Last Name" />
                         <input name="accomplishedByFName" value={formData.accomplishedByFName} onChange={handleInputChange} className="form-input-pdao" placeholder="First Name" />
                         <input name="accomplishedByMName" value={formData.accomplishedByMName} onChange={handleInputChange} className="form-input-pdao" placeholder="Middle Name" />
                     </div>
                 </InputWrapper>
                 {!isUserRegistration && (
                   <div className="grid grid-cols-1 md:grid-cols-1 gap-5 pt-4 border-t border-slate-200">
                       <InputWrapper label="Name of Reporting Unit"><input name="reportingUnit" value={formData.reportingUnit} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                   </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200">
                   <InputWrapper label="Interviewed By"><input name="interviewBy" value={formData.interviewBy} onChange={handleInputChange} className="form-input-pdao" /></InputWrapper>
                   <InputWrapper label="Accessibility Needs"><input name="accessibility_needs" value={formData.accessibility_needs} onChange={handleInputChange} className="form-input-pdao" placeholder="e.g., Wheelchair ramp, Sign language interpreter" /></InputWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <InputWrapper label="Service Needs"><input name="service_needs" value={formData.service_needs} onChange={handleInputChange} className="form-input-pdao" placeholder="e.g., Medical assistance, Livelihood" /></InputWrapper>
                   <InputWrapper label="Remarks"><textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="form-input-pdao min-h-[80px] resize-none" /></InputWrapper>
                 </div>
             </div>
           )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onCancel} className="text-[11px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-[0.2em]">
           Exit Application
        </button>
        <div className="flex gap-4">
          <button 
            disabled={currentStep === 1} 
            onClick={prevStep} 
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          {currentStep === totalSteps ? (
            <>
              {submitError && (
                <div className="text-red-500 text-sm mr-4">{submitError}</div>
              )}
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Save size={18} /> Submit Application</>
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={nextStep} 
              className="flex items-center gap-3 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/30 transition-all active:scale-95 group"
            >
              Next <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Success!
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {isAdmin 
                    ? 'PWD application has been successfully added to the masterlist.'
                    : 'Your PWD application has been submitted successfully. It will be reviewed by the PDAO staff before being added to the official masterlist. Please wait for the approval notification.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  setFormData(initialFormState);
                  setCurrentStep(1);
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

export default NewApplicantForm;
