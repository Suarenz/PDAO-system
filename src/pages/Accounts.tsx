import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Skeleton from '../components/Skeleton';
import { 
  Plus, 
  Search, 
  Shield, 
  User, 
  Users, 
  Lock,
  MoreHorizontal,
  Loader2,
  Edit3,
  Trash2,
  RefreshCcw,
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react';
import { usersApi, UserDetail, CreateUserData, UpdateUserData } from '../api/users';
import Modal from '../components/Modal';

interface UserAccount {
  id: number;
  id_number?: string;
  username?: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'ENCODER' | 'USER' | 'PWD MEMBER' | 'MAYOR';
  unit: string;
  status: 'ACTIVE' | 'INACTIVE';
  initial: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  created_at: string;
}

const Accounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'admins' | 'staff' | 'pwd'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    username: '',
    id_number: '',
    password: '',
    confirm_password: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF' | 'ENCODER' | 'USER' | 'PWD MEMBER' | 'MAYOR',
    unit: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {
        page: pagination.currentPage,
        per_page: pagination.perPage
      };

      if (searchTerm) filters.search = searchTerm;
      
      // Tab-specific filters
      if (activeTab === 'admins') filters.role = 'ADMIN';
      if (activeTab === 'staff') filters.role = 'STAFF';
      if (activeTab === 'pwd') filters.role = 'PWD MEMBER';

      const response = await usersApi.getAll(filters);
      
      const transformedAccounts: UserAccount[] = response.data.map((user: UserDetail) => ({
        id: user.id,
        id_number: user.id_number,
        username: user.username,
        name: `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.replace(/\s+/g, ' ').trim(),
        role: user.role,
        unit: user.unit || 'PDAO Central',
        status: user.status,
        initial: `${user.first_name[0]}${user.last_name[0]}`.toUpperCase(),
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        created_at: user.created_at
      }));

      setAccounts(transformedAccounts);
      setPagination({
        currentPage: response.meta?.current_page || 1,
        lastPage: response.meta?.last_page || 1,
        total: response.meta?.total || 0,
        perPage: response.meta?.per_page || 20
      });
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [pagination.currentPage, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchAccounts();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      middle_name: '',
      username: '',
      id_number: '',
      password: '',
      confirm_password: '',
      role: 'STAFF',
      unit: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    
    if (!isEdit || formData.password) {
      if (!isEdit && !formData.password) errors.password = 'Password is required';
      else if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirm_password) errors.confirm_password = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      const userData: CreateUserData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        username: formData.username || undefined,
        id_number: formData.id_number || undefined,
        password: formData.password,
        role: formData.role,
        unit: formData.unit || undefined,
        status: formData.status
      };

      await usersApi.create(userData);
      setCreateModalOpen(false);
      resetForm();
      fetchAccounts();
      showAlert('Account Created', 'New staff account has been created successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const message = err.response?.data?.message || 'Failed to create account. Please try again.';
      showAlert('Error', message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !validateForm(true)) return;

    setModalLoading(true);
    try {
      const userData: UpdateUserData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || undefined,
        username: formData.username || undefined,
        id_number: formData.id_number || undefined,
        role: formData.role,
        unit: formData.unit || undefined,
        status: formData.status
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      await usersApi.update(selectedUser.id, userData);
      setEditModalOpen(false);
      resetForm();
      setSelectedUser(null);
      fetchAccounts();
      showAlert('Account Updated', 'Account has been updated successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      const message = err.response?.data?.message || 'Failed to update account. Please try again.';
      showAlert('Error', message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setModalLoading(true);
    try {
      await usersApi.delete(selectedUser.id);
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchAccounts();
      showAlert('Account Deleted', 'Account has been deleted successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const message = err.response?.data?.message || 'Failed to delete account. Please try again.';
      showAlert('Error', message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await usersApi.update(user.id, { status: newStatus });
      fetchAccounts();
      showAlert('Status Updated', `Account has been ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, 'success');
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      showAlert('Error', 'Failed to update account status.', 'error');
    }
  };

  const openEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name || '',
      username: user.username || '',
      id_number: user.id_number || '',
      password: '',
      confirm_password: '',
      role: user.role,
      unit: user.unit,
      status: user.status
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const openDeleteModal = (user: UserAccount) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'STAFF': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'ENCODER': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'PWD MEMBER': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Accounts', count: pagination.total, icon: Users },
    { id: 'admins', label: 'Administrators', icon: Shield },
    { id: 'staff', label: 'Staff', icon: User },
    { id: 'pwd', label: 'PWD Members', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Accounts Management</h2>
          <p className="text-slate-500 text-sm mt-1">Unified access control for Admins, Staff, and PWD Members.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchAccounts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => { resetForm(); setCreateModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Create New Staff
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setPagination(prev => ({ ...prev, currentPage: 1 })); }}
              className={`
                flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all relative whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                }
              `}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'all' && (
                <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {pagination.total}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-6">
          <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search by name, ID or username..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Accounts Table */}
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] border-b border-slate-50 dark:border-slate-800">
                <th className="px-4 py-6">Account Identity</th>
                <th className="px-4 py-6">Access Role</th>
                <th className="px-4 py-6">Assigned Unit/Area</th>
                <th className="px-4 py-6">Status</th>
                <th className="px-4 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-5">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={48} className="mb-4 text-red-400" />
                      <p className="text-red-500 font-medium">{error}</p>
                      <button 
                        onClick={fetchAccounts}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : accounts.length > 0 ? (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                          {account.initial}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{account.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{account.username || account.id_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-wider flex items-center gap-1.5 w-fit ${getRoleBadgeColor(account.role)}`}>
                        {account.role === 'ADMIN' && <Shield size={10} />}
                        {account.role}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {account.unit}
                    </td>
                    <td className="px-4 py-5">
                      <button
                        onClick={() => handleToggleStatus(account)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity ${
                          account.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {account.status}
                      </button>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(account)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(account)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 italic text-sm">
                    No accounts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Showing {accounts.length} of {pagination.total} accounts
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(createModalOpen || editModalOpen) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); resetForm(); setSelectedUser(null); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editModalOpen ? 'Edit Account' : 'Create New Staff Account'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editModalOpen ? 'Update account information' : 'Add a new staff member to the system'}
                </p>
              </div>
              <button
                onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); resetForm(); setSelectedUser(null); }}
                disabled={modalLoading}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm ${formErrors.first_name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="Juan"
                  />
                  {formErrors.first_name && <p className="text-xs text-red-500 mt-1">{formErrors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm ${formErrors.last_name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="Dela Cruz"
                  />
                  {formErrors.last_name && <p className="text-xs text-red-500 mt-1">{formErrors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm`}
                    placeholder="jdelacruz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm`}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Password {!editModalOpen && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm pr-10 ${formErrors.password ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                      placeholder={editModalOpen ? 'Leave blank to keep' : '••••••••'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm ${formErrors.confirm_password ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="••••••••"
                  />
                  {formErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{formErrors.confirm_password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="STAFF">Staff</option>
                    <option value="ENCODER">Encoder</option>
                    <option value="USER">User</option>
                    <option value="PWD MEMBER">PWD Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Assigned Unit/Area
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  placeholder="e.g., PDAO Central, Barangay Biñan"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); resetForm(); setSelectedUser(null); }}
                disabled={modalLoading}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editModalOpen ? handleEditUser : handleCreateUser}
                disabled={modalLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {modalLoading && <Loader2 size={16} className="animate-spin" />}
                {editModalOpen ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
        onConfirm={handleDeleteUser}
        title="Delete Account"
        message={`Are you sure you want to delete the account for "${selectedUser?.name}"? This action cannot be undone.`}
        type="warning"
        confirmText="Delete Account"
        isLoading={modalLoading}
      />

      {/* Alert Modal */}
      <Modal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={() => setAlertModalOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={false}
      />
    </div>
  );
};

export default Accounts;
