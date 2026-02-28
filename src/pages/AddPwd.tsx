import React, { useState, useEffect } from 'react';
import { UserPlus, CreditCard, ChevronRight, Clock, MapPin } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import NewApplicantForm from '../components/NewApplicantForm';
import ExistingPwdForm from '../components/ExistingPwdForm';
import { dashboardApi, RecentPwd } from '../api/dashboard';

interface AddPwdProps {
  userRole?: string;
}

const AddPwd: React.FC<AddPwdProps> = ({ userRole }) => {
  const [view, setView] = useState<'selection' | 'new-form' | 'existing-form'>(
    userRole === 'ENCODER' || userRole === 'USER' ? 'existing-form' : 'selection'
  );
  const [recentRecords, setRecentRecords] = useState<RecentPwd[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent records that were added within the last 24 hours
  useEffect(() => {
    const fetchRecentRecords = async () => {
      setIsLoading(true);
      try {
        const records = await dashboardApi.getRecentActivity(20);
        
        // Filter records added within the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const todayRecords = records.filter(record => {
          const recordDate = new Date(record.date_added);
          return recordDate >= oneDayAgo;
        });
        
        setRecentRecords(todayRecords);
      } catch (error) {
        console.error('Failed to fetch recent records:', error);
        setRecentRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentRecords();
  }, []);

  // Helper to format date as relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (view === 'new-form') {
      return <NewApplicantForm onCancel={() => setView('selection')} />;
  }

  if (view === 'existing-form') {
     return <ExistingPwdForm onCancel={() => (userRole === 'ENCODER' || userRole === 'USER') ? null : setView('selection')} isUserAccount={userRole === 'USER'} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Add PWD Record</h2>
        <p className="text-slate-500 text-sm mt-1">Select the type of registration you wish to process.</p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* New PWD Card */}
        <button 
          onClick={() => setView('new-form')}
          className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 text-left hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserPlus size={32} strokeWidth={1.5} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
               <ChevronRight size={20} className="text-slate-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            New PWD Applicant
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
            Create a record for a new applicant who does not yet have a PWD Identification Number.
          </p>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Start Registration <ChevronRight size={14} />
          </span>

           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
        </button>

        {/* Existing PWD Card */}
        <button 
            onClick={() => setView('existing-form')}
            className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 text-left hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-400"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <CreditCard size={32} strokeWidth={1.5} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
               <ChevronRight size={20} className="text-slate-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Existing PWD Record
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
            Encode a record for an applicant who already possesses a valid PWD Identification Number.
          </p>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Encode Existing <ChevronRight size={14} />
          </span>

           {/* Decorative Circle */}
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
        </button>
      </div>

      {/* Recently Added Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
             <Clock size={18} className="text-slate-400" />
             <h3 className="font-semibold text-slate-800 dark:text-white text-sm uppercase tracking-wide">Recently Added Records</h3>
             <span className="text-xs text-slate-400 ml-2">(Last 24 hours)</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : recentRecords.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Barangay</th>
                  <th className="px-6 py-4 font-semibold">Disability Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.pwd_number || 'New Applicant'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm">
                          <MapPin size={14} className="text-slate-400" />
                          {item.barangay || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {item.disability_type || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status === 'ACTIVE' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                          : item.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      {formatRelativeTime(item.date_added)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No records added in the last 24 hours</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">New records will appear here when added</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AddPwd;