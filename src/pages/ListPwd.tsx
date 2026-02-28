import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Skeleton from '../components/Skeleton';
import { 
  Search, 
  Printer, 
  FileSpreadsheet,
  MapPin, 
  Edit3, 
  ChevronDown,
  UserCheck,
  UserMinus,
  Users,
  IdCard,
  Trash2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  User,
  Phone,
  Mail,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  CreditCard,
  Building2,
  Calendar,
  Save,
  AlertTriangle,
  Check,
  MoreVertical
} from 'lucide-react';
import { BARANGAY_OPTIONS } from '../constants';
import { pwdApi } from '../api';
import { reportsApi } from '../api/reports';
import { PwdProfileFull, Lookups } from '../api/client';
import DatePicker from '../components/DatePicker';
import GenerateIdModal from '../components/GenerateIdModal';

interface PwdRecord {
  id: string;
  name: string;
  pwdNumber: string | null; // Null or empty means no ID yet
  age: number;
  barangay: string;
  disabilities: string[]; // Array of disability names
  status: 'ACTIVE' | 'DECEASED' | 'INACTIVE';
  avatarColor: string;
  appliedOnline: boolean;
  cardPrinted: boolean;
}

interface ListPwdProps {
  onModalStateChange?: (isOpen: boolean) => void;
}

const ListPwd: React.FC<ListPwdProps> = ({ onModalStateChange }) => {
  const [records, setRecords] = useState<PwdRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('All Barangays');
  const [activeTab, setActiveTab] = useState<'all' | 'with-id' | 'without-id' | 'children' | 'deceased' | 'applied-online'>('all');
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentMenuRecord, setCurrentMenuRecord] = useState<PwdRecord | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });
  const [counts, setCounts] = useState({
    all: 0,
    withId: 0,
    withoutId: 0,
    children: 0,
    deceased: 0,
    appliedOnline: 0
  });

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deceasedModalOpen, setDeceasedModalOpen] = useState(false);
  const [printedModalOpen, setPrintedModalOpen] = useState(false);
  const [generateIdModalOpen, setGenerateIdModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('Success!');
  const [selectedPwd, setSelectedPwd] = useState<PwdProfileFull | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PwdRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [lookups, setLookups] = useState<Lookups | null>(null);

  // Sync modal state with parent to hide navigation
  useEffect(() => {
    const isAnyModalOpen = viewModalOpen || editModalOpen || deleteModalOpen || 
                           deceasedModalOpen || printedModalOpen || generateIdModalOpen || successModalOpen;
    onModalStateChange?.(isAnyModalOpen);
  }, [viewModalOpen, editModalOpen, deleteModalOpen, deceasedModalOpen, printedModalOpen, generateIdModalOpen, successModalOpen, onModalStateChange]);
  
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
    org_name: '',
    org_contact: '',
    org_address: '',
    org_telephone: '',
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
    accessibility_needs: '',
    service_needs: '',
    date_applied: '',
    remarks: ''
  });

  // Fetch records from API
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.currentPage,
        per_page: pagination.perPage
      };
      
      if (searchTerm) params.search = searchTerm;
      if (selectedBarangay !== 'All Barangays') params.barangay = selectedBarangay;
      
      // Tab-specific filters
      if (activeTab === 'with-id') params.has_pwd_number = true;
      if (activeTab === 'without-id') params.has_pwd_number = false;
      if (activeTab === 'children') params.is_child = true;
      if (activeTab === 'deceased') params.status = 'DECEASED';
      if (activeTab === 'applied-online') params.applied_online = true;
      
      const response = await pwdApi.getAll(params);
      
      // Transform API response to local format
      const transformedRecords: PwdRecord[] = response.data.map((pwd: any) => {
        // Get all disability names from the disabilities array
        const disabilityNames: string[] = [];
        if (pwd.disability_type) {
          disabilityNames.push(pwd.disability_type);
        } else if (pwd.disabilities && pwd.disabilities.length > 0) {
          pwd.disabilities.forEach((d: any) => {
            const name = d.disability_type?.name || d.disability_type_name;
            if (name) disabilityNames.push(name);
          });
        }
        if (disabilityNames.length === 0) {
          disabilityNames.push('Not specified');
        }
        
        return {
          id: pwd.id.toString(),
          name: `${pwd.last_name}, ${pwd.first_name} ${pwd.middle_name || ''}`.trim(),
          pwdNumber: pwd.pwd_number || null,
          age: pwd.age || calculateAge(pwd.date_of_birth),
          barangay: pwd.barangay?.name || 'Unknown',
          disabilities: disabilityNames,
          status: pwd.status?.toUpperCase() || 'ACTIVE',
          avatarColor: getAvatarColor(pwd.id),
          appliedOnline: pwd.applied_online || false,
          cardPrinted: pwd.card_printed || false
        };
      });
      
      setRecords(transformedRecords);
      setPagination({
        currentPage: response.meta?.current_page || 1,
        lastPage: response.meta?.last_page || 1,
        total: response.meta?.total || 0,
        perPage: response.meta?.per_page || 20
      });

      // Update counts
      setCounts({
        all: response.counts?.all || 0,
        withId: response.counts?.with_id || 0,
        withoutId: response.counts?.without_id || 0,
        children: response.counts?.children || 0,
        deceased: response.counts?.deceased || 0,
        appliedOnline: response.counts?.applied_online || 0
      });
    } catch (err) {
      console.error('Failed to fetch PWD records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to calculate age from birthdate
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper for avatar colors
  const getAvatarColor = (id: number) => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
    return colors[id % colors.length];
  };

  useEffect(() => {
    fetchRecords();
    fetchLookups();
  }, [pagination.currentPage, selectedBarangay, activeTab]);

  // Fetch lookups for edit form
  const fetchLookups = async () => {
    try {
      const data = await pwdApi.getLookups();
      setLookups(data);
    } catch (err) {
      console.error('Failed to fetch lookups:', err);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchRecords();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close active menu
  useEffect(() => {
    const handleClickOutside = () => setActiveActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Actions
  const handleGenerateID = async (id: string, name: string) => {
    setModalLoading(true);
    setGenerateIdModalOpen(true);
    onModalStateChange?.(true);
    try {
      const data = await pwdApi.getById(parseInt(id));
      setSelectedPwd(data);
    } catch (err: any) {
      console.error('Failed to fetch PWD details for ID generation:', err);
      setGenerateIdModalOpen(false);
      setSuccessTitle('Error');
      setSuccessMessage(err.response?.data?.message || 'Failed to load PWD details. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };
  
  // View PWD details
  const handleView = async (id: string) => {
    setModalLoading(true);
    setViewModalOpen(true);
    onModalStateChange?.(true);
    try {
      const data = await pwdApi.getById(parseInt(id));
      setSelectedPwd(data);
    } catch (err: any) {
      console.error('Failed to fetch PWD details:', err);
      setViewModalOpen(false);
      setSuccessTitle('Error');
      setSuccessMessage(err.response?.data?.message || 'Failed to load PWD details. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleEdit = async (id: string, name: string) => {
    setModalLoading(true);
    setEditModalOpen(true);
    onModalStateChange?.(true);
    try {
      const data = await pwdApi.getById(parseInt(id));
      setSelectedPwd(data);
      
      // Helper to find family member by relation
      const findFamily = (relation: string) => data.family_members?.find(f => f.relation_type === relation);
      const father = findFamily('Father');
      const mother = findFamily('Mother');
      const guardian = findFamily('Guardian');
      const spouse = findFamily('Spouse');
      
      // Helper to find government ID by type
      const findGovId = (type: string) => data.government_ids?.find(g => g.id_type === type);
      
      // Populate edit form with all fields
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        middle_name: data.middle_name || '',
        suffix: data.suffix || '',
        pwd_number: data.pwd_number || '',
        birth_date: data.personal_info?.birth_date ? new Date(data.personal_info.birth_date).toISOString().split('T')[0] : '',
        birth_place: data.personal_info?.birth_place || '',
        sex: data.personal_info?.sex || '',
        civil_status: data.personal_info?.civil_status || '',
        blood_type: data.personal_info?.blood_type || '',
        religion: data.personal_info?.religion || '',
        ethnic_group: data.personal_info?.ethnic_group || '',
        mobile: data.contacts?.mobile || '',
        landline: data.contacts?.landline || '',
        email: data.contacts?.email || '',
        guardian_contact: data.contacts?.guardian_contact || '',
        house_street: data.address?.house_street || '',
        barangay_id: data.address?.barangay_id || 0,
        city: data.address?.city || 'Pagsanjan',
        province: data.address?.province || 'Laguna',
        region: data.address?.region || '4A',
        disability_type_id: data.disabilities?.[0]?.disability_type_id || 0,
        disability_cause: data.disabilities?.[0]?.cause || '',
        employment_status: data.employment?.status || '',
        employment_category: data.employment?.category || '',
        employment_type: data.employment?.type || '',
        occupation: data.employment?.occupation || '',
        education_attainment: data.education?.attainment || '',
        living_arrangement: data.household_info?.living_arrangement || '',
        income_source: data.household_info?.income_source || '',
        monthly_income: data.household_info?.monthly_income || 0,
        org_name: data.organization?.organization_name || '',
        org_contact: data.organization?.contact_person || '',
        org_address: data.organization?.address || '',
        org_telephone: data.organization?.telephone || '',
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
        accessibility_needs: data.accessibility_needs || '',
        service_needs: data.service_needs || '',
        date_applied: data.date_applied ? new Date(data.date_applied).toISOString().split('T')[0] : '',
        remarks: data.remarks || ''
      });
    } catch (err) {
      console.error('Failed to fetch PWD details:', err);
      setSuccessTitle('Error');
      setSuccessMessage('Failed to load PWD details for editing. Please try again.');
      setSuccessModalOpen(true);
      setEditModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPwd) return;
    setModalLoading(true);
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
        organization: {
          organization_name: editForm.org_name || null,
          contact_person: editForm.org_contact || null,
          address: editForm.org_address || null,
          telephone: editForm.org_telephone || null
        },
        family: familyMembers.length > 0 ? familyMembers : undefined,
        government_ids: governmentIds.length > 0 ? governmentIds : undefined
      });
      setEditModalOpen(false);
      setSelectedPwd(null);
      setSuccessTitle('Success!');
      setSuccessMessage('Record has been updated successfully!');
      setSuccessModalOpen(true);
      fetchRecords();
    } catch (err: any) {
      console.error('Failed to update record:', err);
      setEditModalOpen(false);
      setSelectedPwd(null);
      setSuccessTitle('Error');
      setSuccessMessage(err.response?.data?.message || 'Failed to update record. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleDelete = async (id: string, name: string) => {
    setSelectedRecord(records.find(r => r.id === id) || null);
    setDeleteModalOpen(true);
    onModalStateChange?.(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;
    setModalLoading(true);
    try {
      await pwdApi.delete(parseInt(selectedRecord.id));
      setDeleteModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Success!');
      setSuccessMessage('Record has been archived successfully.');
      setSuccessModalOpen(true);
      fetchRecords();
    } catch (err: any) {
      setDeleteModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Error');
      setSuccessMessage(err.response?.data?.message || 'Failed to archive record. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleMarkDeceased = async (id: string, name: string) => {
    setSelectedRecord(records.find(r => r.id === id) || null);
    setDeceasedModalOpen(true);
    onModalStateChange?.(true);
  };

  const confirmMarkDeceased = async () => {
    if (!selectedRecord) return;
    setModalLoading(true);
    try {
      await pwdApi.updateStatus(parseInt(selectedRecord.id), 'DECEASED');
      setDeceasedModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Success!');
      setSuccessMessage('Status has been updated to Deceased.');
      setSuccessModalOpen(true);
      fetchRecords();
    } catch (err: any) {
      setDeceasedModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Error');
      setSuccessMessage(err.response?.data?.message || 'Failed to update status. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };

  // Mark Card as Printed — transitions APPROVED → PRINTED
  const handleMarkPrinted = (id: string, name: string) => {
    setSelectedRecord(records.find(r => r.id === id) || null);
    setPrintedModalOpen(true);
    onModalStateChange?.(true);
  };

  const confirmMarkPrinted = async () => {
    if (!selectedRecord) return;
    setModalLoading(true);
    try {
      await pwdApi.markAsPrinted(parseInt(selectedRecord.id));
      
      setPrintedModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Card Marked as Printed');
      setSuccessMessage(`The PWD ID card for ${selectedRecord.name} has been marked as printed. The member has been notified and can now schedule a pickup appointment.`);
      setSuccessModalOpen(true);
      fetchRecords();
    } catch (err: any) {
      setPrintedModalOpen(false);
      setSelectedRecord(null);
      setSuccessTitle('Error');
      setSuccessMessage(err?.response?.data?.message || err?.message || 'Failed to mark card as printed. Please try again.');
      setSuccessModalOpen(true);
    } finally {
      setModalLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.lastPage) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">PWD Masterlist</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Official masterlist of registered Persons with Disabilities in the Municipality.
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={async () => {
                  if (isExporting) return;
                  setIsExporting(true);
                  try {
                    const filters: Record<string, any> = {};
                    if (selectedBarangay !== 'All Barangays') {
                      filters.barangay = selectedBarangay;
                    }
                    if (activeTab === 'with-id') filters.has_pwd_number = true;
                    if (activeTab === 'without-id') filters.has_pwd_number = false;
                    if (activeTab === 'children') filters.is_child = true;
                    if (activeTab === 'deceased') filters.status = 'DECEASED';

                    const result = await reportsApi.generate({
                      report_type: 'MASTERLIST',
                      file_type: 'PDF',
                      filters,
                    });
                    await reportsApi.download(result.id);
                  } catch (err) {
                    console.error('Failed to export PDF:', err);
                    alert('Failed to export PDF. Please try again.');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button 
                onClick={async () => {
                  if (isExportingExcel) return;
                  setIsExportingExcel(true);
                  try {
                    const filters: Record<string, any> = {};
                    if (selectedBarangay !== 'All Barangays') {
                      filters.barangay = selectedBarangay;
                    }
                    if (activeTab === 'with-id') filters.has_pwd_number = true;
                    if (activeTab === 'without-id') filters.has_pwd_number = false;
                    if (activeTab === 'children') filters.is_child = true;
                    if (activeTab === 'deceased') filters.status = 'DECEASED';

                    const result = await reportsApi.generate({
                      report_type: 'MASTERLIST',
                      file_type: 'EXCEL',
                      filters,
                    });
                    await reportsApi.download(result.id);
                  } catch (err) {
                    console.error('Failed to export Excel:', err);
                    alert('Failed to export Excel. Please try again.');
                  } finally {
                    setIsExportingExcel(false);
                  }
                }}
                disabled={isExportingExcel}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExportingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                {isExportingExcel ? 'Exporting...' : 'Export Excel'}
            </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search by ID or Name..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
            <MapPin size={18} />
          </div>
          <select 
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="w-full md:w-64 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer"
          >
            {BARANGAY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl w-full md:w-fit border border-slate-200 dark:border-slate-800">
        <button 
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <Users size={16} />
            All Members
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.all}</span>
        </button>
        <button 
            onClick={() => setActiveTab('with-id')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'with-id' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <UserCheck size={16} />
            With ID Number
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.withId}</span>
        </button>
        <button 
            onClick={() => setActiveTab('without-id')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'without-id' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <UserMinus size={16} />
            Without ID Number
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.withoutId}</span>
        </button>
        <button 
            onClick={() => setActiveTab('children')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'children' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <Users size={16} />
            Children with Disability
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.children}</span>
        </button>
        <button 
            onClick={() => setActiveTab('deceased')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'deceased' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <UserCheck size={16} />
            Deceased
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.deceased}</span>
        </button>
        <button 
            onClick={() => setActiveTab('applied-online')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'applied-online' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
            <CreditCard size={16} />
            Applied Online
            <span className="ml-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-[10px]">{counts.appliedOnline}</span>
        </button>
      </div>

      {/* Registry Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.15em]">
                  <th className="px-8 py-6">Member Profile</th>
                  <th className="px-6 py-6">Age / Area</th>
                  <th className="px-6 py-6">Disability</th>
                  <th className="px-6 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-48" />
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex justify-end gap-2">
                           <Skeleton className="h-8 w-8 rounded-lg" />
                           <Skeleton className="h-8 w-8 rounded-lg" />
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  records.length > 0 ? (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col" onClick={() => handleView(record.id)}>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-0.5 group-hover:text-blue-600 transition-colors cursor-pointer">{record.name}</p>
                            {record.pwdNumber ? (
                                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">{record.pwdNumber}</p>
                            ) : (
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                                    ID Assignment Pending
                                </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{record.age} years old</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{record.barangay}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 flex-wrap">
                             {record.disabilities.map((disability, idx) => (
                               <span key={idx} className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 tracking-tight">
                                  {disability}
                               </span>
                             ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-tight ${
                            record.status === 'ACTIVE' 
                              ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                              : record.status === 'DECEASED'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'bg-amber-100 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right relative">
                          <div className="flex justify-end items-center gap-2">
                            {/* Generate ID Button - available for all records */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleGenerateID(record.id, record.name); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                                title="Generate PWD ID Card"
                            >
                                <IdCard size={14} />
                                Generate ID
                            </button>

                            {record.appliedOnline && record.cardPrinted && (
                              <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                <Check size={12} />
                                Printed
                              </span>
                            )}

                            {/* Actions Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (activeActionMenu === record.id) {
                                          setActiveActionMenu(null);
                                          setMenuPosition(null);
                                          setCurrentMenuRecord(null);
                                        } else {
                                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                          const menuHeight = 250; // approximate menu height
                                          const spaceBelow = window.innerHeight - rect.bottom;
                                          const top = spaceBelow < menuHeight ? rect.top - menuHeight + 8 : rect.bottom + 8;
                                          setMenuPosition({ top, left: rect.right - 192 }); // 192 = w-48
                                          setActiveActionMenu(record.id);
                                          setCurrentMenuRecord(record);
                                        }
                                    }}
                                    className={`p-2 rounded-lg transition-all ${
                                        activeActionMenu === record.id 
                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' 
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Search size={48} className="mb-4 text-slate-300" />
                          <p className="text-slate-500 font-medium italic">No records found matching your search criteria.</p>
                          <p className="text-slate-400 text-xs mt-1">Try changing your filters or search term.</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        
        {/* Pagination */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500 font-medium">
           <p>Showing <span className="text-slate-900 dark:text-white font-bold">{records.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{pagination.total}</span> records</p>
           <div className="flex gap-2 items-center">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 disabled:opacity-50 font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="px-3 py-2 text-slate-700 dark:text-slate-300 font-bold">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.lastPage}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 disabled:opacity-50 font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>

      {/* Action Menu Portal - rendered outside table overflow context */}
      {activeActionMenu && menuPosition && currentMenuRecord && createPortal(
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => { setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
        >
          <div 
            className="fixed w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button 
                onClick={(e) => { e.stopPropagation(); handleView(currentMenuRecord.id); setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
              >
                <Eye size={14} className="text-slate-400" />
                View Details
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(currentMenuRecord.id, currentMenuRecord.name); setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
              >
                <Edit3 size={14} className="text-slate-400" />
                Edit Record
              </button>
              
              {activeTab !== 'deceased' && currentMenuRecord.status !== 'DECEASED' && (
                <>
                  {currentMenuRecord.appliedOnline && !currentMenuRecord.cardPrinted && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMarkPrinted(currentMenuRecord.id, currentMenuRecord.name); setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center gap-2 transition-colors"
                    >
                      <Printer size={14} />
                      Mark Card as Printed
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleMarkDeceased(currentMenuRecord.id, currentMenuRecord.name); setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                  >
                    <UserMinus size={14} className="text-slate-400" />
                    Mark as Deceased
                  </button>
                </>
              )}
              
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(currentMenuRecord.id, currentMenuRecord.name); setActiveActionMenu(null); setMenuPosition(null); setCurrentMenuRecord(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} />
                Delete / Archive
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Details Modal */}
      {viewModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setViewModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <User size={24} className="text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">PWD Profile Details</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Complete information view</p>
                </div>
              </div>
              <button 
                onClick={() => { setViewModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <span className="ml-3 text-slate-600">Loading details...</span>
                </div>
              ) : selectedPwd && (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="text-blue-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.first_name} {selectedPwd.middle_name || ''} {selectedPwd.last_name} {selectedPwd.suffix || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Assigned ID Number</p>
                        {selectedPwd.pwd_number ? (
                          <p className="font-mono font-semibold text-blue-600">{selectedPwd.pwd_number}</p>
                        ) : (
                          <p className="text-xs font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                            ID Assignment Pending
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          selectedPwd.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          selectedPwd.status === 'DECEASED' ? 'bg-slate-900 text-white' :
                          'bg-amber-100 text-amber-700'
                        }`}>{selectedPwd.status}</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date Applied</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.date_applied ? new Date(selectedPwd.date_applied).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Birth Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.birth_date ? new Date(selectedPwd.personal_info.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sex</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.sex || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Civil Status</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.civil_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Age</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.birth_date ? `${calculateAge(selectedPwd.personal_info.birth_date)} years old` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Blood Type</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.blood_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Religion</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.religion || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ethnic Group</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.personal_info?.ethnic_group || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Phone className="text-green-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mobile</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedPwd.contacts?.mobile || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Landline</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedPwd.contacts?.landline || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-slate-900 dark:text-white break-all">{selectedPwd.contacts?.email || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Guardian Contact</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedPwd.contacts?.guardian_contact || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Home className="text-orange-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Address</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">House/Street</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.address?.house_street || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Barangay</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.address?.barangay_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">City</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Province</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.address?.province || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Region</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.address?.region || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Disability Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="text-red-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Disability Information</h4>
                    </div>
                    {selectedPwd.disabilities && selectedPwd.disabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedPwd.disabilities.map((d, idx) => (
                          <span key={idx} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold">
                            {d.disability_type_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No disability information recorded</p>
                    )}
                  </div>

                  {/* Employment & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="text-purple-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Employment</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.employment?.status || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Category</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.employment?.category || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Occupation</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.employment?.occupation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="text-cyan-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Education</h4>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Educational Attainment</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.education?.attainment || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Members */}
                  {selectedPwd.family_members && selectedPwd.family_members.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="text-pink-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Family Members</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedPwd.family_members.map((f, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{f.relation_type}</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{f.first_name} {f.middle_name || ''} {f.last_name}</p>
                            {f.age && <p className="text-sm text-slate-500">{f.age} years old</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Government IDs */}
                  {selectedPwd.government_ids && selectedPwd.government_ids.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="text-teal-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Government IDs</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedPwd.government_ids.map((g, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{g.id_type}</p>
                            <p className="font-mono font-semibold text-slate-900 dark:text-white">{g.id_number || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Household Info */}
                  {selectedPwd.household_info && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="text-amber-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Household Information</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Living Arrangement</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.household_info.living_arrangement || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Income Source</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.household_info.income_source || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Monthly Income</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.household_info.monthly_income ? `₱${selectedPwd.household_info.monthly_income.toLocaleString()}` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organization */}
                  {selectedPwd.organization && selectedPwd.organization.organization_name && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="text-indigo-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Organization Affiliation</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Organization Name</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.organization.organization_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact Person</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.organization.contact_person || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.organization.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telephone</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.organization.telephone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dates & Meta */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="text-slate-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Record Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Accessibility Needs</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.accessibility_needs || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-3 mt-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Service Needs</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.service_needs || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 md:col-span-3 mt-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Remarks</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.remarks || 'N/A'}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date Applied</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.date_applied ? new Date(selectedPwd.date_applied).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Record Created</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedPwd.created_at ? new Date(selectedPwd.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {editModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setEditModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Edit3 size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit PWD Record</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Update member information</p>
                </div>
              </div>
              <button 
                onClick={() => { setEditModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              {modalLoading && !selectedPwd ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                  <span className="ml-3 text-slate-600">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="text-blue-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="md:col-span-4">
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Assigned ID Number</label>
                        <input type="text" value={editForm.pwd_number} onChange={(e) => setEditForm({...editForm, pwd_number: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">First Name *</label>
                        <input type="text" value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Middle Name</label>
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Phone className="text-green-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="text-red-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Disability Information</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">Disability Type</label>
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
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
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
                            <option value="Self-employed">Self-employed</option>
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
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="text-pink-600" size={20} />
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
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
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
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

                  {/* Record Information */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="text-indigo-600" size={20} />
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
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button 
                onClick={() => { setEditModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }}
                className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={modalLoading || !editForm.first_name || !editForm.last_name}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedRecord && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setDeleteModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Archive Record?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to archive the record of <span className="font-semibold text-slate-900 dark:text-white">{selectedRecord.name}</span>? This action can be undone by an administrator.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => { setDeleteModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }}
                  className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Archive Record
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mark Deceased Confirmation Modal */}
      {deceasedModalOpen && selectedRecord && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setDeceasedModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mark as Deceased?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to mark <span className="font-semibold text-slate-900 dark:text-white">{selectedRecord.name}</span> as deceased in the masterlist? This will update their status permanently.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => { setDeceasedModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }}
                  className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMarkDeceased}
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  Mark as Deceased
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Generate ID Card Modal */}
      <GenerateIdModal
        isOpen={generateIdModalOpen}
        onClose={() => { setGenerateIdModalOpen(false); setSelectedPwd(null); onModalStateChange?.(false); }}
        pwdData={selectedPwd}
      />

      {/* Mark Card as Printed Confirmation Modal */}
      {printedModalOpen && selectedRecord && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setPrintedModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Printer size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mark Card as Printed?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Confirm that the physical PWD ID card for <span className="font-semibold text-slate-900 dark:text-white">{selectedRecord.name}</span> has been printed.
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 mb-6">
                The member will be notified and can schedule a pickup appointment.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => { setPrintedModalOpen(false); setSelectedRecord(null); onModalStateChange?.(false); }}
                  className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMarkPrinted}
                  disabled={modalLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-green-600/20"
                >
                  {modalLoading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Mark as Printed
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success Confirmation Modal */}
      {successModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setSuccessModalOpen(false); onModalStateChange?.(false); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            <div className="p-8 text-center">
              <div className={`w-20 h-20 ${
                successTitle === 'Error' ? 'bg-rose-100 dark:bg-rose-900/30' : 
                successTitle.includes('Restricted') ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-emerald-100 dark:bg-emerald-900/30'
              } rounded-full flex items-center justify-center mx-auto mb-6`}>
                {successTitle === 'Error' || successTitle.includes('Restricted') ? (
                  <AlertTriangle size={40} className={successTitle === 'Error' ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"} />
                ) : (
                  <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <h3 className={`text-2xl font-bold ${
                successTitle === 'Error' ? 'text-rose-600 dark:text-rose-400' : 
                successTitle.includes('Restricted') ? 'text-amber-600 dark:text-amber-400' :
                'text-slate-900 dark:text-white'
              } mb-3`}>{successTitle}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
                {successMessage}
              </p>
              <button 
                onClick={() => {
                  setSuccessModalOpen(false);
                  onModalStateChange?.(false);
                }}
                className={`w-full px-6 py-3 ${
                  successTitle === 'Error' ? 'bg-rose-600 hover:bg-rose-700' : 
                  successTitle.includes('Restricted') ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-emerald-600 hover:bg-emerald-700'
                } text-white rounded-xl text-sm font-semibold transition-colors`}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ListPwd;
