import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  CalendarDays,
  Wrench,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Accessibility,
  History,
  Lock,
} from 'lucide-react';
import type { PortalView, ApplicationStatus } from './types';
import { isDigitalIdUnlocked, isAppointmentUnlocked, isServicesFullAccess, isApplicationApproved } from './types';

interface PortalSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentView: PortalView;
  onNavigate: (view: PortalView) => void;
  onLogout: () => void;
  userName: string;
  applicationStatus?: string;
}

interface NavItem {
  id: PortalView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  disabledReason?: string;
}

const PortalSidebar: React.FC<PortalSidebarProps> = ({
  isOpen,
  setIsOpen,
  currentView,
  onNavigate,
  onLogout,
  userName,
  applicationStatus,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const digitalIdUnlocked = isDigitalIdUnlocked(applicationStatus as ApplicationStatus);
  const appointmentUnlocked = isAppointmentUnlocked(applicationStatus as ApplicationStatus);
  const servicesUnlocked = isServicesFullAccess(applicationStatus as ApplicationStatus);
  const appApproved = isApplicationApproved(applicationStatus as ApplicationStatus);

  const navItems: NavItem[] = [
    {
      id: 'portal-dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: 'portal-application',
      label: 'My Application',
      icon: <FileText size={20} />,
      badge: applicationStatus === 'RETURNED' ? 'Action Needed' : undefined,
    },
    {
      id: 'portal-history',
      label: 'Application History',
      icon: <History size={20} />,
      disabled: applicationStatus === 'DRAFT' || !applicationStatus,
      disabledReason: 'Submit your application first',
    },
    {
      id: 'portal-digital-id',
      label: 'My Digital ID',
      icon: <CreditCard size={20} />,
      disabled: !digitalIdUnlocked,
      disabledReason: 'Available after approval',
    },
    {
      id: 'portal-appointment',
      label: 'Appointment & Pickup',
      icon: <CalendarDays size={20} />,
      disabled: !appointmentUnlocked,
      disabledReason: applicationStatus === 'APPROVED' || applicationStatus === 'FOR_PRINTING'
        ? 'Available after card is printed'
        : 'Available after approval',
    },
    {
      id: 'portal-services',
      label: 'Services',
      icon: <Wrench size={20} />,
      disabled: !appApproved,
      disabledReason: 'Available after application is approved',
    },
    {
      id: 'portal-profile',
      label: 'Profile & Accessibility',
      icon: <UserCog size={20} />,
    },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.disabled) return;
    onNavigate(item.id);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? "w-72" : "w-0 md:w-20"} 
          bg-white dark:bg-slate-950
          border-r border-slate-200 dark:border-slate-900
          overflow-hidden shadow-xl`}
        role="navigation"
        aria-label="Portal Navigation"
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-900 shrink-0">
          {isOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <img src="/pdao-logo2-circular.png" alt="PDAO Logo" className="w-9 h-9 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide truncate">
                  PDAO Portal
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Pagsanjan, Laguna
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors md:block hidden"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 md:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* User Info */}
        {isOpen && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  PWD Member
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-3 px-2 space-y-1"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                disabled={isDisabled}
                title={isDisabled ? item.disabledReason : item.label}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold"
                      : isDisabled
                      ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-white"
                  }
                  min-h-[48px]`}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isDisabled}
              >
                <span
                  className={`shrink-0 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                </span>
                {isOpen && (
                  <>
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {isDisabled && (
                      <span className="ml-auto">
                        <svg
                          className="w-4 h-4 text-slate-300 dark:text-slate-700"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}
                {!isOpen && item.badge && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 pt-2 border-t border-slate-200 dark:border-slate-900 shrink-0">
          {showLogoutConfirm ? (
            <div
              className={`${
                isOpen ? "px-3 py-3" : "px-1 py-2"
              } bg-red-500/10 rounded-xl space-y-2`}
            >
              {isOpen && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Sign out?
                </p>
              )}
              <div className={`flex ${isOpen ? "gap-2" : "flex-col gap-1"}`}>
                <button
                  onClick={onLogout}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors min-h-[44px]"
                >
                  {isOpen ? "Yes, Sign Out" : "✓"}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-colors min-h-[44px]"
                >
                  {isOpen ? "Cancel" : "✕"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-200 min-h-[48px]"
              aria-label="Sign out"
            >
              <LogOut size={20} className="shrink-0" />
              {isOpen && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default PortalSidebar;
