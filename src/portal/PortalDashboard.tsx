import React from 'react';
import {
  FileText,
  ClipboardCheck,
  Clock,
  Printer,
  CheckCircle2,
  ArrowRight,
  Bell,
  CalendarDays,
  Shield,
  Accessibility,
  HelpCircle,
  AlertCircle,
  CreditCard,
  Lock,
  UserCog,
  History,
  BadgeCheck,
} from 'lucide-react';
import type { ApplicationStatus } from './types';
import { isDigitalIdUnlocked, isAppointmentUnlocked, isApplicationApproved } from './types';

interface PortalDashboardProps {
  applicationStatus?: ApplicationStatus;
  userName: string;
  pwdNumber?: string;
  onNavigate: (view: string) => void;
  notifications?: Array<{ id: string; title: string; message: string; type: string; createdAt: string }>;
}

// ---------- HERO BANNER CONFIG (per spec Section 2) ----------

interface HeroBannerConfig {
  gradient: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionView: string;
  icon: React.ReactNode;
}

const getHeroBanner = (status: ApplicationStatus | undefined, firstName: string): HeroBannerConfig | null => {
  switch (status) {
    case undefined:
    case 'DRAFT':
      return {
        gradient: 'from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-950 dark:to-slate-900',
        title: `Welcome! Please complete your registration.`,
        subtitle: 'Start or continue your PWD ID application to access all portal features.',
        actionLabel: status === 'DRAFT' ? 'Continue Application' : 'Apply for PWD ID',
        actionView: 'portal-application',
        icon: <FileText size={22} />,
      };


    case 'SUBMITTED':
    case 'PENDING_REVIEW':
    case 'UNDER_REVIEW':
      return {
        gradient: 'from-amber-500 via-amber-600 to-orange-600 dark:from-amber-800 dark:via-amber-900 dark:to-slate-900',
        title: 'Application Under Review',
        subtitle: 'Please wait 3–5 working days for verification.',
        actionLabel: 'View Submitted Application',
        actionView: 'portal-application',
        icon: <Clock size={22} />,
      };

    case 'RETURNED':
      return {
        gradient: 'from-red-500 via-red-600 to-red-700 dark:from-red-800 dark:via-red-900 dark:to-slate-900',
        title: 'Action Needed — Application Returned',
        subtitle: 'The admin has requested changes. Please update and resubmit.',
        actionLabel: 'Update Application',
        actionView: 'portal-application',
        icon: <AlertCircle size={22} />,
      };

    case 'APPROVED':
    case 'FOR_PRINTING':
      return {
        gradient: 'from-blue-500 via-blue-600 to-indigo-700 dark:from-blue-900 dark:via-indigo-950 dark:to-slate-900',
        title: 'Application Approved!',
        subtitle: 'Your application is valid. We are currently queuing your physical ID for printing.',
        actionLabel: 'View Digital ID',
        actionView: 'portal-digital-id',
        icon: <CreditCard size={22} />,
      };

    case 'PRINTED':
      return {
        gradient: 'from-green-500 via-green-600 to-emerald-700 dark:from-green-800 dark:via-green-900 dark:to-slate-900',
        title: 'Your ID is Ready for Pickup!',
        subtitle: 'Please schedule your visit to the Municipal Hall.',
        actionLabel: 'Schedule Pickup',
        actionView: 'portal-appointment',
        icon: <CalendarDays size={22} />,
      };

    case 'ISSUED':
      return {
        gradient: 'from-emerald-500 via-teal-600 to-teal-700 dark:from-emerald-800 dark:via-teal-900 dark:to-slate-900',
        title: `Welcome back, ${firstName}!`,
        subtitle: 'Your PWD ID has been issued. Access renewal, lost ID services, and more.',
        actionLabel: 'View Services',
        actionView: 'portal-services',
        icon: <BadgeCheck size={22} />,
      };

    case 'REJECTED':
      return {
        gradient: 'from-red-600 via-red-700 to-red-800 dark:from-red-900 dark:via-red-950 dark:to-slate-900',
        title: 'Application Rejected',
        subtitle: 'Your application has been rejected. Please contact the PDAO office for details.',
        actionLabel: 'View Details',
        actionView: 'portal-application',
        icon: <AlertCircle size={22} />,
      };

    default:
      return null;
  }
};

// ---------- QUICK ACTION ITEMS ----------

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  desc: string;
  view: string;
  color: string;
  locked: boolean;
  lockReason?: string;
}

const getQuickActions = (status?: ApplicationStatus): QuickAction[] => {
  const digitalIdLocked = !isDigitalIdUnlocked(status);
  const appointmentLocked = !isAppointmentUnlocked(status);
  const servicesLocked = !isApplicationApproved(status);

  return [
    {
      icon: <FileText size={22} className="text-blue-600 dark:text-blue-400" />,
      title: 'My Application',
      desc: 'View or continue your application',
      view: 'portal-application',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      locked: false,
    },
    {
      icon: <CreditCard size={22} className={digitalIdLocked ? "text-slate-400 dark:text-slate-600" : "text-blue-600 dark:text-blue-400"} />,
      title: 'My Digital ID',
      desc: digitalIdLocked ? 'Available after approval' : 'View your virtual PWD ID',
      view: 'portal-digital-id',
      color: digitalIdLocked ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/20',
      locked: digitalIdLocked,
      lockReason: 'Available after approval',
    },
    {
      icon: <CalendarDays size={22} className={appointmentLocked ? "text-slate-400 dark:text-slate-600" : "text-green-600 dark:text-green-400"} />,
      title: 'Schedule Pickup',
      desc: appointmentLocked
        ? (isDigitalIdUnlocked(status) ? 'Waiting for card printing' : 'Available after card printing')
        : 'Book an appointment to claim your ID',
      view: 'portal-appointment',
      color: appointmentLocked ? 'bg-slate-100 dark:bg-slate-800' : 'bg-green-50 dark:bg-green-900/20',
      locked: appointmentLocked,
      lockReason: isDigitalIdUnlocked(status) ? 'Waiting for card printing' : 'Available after card printing',
    },
    {
      icon: <HelpCircle size={22} className={servicesLocked ? "text-slate-400 dark:text-slate-600" : "text-emerald-600 dark:text-emerald-400"} />,
      title: 'Services',
      desc: servicesLocked ? 'Available after approval' : 'Lost ID, renewal, and more',
      view: 'portal-services',
      color: servicesLocked ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-50 dark:bg-emerald-900/20',
      locked: servicesLocked,
      lockReason: 'Available after application is approved',
    },
    {
      icon: <History size={22} className="text-purple-600 dark:text-purple-400" />,
      title: 'Application History',
      desc: 'View your application timeline',
      view: 'portal-history',
      color: 'bg-purple-50 dark:bg-purple-900/20',
      locked: !status || status === 'DRAFT',
      lockReason: 'Submit your application first',
    },
    {
      icon: <UserCog size={22} className="text-indigo-600 dark:text-indigo-400" />,
      title: 'My Profile',
      desc: 'Update contact info & accessibility',
      view: 'portal-profile',
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      locked: false,
    },
  ];
};

const PortalDashboard: React.FC<PortalDashboardProps> = ({
  applicationStatus,
  userName,
  pwdNumber,
  onNavigate,
  notifications = [],
}) => {
  const firstName = userName.split(' ')[0];
  const heroBanner = getHeroBanner(applicationStatus, firstName);
  const quickActions = getQuickActions(applicationStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* ============ HERO BANNER (Dynamic per Status) ============ */}
      {heroBanner && (
        <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroBanner.gradient} p-6 md:p-8 text-white shadow-xl`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Accessibility size={28} className="text-white/60" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                Pagsanjan PDAO
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {heroBanner.title}
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              {heroBanner.subtitle}
            </p>
            {pwdNumber && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <Shield size={16} className="text-green-300" />
                <span className="text-sm font-medium">PWD ID: {pwdNumber}</span>
              </div>
            )}
            <div className="mt-5">
              <button
                onClick={() => onNavigate(heroBanner.actionView)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-sm rounded-xl border border-white/20 shadow-lg transition-all duration-200 min-h-[48px]"
              >
                {heroBanner.icon}
                {heroBanner.actionLabel}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ QUICK ACTIONS (status-aware locking) ============ */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.view}
              onClick={() => !action.locked && onNavigate(action.view)}
              disabled={action.locked}
              title={action.locked ? action.lockReason : action.title}
              className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left min-h-[48px] group
                ${action.locked
                  ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              aria-disabled={action.locked}
            >
              <div className={`p-2.5 rounded-xl ${action.color} shrink-0 ${!action.locked ? 'group-hover:scale-105' : ''} transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold ${action.locked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-white'}`}>
                  {action.title}
                </h3>
                <p className={`text-xs mt-0.5 ${action.locked ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                  {action.desc}
                </p>
              </div>
              {action.locked && (
                <div className="absolute top-3 right-3">
                  <Lock size={14} className="text-slate-400 dark:text-slate-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ============ NOTIFICATIONS ============ */}
      {notifications.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              Notifications
            </h2>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                  n.type === 'success' ? 'bg-green-500' :
                  n.type === 'warning' ? 'bg-amber-500' :
                  n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{n.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ HELP BANNER ============ */}
      <section className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 shrink-0">
            <HelpCircle size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Need Help?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visit the PDAO at Pagsanjan, Laguna or call during office hours (8:00 AM – 5:00 PM, Mon–Fri).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PortalDashboard;
