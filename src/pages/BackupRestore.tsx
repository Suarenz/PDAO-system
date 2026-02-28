import React, { useState, useEffect, useRef } from 'react';
import Skeleton from '../components/Skeleton';
import { 
  Database, 
  UploadCloud, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Cloud, 
  MoreHorizontal,
  Loader2,
  Calendar,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { backupsApi, Backup } from '../api';
import Modal, { useModal } from '../components/Modal';

const BackupRestore: React.FC = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState<Backup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showAlert, showConfirm, ModalComponent, setIsLoading: setModalLoading } = useModal();

  // Fetch backups
  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const response = await backupsApi.getAll();
      setBackups(response.data);
      if (response.data.length > 0) {
        setLastBackup(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      await backupsApi.create("Manual backup created from dashboard");
      showAlert("Backup Success", "Backup completed successfully! A new snapshot has been created.", "success");
      fetchBackups();
    } catch (err: any) {
      console.error('Backup error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Please try again.";
      showAlert("Backup Failed", `Failed to create backup: ${errorMessage}`, "error");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await showConfirm(
      "Restore Database",
      `Are you sure you want to restore from "${file.name}"? This will overwrite all current data!`
    );

    if (confirmed) {
      setIsRestoring(true);
      setModalLoading(true);
      try {
        await backupsApi.restoreFromFile(file);
        showAlert("Restore Success", "Database restored successfully!", "success");
        fetchBackups();
      } catch (err: any) {
        console.error('Restore error:', err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to restore backup.";
        showAlert("Restore Error", errorMessage, "error");
      } finally {
        setIsRestoring(false);
        setModalLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadBackup = async (id: number, filename: string) => {
    try {
      await backupsApi.download(id);
    } catch (err) {
      showAlert("Download Error", "Failed to download backup.", "error");
    }
  };

  const handleRestoreBackup = async (id: number) => {
    const confirmed = await showConfirm(
      "Restore Backup",
      "Are you sure you want to restore this backup? This will overwrite all current data and cannot be undone!"
    );

    if (confirmed) {
      setIsRestoring(true);
      setModalLoading(true);
      try {
        await backupsApi.restoreFromBackup(id);
        showAlert("Restore Success", "Backup restored successfully!", "success");
      } catch (err: any) {
        showAlert("Restore Error", err.response?.data?.message || "Failed to restore backup. Admin privileges required.", "error");
      } finally {
        setIsRestoring(false);
        setModalLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Title (Hidden as per screenshot, it's usually in the Header) */}
      
      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/20 p-8 md:p-12">
        
        {/* Header Section */}
        <div className="flex items-start gap-6 mb-12">
           <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
              <Database size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Backup & Recovery</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
                Ensure your data is safe. We perform automatic backups every 24 hours, but you can trigger a manual backup anytime.
              </p>
           </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          {/* Backup Action Card */}
          <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
             <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Last Successful Backup</p>
             </div>
             
             {isLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-10 w-64" />
                 <Skeleton className="h-4 w-48" />
               </div>
             ) : lastBackup ? (
               <>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{formatDate(lastBackup.created_at)}</h3>
                 <p className="text-xs text-slate-500 font-medium mb-10">Size: {lastBackup.size} • Status: {lastBackup.status}</p>
               </>
             ) : (
               <>
                 <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No backups yet</h3>
                 <p className="text-xs text-slate-500 font-medium mb-10">Create your first backup now</p>
               </>
             )}

             <button 
                onClick={handleBackupNow}
                disabled={isBackingUp}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100"
             >
                {isBackingUp ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Download size={18} />
                )}
                {isBackingUp ? 'Creating Backup...' : 'Backup Now'}
             </button>
          </div>

          {/* Restore Action Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col">
             <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Restore Data</p>
             <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Need to rollback? Upload a valid backup file to restore the entire system to a previous state.
             </p>

             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileUpload}
               accept=".sql,.zip,.gz"
               className="hidden"
             />
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 group cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
             >
                {isRestoring ? (
                  <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
                ) : (
                  <UploadCloud size={32} className="text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                )}
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {isRestoring ? 'Restoring...' : 'Click to upload .sql or .zip'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Max file size: 500MB</p>
             </div>
          </div>

        </div>

        {/* Warning Section */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-6 flex items-start gap-4">
           <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg shrink-0">
              <AlertTriangle size={20} />
           </div>
           <div>
              <p className="text-xs font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest mb-1">Warning about restoration:</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-600 font-medium leading-relaxed">
                Restoring data will overwrite all current entries, logs, and system settings. This action cannot be undone once the process starts. Please ensure you have the latest backup downloaded before proceeding.
              </p>
           </div>
        </div>

      </div>

      {/* Backup History */}
      {backups.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Backup History</h4>
            <button 
              onClick={fetchBackups}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
          
          <div className="space-y-3">
            {backups.slice(0, 5).map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Database size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{backup.file_name}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(backup.created_at)} • {backup.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownloadBackup(backup.id, backup.file_name)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={() => handleRestoreBackup(backup.id)}
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                    title="Restore"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cloud Backup destinations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm p-8">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Cloud Backup Destinations</h4>
          
          <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-blue-600">
                   <Cloud size={20} />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-800 dark:text-white">Google Drive</p>
                   <p className="text-xs text-slate-400 font-medium">Connected to hub-backup@gmail.com</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
                   Active
                </span>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                   <MoreHorizontal size={20} />
                </button>
             </div>
          </div>
      </div>

      {ModalComponent}
    </div>
  );
};

export default BackupRestore;