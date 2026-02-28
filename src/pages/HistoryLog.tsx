import React, { useState, useEffect } from 'react';
import Skeleton from '../components/Skeleton';
import { 
  CheckCircle2, 
  RotateCw, 
  Clock3, 
  AlertCircle, 
  User, 
  Trash2,
  ChevronDown,
  Loader2,
  Calendar
} from 'lucide-react';
import { logsApi } from '../api';
import { useAuth } from '../context';
import Modal, { useModal } from '../components/Modal';

interface LogEntry {
  id: string;
  type: 'approval' | 'update' | 'report' | 'security' | 'error' | 'create' | 'delete';
  message: string;
  refId: string;
  timestamp: string;
  user: string;
}

const HistoryLog: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [archivedMonths, setArchivedMonths] = useState<string[]>([]);

  const { showAlert, showConfirm, ModalComponent } = useModal();
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  // Fetch logs
  const fetchLogs = async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let response;
      if (selectedMonth === 'current') {
        response = await logsApi.getAll({ page: pageNum, per_page: 20 });
      } else {
        response = await logsApi.getAll({ month: selectedMonth, page: pageNum, per_page: 20 });
      }

      // Transform API response
      const transformedLogs: LogEntry[] = response.data.map((log: any) => ({
        id: log.id.toString(),
        type: mapActionToType(log.action_type),
        message: log.description || `${log.action_type} on ${log.model_type}`,
        refId: log.model_id ? `${log.model_type}-${log.model_id}` : log.id.toString(),
        timestamp: formatTimestamp(log.created_at),
        user: log.user || 'System'
      }));

      if (append) {
        setLogs(prev => [...prev, ...transformedLogs]);
      } else {
        setLogs(transformedLogs);
      }

      setHasMore(response.meta?.current_page < response.meta?.last_page);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fetch archived months
  const fetchArchivedMonths = async () => {
    try {
      const months = await logsApi.getArchiveMonths();
      setArchivedMonths(months);
    } catch (err) {
      console.error('Failed to fetch archived months:', err);
    }
  };

  // Map action to type
  const mapActionToType = (action: string): LogEntry['type'] => {
    switch (action?.toLowerCase()) {
      case 'approved':
      case 'approve':
        return 'approval';
      case 'updated':
      case 'update':
        return 'update';
      case 'created':
      case 'create':
      case 'register':
        return 'create';
      case 'deleted':
      case 'delete':
        return 'delete';
      case 'error':
        return 'error';
      case 'security':
      case 'login':
      case 'logout':
        return 'security';
      case 'report':
      case 'exported':
      case 'imported':
        return 'report';
      default:
        return 'update';
    }
  };

  // Format timestamp
  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchLogs(1, false);
    fetchArchivedMonths();
  }, [selectedMonth]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'update':
        return <RotateCw className="text-blue-500" size={20} />;
      case 'create':
        return <CheckCircle2 className="text-gray-600" size={20} />;
      case 'delete':
        return <Trash2 className="text-red-500" size={20} />;
      case 'security':
      case 'error':
        return <AlertCircle className="text-amber-600" size={20} />;
      default:
        return <Clock3 className="text-gray-500" size={20} />;
    }
  };

  const handleClearLogs = async () => {
    if (!isAdmin) {
      showAlert("Access Restricted", "This feature requires admin privileges.", "warning");
      return;
    }

    const confirmed = await showConfirm(
      "Clear History",
      "Are you sure you want to clear the activity history? This action will archive current logs and clear the active view. This cannot be undone."
    );

    if (confirmed) {
      try {
        setIsLoading(true);
        await logsApi.clearCurrent();
        showAlert("Success", "Activity logs have been archived and cleared.", "success");
        // Refresh logs and archives
        setSelectedMonth('current');
        setPage(1);
        await Promise.all([
          fetchLogs(1, false),
          fetchArchivedMonths()
        ]);
      } catch (err) {
        console.error('Failed to clear logs:', err);
        showAlert("Error", "Failed to clear activity logs. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Title & Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Activity History</h2>
        <div className="flex items-center gap-4">
          {/* Month Selector */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={16} />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="current">Current Logs</option>
              {archivedMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={handleClearLogs}
              className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Log Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
           <div className="col-span-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Activity Details</div>
           <div className="col-span-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time & User</div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 px-8 py-6 items-center">
                <div className="col-span-8 flex items-start gap-5">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <div className="col-span-4 text-right space-y-2">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-3 w-24 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="grid grid-cols-12 px-8 py-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors items-center group">
                  
                  {/* Activity Info */}
                  <div className="col-span-8 flex items-start gap-5">
                    <div className="mt-0.5 shrink-0 transition-transform group-hover:scale-110 duration-300">
                       {getLogIcon(log.type)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.message}</p>
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">Reference ID: {log.refId}</p>
                    </div>
                  </div>

                  {/* Time & User */}
                  <div className="col-span-4 text-right">
                     <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{log.timestamp}</p>
                     <div className="flex items-center justify-end gap-1.5 mt-1 text-slate-400">
                       <User size={12} className="opacity-60" />
                       <p className="text-[11px] italic font-medium">{log.user}</p>
                     </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Clock3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm font-medium">No activity logs found</p>
              </div>
            )}
          </div>
        )}

        {/* Footer / Load More */}
        {!isLoading && hasMore && (
          <button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full py-6 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-t border-slate-50 dark:border-slate-800 text-sm font-bold disabled:opacity-50"
          >
             {isLoadingMore ? (
               <>
                 <Loader2 size={16} className="animate-spin" />
                 Loading...
               </>
             ) : (
               <>
                 Load More Activity
                 <ChevronDown size={16} />
               </>
             )}
          </button>
        )}

      </div>

      {ModalComponent}
    </div>
  );
};

export default HistoryLog;