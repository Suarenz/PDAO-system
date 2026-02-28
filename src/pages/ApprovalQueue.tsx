import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Skeleton from '../components/Skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  ArrowRight,
  ShieldAlert,
  Edit3,
  RefreshCcw,
  Trash2,
  Check,
  Loader2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  IdCard,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { approvalApi } from '../api/approvals';
import type { PendingApproval } from '../api/client';
import Modal, { useModal } from '../components/Modal';

interface ApprovalQueueProps {
  onModalStateChange?: (isOpen: boolean) => void;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ onModalStateChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  
  // Sync modal state with parent to hide navigation
  useEffect(() => {
    const isAnyModalOpen = confirmModalOpen || promptModalOpen || alertModalOpen || viewModalOpen;
    onModalStateChange?.(isAnyModalOpen);
  }, [confirmModalOpen, promptModalOpen, alertModalOpen, viewModalOpen, onModalStateChange]);

  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'confirm' as 'confirm' | 'prompt' | 'success' | 'error' | 'warning' | 'info',
    confirmText: 'Confirm',
    placeholder: '',
    inputLabel: '',
    onConfirm: (value?: string) => {}
  });

  // Fetch pending registrations from API
  const fetchPendingItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await approvalApi.getAll({ status: 'PENDING' });
      setPendingItems(response.data);
    } catch (err: any) {
      console.error('Failed to fetch pending registrations:', err);
      setError('Failed to load pending registrations. Please try again.');
      setPendingItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const handleViewDetails = async (id: number) => {
    setModalLoading(true);
    setViewModalOpen(true);
    try {
      const details = await approvalApi.getById(id);
      setSelectedApproval(details);
    } catch (err) {
      console.error('Failed to fetch approval details:', err);
      showAlert('Error', 'Failed to load details. Please try again.', 'error');
      setViewModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const month = today.getMonth() - birthDateObj.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setModalConfig({
      ...modalConfig,
      title,
      message,
      type,
      confirmText: 'OK',
      onConfirm: () => setAlertModalOpen(false)
    });
    setAlertModalOpen(true);
  };

  const handleApprove = async (id: number) => {
    setModalConfig({
      title: 'Approve Registration',
      message: 'Are you sure you want to approve this registration? Please assign a PWD ID Number below.',
      type: 'prompt',
      confirmText: 'Approve & Assign',
      placeholder: 'Enter PWD ID Number...',
      inputLabel: 'PWD ID Number',
      onConfirm: async (pwdNumber?: string) => {
        if (!pwdNumber) {
          showAlert('Validation Error', 'PWD ID Number is required for approval.', 'error');
          return;
        }
        setModalLoading(true);
        try {
          await approvalApi.approve(id, undefined, pwdNumber);
          setPendingItems(prev => prev.filter(item => item.id !== id));
          setPromptModalOpen(false);
          showAlert('Registration Approved', 'Registration has been approved and PWD ID has been assigned.', 'success');
        } catch (err: any) {
          console.error('Failed to approve registration:', err);
          setPromptModalOpen(false);
          showAlert('Error', 'Failed to approve registration. Please try again.', 'error');
        } finally {
          setModalLoading(false);
        }
      }
    });
    setPromptModalOpen(true);
  };

  const handleDecline = async (id: number) => {
    setModalConfig({
      title: 'Decline Application',
      message: 'Please provide a reason for declining this application. This will be sent to the applicant.',
      type: 'prompt',
      confirmText: 'Decline Application',
      placeholder: 'Enter the reason for declining...',
      inputLabel: 'Reason for Declining',
      onConfirm: async (reason?: string) => {
        if (!reason) return;
        setModalLoading(true);
        try {
          await approvalApi.reject(id, reason);
          setPendingItems(prev => prev.filter(item => item.id !== id));
          setPromptModalOpen(false);
          showAlert('Application Declined', 'The application has been declined. The applicant will be notified with your reason.', 'info');
        } catch (err: any) {
          console.error('Failed to decline registration:', err);
          setPromptModalOpen(false);
          showAlert('Error', 'Failed to decline registration. Please try again.', 'error');
        } finally {
          setModalLoading(false);
        }
      }
    });
    setPromptModalOpen(true);
  };

  const handleRequestChanges = async (id: number) => {
    setModalConfig({
      title: 'Request Changes',
      message: 'Please specify what information needs to be corrected or added by the applicant.',
      type: 'prompt',
      confirmText: 'Send Request',
      placeholder: 'Describe what needs to be changed...',
      inputLabel: 'Required Changes',
      onConfirm: async (reason?: string) => {
        if (!reason) return;
        setModalLoading(true);
        try {
          await approvalApi.markForReview(id, reason);
          await fetchPendingItems();
          setPromptModalOpen(false);
          showAlert('Request Sent', `Correction request has been sent to the applicant.`, 'success');
        } catch (err: any) {
          console.error('Failed to request changes:', err);
          setPromptModalOpen(false);
          showAlert('Error', 'Failed to send request. Please try again.', 'error');
        } finally {
          setModalLoading(false);
        }
      }
    });
    setPromptModalOpen(true);
  };

  const handleEdit = (id: number) => {
    showAlert('Edit Mode', `Opening editing mode for record REG-${id}. Administrator can now modify applicant data before approval.`, 'info');
  };

  const filteredItems = pendingItems.filter(item => 
    (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    item.id.toString().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Registration Approval
            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {pendingItems.length} Pending
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, edit, and approve submitted PWD registrations before final recording.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={fetchPendingItems}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-50"
            >
                <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search pending applications by ID or Name..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em]">
                <th className="px-8 py-6">Reference / Applicant</th>
                <th className="px-6 py-6">Date Submitted</th>
                <th className="px-6 py-6">Category</th>
                <th className="px-6 py-6">Barangay</th>
                <th className="px-8 py-6 text-right">Verification & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert size={64} className="mb-4 text-red-300" />
                      <p className="text-red-500 font-medium text-lg">{error}</p>
                      <button 
                        onClick={fetchPendingItems}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleViewDetails(item.id)}>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-0.5">{item.name || 'Unknown'}</p>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">REG-{item.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {item.date_submitted ? new Date(item.date_submitted).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.disability_type || 'Not specified'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.barangay || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Primary Tool Buttons */}
                        <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1 gap-0.5 mr-2 border border-slate-200/50 dark:border-slate-700">
                          <button 
                              onClick={() => handleViewDetails(item.id)}
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" 
                              title="View Full Details"
                          >
                             <Eye size={16} />
                          </button>
                          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                          <button 
                              onClick={() => handleRequestChanges(item.id)}
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" 
                              title="Request Changes"
                          >
                             <RefreshCcw size={16} />
                          </button>
                          <button 
                              onClick={() => handleDecline(item.id)}
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all" 
                              title="Decline Application"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Approve Button */}
                        <button 
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                        >
                           <Check size={14} /> Approve <ArrowRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <ShieldAlert size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-lg italic">The approval queue is currently empty.</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">All submitted registrations have been processed.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => !modalLoading && setConfirmModalOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type="confirm"
        confirmText={modalConfig.confirmText}
        isLoading={modalLoading}
      />

      {/* Prompt Modal */}
      <Modal
        isOpen={promptModalOpen}
        onClose={() => !modalLoading && setPromptModalOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type="prompt"
        confirmText={modalConfig.confirmText}
        placeholder={modalConfig.placeholder}
        inputLabel={modalConfig.inputLabel}
        inputRequired={true}
        isLoading={modalLoading}
      />

      {/* Alert Modal */}
      <Modal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={() => setAlertModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showCancel={false}
      />

      {/* View Details Modal */}
      {viewModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setViewModalOpen(false); setSelectedApproval(null); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <User size={24} className="text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">PWD Profile Details</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Reviewing application REG-{selectedApproval?.id}</p>
                </div>
              </div>
              <button 
                onClick={() => { setViewModalOpen(false); setSelectedApproval(null); }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                disabled={modalLoading}
              >
                <X size={24} className="text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="space-y-8">
                  <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i}>
                          <Skeleton className="h-3 w-20 mb-2" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                  </div>
                </div>
              ) : selectedApproval?.pwd_profile && (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="text-blue-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Full Name</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.first_name} {selectedApproval.pwd_profile.middle_name || ''} {selectedApproval.pwd_profile.last_name} {selectedApproval.pwd_profile.suffix || ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Submission Type</p>
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {selectedApproval.submission_type}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          selectedApproval.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          selectedApproval.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{selectedApproval.status}</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date Applied</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.date_submitted ? new Date(selectedApproval.date_submitted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (selectedApproval.pwd_profile.date_applied ? new Date(selectedApproval.pwd_profile.date_applied).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Birth Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.birth_date ? new Date(selectedApproval.pwd_profile.personal_info.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sex</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.sex || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Civil Status</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.civil_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Age</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.birth_date ? `${calculateAge(selectedApproval.pwd_profile.personal_info.birth_date)} years old` : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Blood Type</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.blood_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Religion</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.religion || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ethnic Group</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.personal_info?.ethnic_group || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                      <Phone className="text-green-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h4>
                    </div>
                    {/* Map contacts array to show mobile, etc. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Mobile</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedApproval.pwd_profile.contacts?.mobile || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Landline</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedApproval.pwd_profile.contacts?.landline || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="font-semibold text-slate-900 dark:text-white break-all">{selectedApproval.pwd_profile.contacts?.email || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Guardian Contact</p>
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedApproval.pwd_profile.contacts?.guardian_contact || 'N/A'}</p>
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
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">House/Street</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.address?.house_street || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Barangay</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.address?.barangay?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">City</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.address?.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Province</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.address?.province || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Region</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.address?.region || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Disability Info */}
                  <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="text-red-600" size={20} />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Disability Information</h4>
                    </div>
                    {selectedApproval.pwd_profile.disabilities && selectedApproval.pwd_profile.disabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedApproval.pwd_profile.disabilities.map((d: any, idx: number) => (
                          <span key={idx} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold">
                            {d.disability_type?.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No disability information recorded</p>
                    )}
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
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.employment?.status || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Category</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.employment?.category || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Occupation</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.employment?.occupation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="text-cyan-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Education</h4>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Educational Attainment</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.education?.attainment || 'Unspecified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Members */}
                  {selectedApproval.pwd_profile.family_members && selectedApproval.pwd_profile.family_members.length > 0 && (
                    <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="text-pink-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Family Members</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedApproval.pwd_profile.family_members.map((f: any, idx: number) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{f.relation_type}</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{f.first_name} {f.middle_name || ''} {f.last_name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Government IDs */}
                  {selectedApproval.pwd_profile.government_ids && selectedApproval.pwd_profile.government_ids.length > 0 && (
                    <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="text-teal-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Government IDs</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedApproval.pwd_profile.government_ids.map((g: any, idx: number) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{g.id_type}</p>
                            <p className="font-mono font-semibold text-slate-900 dark:text-white">{g.id_number || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Household Info */}
                  {selectedApproval.pwd_profile.household_info && (
                    <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="text-amber-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Household Information</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Living Arrangement</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.household_info.living_arrangement || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Income Source</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.household_info.income_source || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Monthly Income</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.household_info.monthly_income ? `₱${selectedApproval.pwd_profile.household_info.monthly_income.toLocaleString()}` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organization */}
                  {selectedApproval.pwd_profile.organization && selectedApproval.pwd_profile.organization.organization_name && (
                    <div className="bg-white/5 dark:bg-slate-800/10 rounded-2xl p-6 border border-white/10 dark:border-slate-700/20 shadow-sm backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4">
                        <Building2 className="text-indigo-600" size={20} />
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">Organization Affiliation</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Organization Name</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.organization.organization_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact Person</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.organization.contact_person || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.organization.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telephone</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{selectedApproval.pwd_profile.organization.telephone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button 
                      onClick={() => { setViewModalOpen(false); setSelectedApproval(null); }}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Close Review
                    </button>
                    <button 
                      onClick={() => { setViewModalOpen(false); handleApprove(selectedApproval.id); }}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      Approve Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ApprovalQueue;
