import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  RefreshCw,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Calendar,
  XCircle,
  Info,
} from 'lucide-react';
import type { ServiceRequest, ServiceRequestType } from './types';
import { serviceRequestsApi, ServiceRequestData } from '../api/serviceRequests';

interface ServicesProps {
  existingRequests?: ServiceRequest[];
  idExpiryDate?: string; // ISO date string
  onSubmitRequest?: (type: ServiceRequestType, notes: string, file?: File) => void;
}

const Services: React.FC<ServicesProps> = ({
  existingRequests = [],
  idExpiryDate,
  onSubmitRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'lost' | 'renewal'>('lost');
  const [lostReason, setLostReason] = useState<'LOST_ID' | 'DAMAGED_ID'>('LOST_ID');
  const [notes, setNotes] = useState('');
  const [affidavitFile, setAffidavitFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [requestHistory, setRequestHistory] = useState<ServiceRequestData[]>([]);
  const [pendingRenewal, setPendingRenewal] = useState<ServiceRequestData | null>(null);

  // Fetch request history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await serviceRequestsApi.getAll({ per_page: 20 });
        setRequestHistory(response.data);
        // Check for existing pending/processing renewal
        const existing = response.data.find(
          (r) => r.type === 'RENEWAL' && (r.status === 'PENDING' || r.status === 'PROCESSING')
        );
        setPendingRenewal(existing || null);
      } catch (error) {
        console.error('Failed to fetch service request history:', error);
      }
    };
    fetchHistory();
  }, [submitSuccess]);

  // Calculate renewal eligibility
  const expiryDate = idExpiryDate ? new Date(idExpiryDate) : null;
  const now = new Date();
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isRenewalEligible = daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const handleSubmitLostDamaged = async () => {
    if (!affidavitFile) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('type', lostReason);
      formData.append('notes', notes);
      formData.append('affidavit', affidavitFile);
      await serviceRequestsApi.submit(formData);
      onSubmitRequest?.(lostReason, notes, affidavitFile);
      setSubmitSuccess(true);
      setNotes('');
      setAffidavitFile(null);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRenewal = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('type', 'RENEWAL');
      formData.append('notes', notes);
      await serviceRequestsApi.submit(formData);
      onSubmitRequest?.('RENEWAL', notes);
      setSubmitSuccess(true);
      setNotes('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || 'Failed to submit renewal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      PROCESSING: { label: 'Processing', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    const cfg = map[status] || map.PENDING;
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${cfg.className}`}>{cfg.label}</span>;
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { LOST_ID: 'Lost ID', DAMAGED_ID: 'Damaged ID', RENEWAL: 'Renewal' };
    return map[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Wrench size={24} className="text-blue-600" />
          Services
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Report a lost or damaged ID, or renew your PWD card
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('lost')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px]
            ${activeTab === 'lost'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
        >
          <ShieldAlert size={18} />
          Report Lost / Damaged
        </button>
        <button
          onClick={() => setActiveTab('renewal')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px]
            ${activeTab === 'renewal'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
        >
          <RefreshCw size={18} />
          Renewal
        </button>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Your request has been submitted successfully! We'll notify you of updates.
          </p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <XCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {/* Lost / Damaged Tab */}
      {activeTab === 'lost' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-500" />
            Report Lost or Damaged ID
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit a request for a replacement PWD ID card. You'll need to upload an Affidavit of Loss.
          </p>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Reason <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-3">
              {[
                { value: 'LOST_ID' as const, label: 'Lost ID', icon: <AlertTriangle size={16} /> },
                { value: 'DAMAGED_ID' as const, label: 'Damaged ID', icon: <XCircle size={16} /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLostReason(opt.value)}
                  className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all min-h-[48px]
                    ${lostReason === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                    }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Affidavit Upload */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Affidavit of Loss <span className="text-rose-500">*</span>
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all
                ${affidavitFile
                  ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
            >
              {affidavitFile ? (
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">{affidavitFile.name}</span>
                  <button
                    onClick={() => setAffidavitFile(null)}
                    className="ml-2 text-red-500 hover:text-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload size={28} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setAffidavitFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the circumstances..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmitLostDamaged}
            disabled={!affidavitFile || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            Submit Replacement Request
          </button>
        </div>
      )}

      {/* Renewal Tab */}
      {activeTab === 'renewal' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <RefreshCw size={20} className="text-blue-600" />
            PWD ID Renewal
          </h3>

          {/* Expiry Status */}
          {expiryDate && (
            <div className={`rounded-xl p-4 border flex items-start gap-3
              ${isExpired
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : isRenewalEligible
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
              }`}
            >
              <Calendar size={20} className={`shrink-0 mt-0.5 ${isExpired ? 'text-red-500' : isRenewalEligible ? 'text-green-500' : 'text-slate-400'}`} />
              <div>
                <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : isRenewalEligible ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {isExpired
                    ? 'Your PWD ID has expired'
                    : isRenewalEligible
                      ? `Your ID expires in ${daysUntilExpiry} days — Renewal available`
                      : `Your ID expires on ${expiryDate.toLocaleDateString()} (${daysUntilExpiry} days remaining)`
                  }
                </p>
                {!isRenewalEligible && !isExpired && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Renewal will become available 60 days before expiration.
                  </p>
                )}
              </div>
            </div>
          )}

          {!expiryDate && (
            <div className="rounded-xl p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Expiry date not available
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Your PWD ID expiry date could not be determined. Please contact the PDAO office for assistance.
                </p>
              </div>
            </div>
          )}

          {/* Pending Renewal Notice */}
          {pendingRenewal && (
            <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 flex items-start gap-3">
              <Loader2 size={20} className="text-blue-500 shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  Renewal Request {pendingRenewal.status === 'PROCESSING' ? 'Being Processed' : 'Pending Review'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  You submitted a renewal request on {new Date(pendingRenewal.created_at).toLocaleDateString()}. 
                  {pendingRenewal.status === 'PENDING'
                    ? ' It is currently awaiting admin review.'
                    : ' It is currently being processed by the PDAO office.'}
                </p>
                {pendingRenewal.admin_notes && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                    Admin note: {pendingRenewal.admin_notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {(isRenewalEligible || isExpired) && !pendingRenewal ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium flex items-start gap-2">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  Your existing information will be pre-filled in the renewal application. You can update any changed details.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Notes (if any information has changed)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Changed address, new contact number..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSubmitRenewal}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20 transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Submit Renewal Request
              </button>
            </>
          ) : !pendingRenewal ? (
            <div className="text-center py-8">
              <Clock size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {expiryDate
                  ? 'Renewal is not yet available. Check back closer to your expiration date.'
                  : 'Renewal eligibility cannot be determined without an expiry date.'}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Request History - from API */}
      {requestHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            Request History
          </h3>
          <div className="space-y-3">
            {requestHistory.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-700">
                    {req.type === 'RENEWAL' ? <RefreshCw size={16} className="text-blue-500" /> : <ShieldAlert size={16} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{req.type_label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Requests (from props - backward compatibility) */}
      {existingRequests.length > 0 && requestHistory.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            Request History
          </h3>
          <div className="space-y-3">
            {existingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-700">
                    {req.type === 'RENEWAL' ? <RefreshCw size={16} className="text-blue-500" /> : <ShieldAlert size={16} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{typeLabel(req.type)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.createdAt}</p>
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
