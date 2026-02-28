import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Lock,
  Phone,
  Mail,
  Type,
  Sun,
  Moon,
  Contrast,
  Eye,
  Save,
  Loader2,
  CheckCircle2,
  Shield,
  Accessibility,
  Monitor,
  AlertTriangle,
  User,
  MapPin,
  Activity,
  Droplets,
  Calendar,
  Landmark,
} from 'lucide-react';
import { useAccessibility } from './AccessibilityContext';
import type { FontSize, ContrastMode, ApplicationStatus } from './types';

interface ProfileAccessibilityProps {
  userEmail?: string;
  userPhone?: string;
  userLandline?: string;
  guardianContactNo?: string;
  userName: string;
  applicationStatus?: ApplicationStatus;
  /** Major details from the application (read-only display) */
  majorDetails?: {
    fullName?: string;
    dateOfBirth?: string;
    sex?: string;
    civilStatus?: string;
    bloodType?: string;
    disabilityType?: string;
    address?: string;
  };
  onChangePassword?: (current: string, newPass: string, confirm: string) => void | Promise<void>;
  onUpdateContact?: (phone: string, email: string, landline: string, guardianContact: string) => void | Promise<void>;
}

const ProfileAccessibility: React.FC<ProfileAccessibilityProps> = ({
  userEmail = '',
  userPhone = '',
  userLandline = '',
  guardianContactNo = '',
  userName,
  applicationStatus,
  majorDetails,
  onChangePassword,
  onUpdateContact,
}) => {
  const { settings, setFontSize, setContrastMode, setScreenReaderMode } = useAccessibility();

  const isPostSubmission = !!applicationStatus && !['DRAFT'].includes(applicationStatus);
  const isApproved = !!applicationStatus && ['APPROVED', 'FOR_PRINTING', 'PRINTED', 'ISSUED'].includes(applicationStatus);

  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);
  const [landline, setLandline] = useState(userLandline);
  const [guardianContact, setGuardianContact] = useState(guardianContactNo);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) return;
    setIsSaving(true);
    try {
      if (onChangePassword) {
        await onChangePassword(currentPassword, newPassword, confirmPassword);
      }
      setSaveSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      // Error handled by parent's feedback modal
    } finally {
      setIsSaving(false);
    }
  };

  // Sync local state when props change (e.g. after fetch or after successful update)
  useEffect(() => { setPhone(userPhone); }, [userPhone]);
  useEffect(() => { setEmail(userEmail); }, [userEmail]);
  useEffect(() => { setLandline(userLandline); }, [userLandline]);
  useEffect(() => { setGuardianContact(guardianContactNo); }, [guardianContactNo]);

  const handleUpdateContact = async () => {
    setIsSaving(true);
    try {
      await onUpdateContact?.(phone, email, landline, guardianContact);
      setSaveSuccess('Contact info updated!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch {
      // Error handled by parent feedback modal
    } finally {
      setIsSaving(false);
    }
  };

  const fontSizeOptions: { value: FontSize; label: string; preview: string }[] = [
    { value: 'normal', label: 'Normal', preview: 'Aa' },
    { value: 'large', label: 'Large', preview: 'Aa' },
    { value: 'extra-large', label: 'Extra Large', preview: 'Aa' },
  ];

  const contrastOptions: { value: ContrastMode; label: string; icon: React.ReactNode; bg: string; fg: string }[] = [
    { value: 'light', label: 'Light Mode', icon: <Sun size={18} />, bg: 'bg-white', fg: 'text-slate-800' },
    { value: 'dark', label: 'Dark Mode', icon: <Moon size={18} />, bg: 'bg-slate-900', fg: 'text-white' },
    { value: 'high-contrast', label: 'High Contrast', icon: <Contrast size={18} />, bg: 'bg-black', fg: 'text-yellow-400' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <UserCog size={24} className="text-blue-600" />
          Profile & Accessibility
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account and customize your experience
        </p>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">{saveSuccess}</p>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{userName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shield size={14} /> PWD Member
            </p>
          </div>
        </div>
      </div>

      {/* ============ MAJOR DETAILS (Locked Post-Submission) ============ */}
      {isPostSubmission && majorDetails && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Major Details
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
              <Lock size={12} />
              READ-ONLY
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Identity fields are locked after submission to prevent fraud. To request changes, contact the PDAO office or submit a formal request to the Admin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: majorDetails.fullName, icon: <User size={14} /> },
              { label: 'Date of Birth', value: majorDetails.dateOfBirth, icon: <Calendar size={14} /> },
              { label: 'Sex', value: majorDetails.sex, icon: <User size={14} /> },
              { label: 'Civil Status', value: majorDetails.civilStatus, icon: <Landmark size={14} /> },
              { label: 'Blood Type', value: majorDetails.bloodType, icon: <Droplets size={14} /> },
              { label: 'Disability Type', value: majorDetails.disabilityType, icon: <Activity size={14} /> },
              { label: 'Address', value: majorDetails.address, icon: <MapPin size={14} /> },
            ].filter(f => f.value).map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {field.icon}
                  {field.label}
                </label>
                <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 min-h-[44px] flex items-center cursor-not-allowed">
                  <Lock size={12} className="mr-2 shrink-0 opacity-40" />
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ MINOR DETAILS (Editable) — Contact Information ============ */}
      {isApproved ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Phone size={18} className="text-blue-600" />
              Contact Information
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
              ✏️ EDITABLE
            </span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-5">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              You can update your contact information anytime to ensure PDAO can reach you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Mobile Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Landline Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={landline}
                  onChange={(e) => setLandline(e.target.value)}
                  placeholder="(049) XXX-XXXX"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Guardian Contact Number
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleUpdateContact}
            disabled={isSaving}
            className="mt-4 flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all min-h-[48px]"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Update Contact Info
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-400 dark:text-slate-600 flex items-center gap-2">
              <Phone size={18} className="text-slate-400 dark:text-slate-600" />
              Contact Information
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
              <Lock size={12} />
              LOCKED
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <Lock size={14} className="mt-0.5 shrink-0" />
              Contact information will be available after your application is approved by the admin. The data will be populated from your submitted application.
            </p>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
          <Lock size={18} className="text-blue-600" />
          Change Password
        </h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white min-h-[44px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isSaving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            Change Password
          </button>
        </div>
      </div>

      {/* Accessibility Tools */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Accessibility size={18} className="text-blue-600" />
          Accessibility Tools
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Customize the display to suit your needs
        </p>

        {/* Font Size */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Type size={16} />
            Font Size
          </h4>
          <div className="flex gap-3">
            {fontSizeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all min-h-[48px]
                  ${settings.fontSize === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                aria-pressed={settings.fontSize === opt.value}
              >
                <span className={`font-bold text-slate-800 dark:text-white ${
                  opt.value === 'normal' ? 'text-base' : opt.value === 'large' ? 'text-xl' : 'text-2xl'
                }`}>
                  {opt.preview}
                </span>
                <span className={`text-xs font-medium ${
                  settings.fontSize === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contrast Mode */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Monitor size={16} />
            Display Mode
          </h4>
          <div className="flex gap-3">
            {contrastOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setContrastMode(opt.value)}
                className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all min-h-[48px]
                  ${settings.contrastMode === opt.value
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                aria-pressed={settings.contrastMode === opt.value}
              >
                <div className={`w-10 h-10 rounded-lg ${opt.bg} border border-slate-200 dark:border-slate-600 flex items-center justify-center ${opt.fg} shadow-sm`}>
                  {opt.icon}
                </div>
                <span className={`text-xs font-medium ${
                  settings.contrastMode === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Screen Reader Mode */}
        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Eye size={16} />
            Screen Reader Mode
          </h4>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Simplified Layout</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reduces visual complexity for screen reader compatibility
              </p>
            </div>
            <button
              onClick={() => setScreenReaderMode(!settings.screenReaderMode)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 min-h-[32px] ${
                settings.screenReaderMode
                  ? 'bg-blue-600 shadow-lg shadow-blue-600/30'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              role="switch"
              aria-checked={settings.screenReaderMode}
              aria-label="Toggle screen reader mode"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  settings.screenReaderMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAccessibility;
