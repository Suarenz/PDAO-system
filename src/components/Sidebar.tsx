import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Settings, 
  History, 
  FileText, 
  Database,
  ChevronRight,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  X,
  CalendarDays,
  ClipboardList,
  CreditCard
} from 'lucide-react';
import { approvalApi } from '../api/approvals';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userRole: 'ADMIN' | 'STAFF' | 'PWD MEMBER' | 'ENCODER' | 'USER' | 'MAYOR';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, onNavigate, onLogout, userRole }) => {
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (userRole === 'ADMIN') {
      const fetchStats = async () => {
        try {
          const stats = await approvalApi.getStats();
          setPendingCount(stats.pending);
        } catch (error) {
          console.error("Failed to fetch approval stats:", error);
        }
      };

      fetchStats();
      const interval = setInterval(fetchStats, 2 * 60 * 1000); // Refresh every 2 minutes
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const allMenuItems = [
    { id: 'mayor-dashboard', name: 'Executive Dashboard', icon: LayoutDashboard, roles: ['MAYOR'] },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
    { id: 'register-pwd', name: 'Register New PWD', icon: UserPlus, roles: ['USER'] },
    { id: 'add-pwd', name: userRole === 'ENCODER' ? 'Encode Record' : userRole === 'USER' ? 'Account Management' : 'Add PWD', icon: userRole === 'USER' ? Settings : UserPlus, roles: ['ADMIN', 'STAFF', 'ENCODER', 'USER'] },
    { id: 'list-pwd', name: 'PWD Masterlist', icon: Users, roles: ['ADMIN', 'STAFF'] },
    { id: 'approval-queue', name: 'Registration Approval', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : undefined, roles: ['ADMIN'] },
    { id: 'account', name: 'User Management', icon: Settings, roles: ['ADMIN'] },
    { id: 'history', name: 'System Logs', icon: History, roles: ['ADMIN'] },
    { id: 'appointments', name: 'Appointments', icon: CalendarDays, roles: ['ADMIN', 'STAFF'] },
    { id: 'service-requests', name: 'Service Requests', icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
    { id: 'reports', name: 'Reports', icon: FileText, roles: ['ADMIN', 'STAFF', 'MAYOR'] },
    { id: 'id-layout-editor', name: 'ID Card Layout', icon: CreditCard, roles: ['ADMIN'] },
    { id: 'backup', name: 'Backup & Restore', icon: Database, roles: ['ADMIN'] },
    { id: 'my-profile', name: 'My Profile', icon: Users, roles: ['PWD MEMBER'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative top-0 left-0 h-screen z-50 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 
          transition-all duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
          ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0 overflow-hidden'}
        `}
      >
        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-8">
          <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
            {userRole === 'ENCODER' ? 'Data Entry' : 'Main Menu'}
          </p>
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-300/30 dark:shadow-slate-700/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon size={18} className={isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'} />
                  <span className="flex-1 whitespace-nowrap">{item.name}</span>
                  {item.badge && !isActive && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                  {!isActive && !item.badge && <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-900 p-3 relative min-h-[120px] flex flex-col justify-end">
          
          {/* Confirmation Indicator UI */}
          {isConfirmingLogout ? (
            <div className="absolute inset-0 bg-white dark:bg-slate-950 z-20 p-3 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-3">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Confirm Logout?</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    try {
                      setIsLoggingOut(true);
                      await onLogout();
                      setIsConfirmingLogout(false);
                    } catch (error) {
                      console.error('Logout error:', error);
                      setIsConfirmingLogout(false);
                    } finally {
                      setIsLoggingOut(false);
                    }
                  }}
                  disabled={isLoggingOut}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:cursor-not-allowed"
                >
                  <LogOut size={12} />
                  {isLoggingOut ? 'Logging out...' : 'Yes'}
                </button>
                <button 
                  onClick={() => setIsConfirmingLogout(false)}
                  disabled={isLoggingOut}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 rounded-xl text-xs font-bold active:scale-95 transition-all disabled:cursor-not-allowed"
                >
                  <X size={12} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmingLogout(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all group outline-none"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          )}

          <div className="flex justify-center mt-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="py-1 text-slate-300 hover:text-slate-400 transition-colors hidden md:block"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;