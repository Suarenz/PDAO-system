import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  Loader2,
  Bell,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  RefreshCw,
} from 'lucide-react';
import { appointmentsApi, AppointmentData, AppointmentStats } from '../api/appointments';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Scheduled' },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
  NO_SHOW: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'No Show' },
};

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifyId, setNotifyId] = useState<number | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('Your PWD ID is ready for pickup! Please visit the PDAO office during your scheduled appointment.');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page: currentPage, per_page: 15 };
      if (filterStatus) filters.status = filterStatus;
      if (filterDate) filters.date = filterDate;
      const response = await appointmentsApi.getAll(filters);
      setAppointments(response.data);
      setTotalPages(response.meta.last_page);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await appointmentsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch appointment stats:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [currentPage, filterStatus, filterDate]);

  const handleStatusUpdate = async () => {
    if (!actionId || !actionType) return;
    setIsProcessing(true);
    try {
      await appointmentsApi.updateStatus(actionId, actionType, actionNotes || undefined);
      setActionId(null);
      setActionType('');
      setActionNotes('');
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotifyIdReady = async () => {
    if (!notifyId) return;
    setIsProcessing(true);
    try {
      await appointmentsApi.notifyIdReady(notifyId, notifyMessage);
      setNotifyId(null);
      setNotifyMessage('Your PWD ID is ready for pickup! Please visit the PDAO office during your scheduled appointment.');
    } catch (error) {
      console.error('Failed to send notification:', error);
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
            <CalendarDays size={24} className="text-blue-600" />
            Appointment Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and manage scheduled appointments for ID pickup
          </p>
        </div>
        <button onClick={() => { fetchAppointments(); fetchStats(); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Today', value: stats.today_count, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Scheduled', value: stats.total_scheduled, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Completed', value: stats.total_completed, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Cancelled', value: stats.total_cancelled, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'No Show', value: stats.total_no_show, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
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
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-xs text-blue-600 hover:underline">Clear date</button>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading...
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <CalendarDays size={36} className="mb-2 text-slate-300" />
            <p className="text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Applicant</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Proxy</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appointments.map((apt) => {
                  const statusCfg = STATUS_COLORS[apt.status] || STATUS_COLORS.SCHEDULED;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{apt.user_name || 'Unknown'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {new Date(apt.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{apt.appointment_time}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {apt.proxy_name ? `${apt.proxy_name} (${apt.proxy_relationship})` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => { setActionId(apt.id); setActionType('COMPLETED'); }}
                                className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                                title="Mark Complete"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => { setActionId(apt.id); setActionType('NO_SHOW'); }}
                                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 transition-colors"
                                title="Mark No Show"
                              >
                                <AlertCircle size={16} />
                              </button>
                              <button
                                onClick={() => { setActionId(apt.id); setActionType('CANCELLED'); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                title="Cancel"
                              >
                                <XCircle size={16} />
                              </button>
                              <button
                                onClick={() => setNotifyId(apt.id)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                                title="Notify ID Ready"
                              >
                                <Bell size={16} />
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

      {/* Status Update Dialog */}
      {actionId && actionType && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => { setActionId(null); setActionType(''); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {actionType === 'COMPLETED' ? 'Mark as Completed' : actionType === 'CANCELLED' ? 'Cancel Appointment' : 'Mark as No Show'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Add optional notes for this action.</p>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Notes (optional)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setActionId(null); setActionType(''); setActionNotes(''); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                  actionType === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify ID Ready Dialog */}
      {notifyId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px]" onClick={() => setNotifyId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" />
              Notify User — ID Ready
            </h3>
            <p className="text-sm text-slate-500 mb-4">Send a notification to the user that their PWD ID is ready for pickup.</p>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setNotifyId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleNotifyIdReady}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
