import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  RefreshCw,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  MessageSquare,
  Eye,
  Download,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { serviceRequestsApi, ServiceRequestData, ServiceRequestStats } from '../api/serviceRequests';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending' },
  PROCESSING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Processing' },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Completed' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Rejected' },
};

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  LOST_ID: { label: 'Lost ID', icon: <AlertTriangle size={14} className="text-red-500" /> },
  DAMAGED_ID: { label: 'Damaged ID', icon: <AlertTriangle size={14} className="text-amber-500" /> },
  RENEWAL: { label: 'Renewal', icon: <RefreshCw size={14} className="text-blue-500" /> },
};

const ServiceRequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequestData[]>([]);
  const [stats, setStats] = useState<ServiceRequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewRequest, setViewRequest] = useState<ServiceRequestData | null>(null);
  const [previewAffidavit, setPreviewAffidavit] = useState<string | null>(null);
  const [resolutionRequest, setResolutionRequest] = useState<ServiceRequestData | null>(null);
  const [interactionNotes, setInteractionNotes] = useState('');
  const [interactionError, setInteractionError] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page: currentPage, per_page: 15 };
      if (filterStatus) filters.status = filterStatus;
      if (filterType) filters.type = filterType;
      const response = await serviceRequestsApi.getAll(filters);
      setRequests(response.data);
      setTotalPages(response.meta.last_page);
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await serviceRequestsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [currentPage, filterStatus, filterType]);

  const handleStatusUpdate = async () => {
    if (!actionId || !actionStatus) return;
    setIsProcessing(true);
    try {
      await serviceRequestsApi.updateStatus(actionId, actionStatus, actionNotes || undefined);
      setActionId(null);
      setActionStatus('');
      setActionNotes('');
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolution = async () => {
    if (!resolutionRequest) return;
    if (!interactionNotes.trim()) {
      setInteractionError('Interaction notes are required for legal compliance.');
      return;
    }
    setIsProcessing(true);
    try {
      await serviceRequestsApi.updateStatus(resolutionRequest.id, 'COMPLETED', interactionNotes);
      setResolutionRequest(null);
      setInteractionNotes('');
      setInteractionError('');
      fetchRequests();
      fetchStats();
    } catch (error) {
      console.error('Failed to complete request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FileText size={24} className="text-indigo-600" />
            Service Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage lost ID reports, damaged ID reports, and ID renewal requests
          </p>
        </div>
        <button onClick={() => { fetchRequests(); fetchStats(); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: stats.total_pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Processing', value: stats.total_processing, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Completed', value: stats.total_completed, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Rejected', value: stats.total_rejected, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-700`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">All Types</option>
          <option value="LOST_ID">Lost ID</option>
          <option value="DAMAGED_ID">Damaged ID</option>
          <option value="RENEWAL">Renewal</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <FileText size={36} className="mb-2 text-slate-300" />
            <p className="text-sm">No service requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Requester</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Affidavit</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => {
                  const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.PENDING;
                  const typeCfg = TYPE_LABELS[req.type] || { label: req.type, icon: <FileText size={14} /> };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{req.user_name || 'Unknown'}</p>
                        {req.user_phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-slate-400" />
                            {req.user_phone}
                          </p>
                        )}
                        {req.user_email && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="text-slate-400" />
                            {req.user_email}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {typeCfg.icon}
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{typeCfg.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {req.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {req.affidavit_path ? (
                          <button onClick={() => setPreviewAffidavit(req.affidavit_path)} className="text-blue-600 hover:underline text-xs font-medium">
                            View File
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewRequest(req)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {(req.status === 'PENDING' || req.status === 'PROCESSING') && (
                            <>
                              {req.status === 'PENDING' && (
                                <button
                                  onClick={() => { setActionId(req.id); setActionStatus('PROCESSING'); }}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                                  title="Start Processing"
                                >
                                  <Clock size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => setResolutionRequest(req)}
                                className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                                title="Complete Submission"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => { setActionId(req.id); setActionStatus('REJECTED'); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40">
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40">
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Status Update Dialog (Processing / Rejected) */}
      {actionId && actionStatus && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => { setActionId(null); setActionStatus(''); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {actionStatus === 'PROCESSING' ? 'Start Processing' : 'Reject Request'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {actionStatus === 'PROCESSING'
                ? 'This request will be marked as being processed.'
                : 'This request will be rejected. Please provide a reason.'}
            </p>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={actionStatus === 'REJECTED' ? 'Reason for rejection...' : 'Notes (optional)...'}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setActionId(null); setActionStatus(''); setActionNotes(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                  actionStatus === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Details Dialog */}
      {viewRequest && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setViewRequest(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              Request Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Requester</span>
                <span className="text-slate-800 dark:text-white font-medium">{viewRequest.user_name}</span>
              </div>
              {/* Contact Information */}
              {(viewRequest.user_phone || viewRequest.user_email) && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Information</p>
                  {viewRequest.user_phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="text-slate-400" />
                      <span>{viewRequest.user_phone}</span>
                    </div>
                  )}
                  {viewRequest.user_email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Mail size={14} className="text-slate-400" />
                      <span>{viewRequest.user_email}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-800 dark:text-white font-medium">
                  {TYPE_LABELS[viewRequest.type]?.label || viewRequest.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[viewRequest.status]?.bg} ${STATUS_COLORS[viewRequest.status]?.text}`}>
                  {STATUS_COLORS[viewRequest.status]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="text-slate-800 dark:text-white">{new Date(viewRequest.created_at).toLocaleString()}</span>
              </div>
              {viewRequest.processed_by && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Processed By</span>
                  <span className="text-slate-800 dark:text-white font-medium">{viewRequest.processed_by}</span>
                </div>
              )}
              {viewRequest.processed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Processed At</span>
                  <span className="text-slate-800 dark:text-white">{new Date(viewRequest.processed_at).toLocaleString()}</span>
                </div>
              )}
              {viewRequest.notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs">{viewRequest.notes}</p>
                </div>
              )}
              {viewRequest.admin_notes && (
                <div>
                  <span className="text-slate-500 block mb-1">Admin Interaction Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs">{viewRequest.admin_notes}</p>
                </div>
              )}
              {viewRequest.affidavit_path && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Affidavit</span>
                  <button onClick={() => setPreviewAffidavit(viewRequest.affidavit_path)} className="text-blue-600 hover:underline font-medium">
                    View
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setViewRequest(null)} className="mt-6 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Affidavit Preview Modal */}
      {previewAffidavit && (() => {
        const storageUrl = `/storage/${previewAffidavit}`;
        const ext = previewAffidavit.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isPdf = ext === 'pdf';
        return createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="fixed inset-0" onClick={() => setPreviewAffidavit(null)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Affidavit Preview
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={storageUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </a>
                  <button
                    onClick={() => setPreviewAffidavit(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>
              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                {isImage ? (
                  <img src={storageUrl} alt="Affidavit" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                ) : isPdf ? (
                  <iframe src={storageUrl} className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-700" title="Affidavit PDF" />
                ) : (
                  <div className="text-center text-slate-500">
                    <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">Preview not available for this file type.</p>
                    <a href={storageUrl} download className="text-blue-600 hover:underline text-sm mt-2 inline-block">Download File</a>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Resolution Modal - Complete Submission */}
      {resolutionRequest && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => { if (!isProcessing) { setResolutionRequest(null); setInteractionNotes(''); setInteractionError(''); } }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Complete Submission</h3>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-4">
                Log the details of your interaction with <span className="font-semibold text-slate-700 dark:text-slate-200">{resolutionRequest.user_name}</span> before marking this request as completed. This is required for audit trail purposes.
              </p>

              {/* Contact Info Summary */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Information</p>
                {resolutionRequest.user_phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400" />
                    <span>{resolutionRequest.user_phone}</span>
                  </div>
                )}
                {resolutionRequest.user_email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail size={14} className="text-slate-400" />
                    <span>{resolutionRequest.user_email}</span>
                  </div>
                )}
                {!resolutionRequest.user_phone && !resolutionRequest.user_email && (
                  <p className="text-sm text-slate-400 italic">No contact information available</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Interaction Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={interactionNotes}
                  onChange={(e) => { setInteractionNotes(e.target.value); setInteractionError(''); }}
                  placeholder='e.g., "Called Reynaldo on Feb 28 at 10:00 AM. Verified the ID was lost in a taxi. Details confirmed."'
                  rows={4}
                  className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none ${
                    interactionError ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {interactionError && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {interactionError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setResolutionRequest(null); setInteractionNotes(''); setInteractionError(''); }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolution}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ServiceRequestManagement;
