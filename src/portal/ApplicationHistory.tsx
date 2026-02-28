import React from 'react';
import {
  History,
  FileText,
  Clock,
  CheckCircle2,
  Printer,
  BadgeCheck,
  AlertCircle,
  Send,
  Download,
  Eye,
  XCircle,
} from 'lucide-react';
import type { ApplicationStatus, ApplicationTimelineEvent } from './types';

interface ApplicationHistoryProps {
  applicationStatus?: ApplicationStatus;
  userName?: string;
  /** Timeline events from the API — if not provided, generated from status */
  timelineEvents?: ApplicationTimelineEvent[];
}

/** Default timeline events generated from the current status */
function generateTimelineFromStatus(status?: ApplicationStatus): ApplicationTimelineEvent[] {
  if (!status) return [];

  const events: ApplicationTimelineEvent[] = [];
  const now = new Date();

  // Build a progressive timeline based on the furthest status reached
  const statusOrder: ApplicationStatus[] = [
    'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW',
    'APPROVED', 'PRINTED', 'ISSUED',
  ];

  // Special statuses
  if (status === 'RETURNED') {
    events.push(
      { status: 'SUBMITTED', label: 'Application Submitted', date: '', description: 'Your application was submitted for review.' },
      { status: 'RETURNED', label: 'Returned for Changes', date: '', description: 'The admin has requested changes to your application.' },
    );
    return events;
  }

  if (status === 'REJECTED') {
    events.push(
      { status: 'SUBMITTED', label: 'Application Submitted', date: '', description: 'Your application was submitted for review.' },
      { status: 'REJECTED', label: 'Application Rejected', date: '', description: 'Your application was not approved. Contact the PDAO office for details.' },
    );
    return events;
  }

  const labels: Partial<Record<ApplicationStatus, { label: string; desc: string }>> = {
    DRAFT: { label: 'Application Started', desc: 'You began filling out your PWD ID application.' },
    SUBMITTED: { label: 'Application Submitted', desc: 'Your application was submitted for review.' },
    PENDING_REVIEW: { label: 'Pending Review', desc: 'Your application entered the review queue.' },
    UNDER_REVIEW: { label: 'Under Review', desc: 'An officer is reviewing your documents.' },
    FOR_PRINTING: { label: 'Queued for Printing', desc: 'Your ID card has been queued for printing.' },
    APPROVED: { label: 'Application Approved', desc: 'Your application has been verified and approved.' },
    PRINTED: { label: 'ID Card Printed', desc: 'Your physical PWD ID card has been printed.' },
    ISSUED: { label: 'ID Card Issued', desc: 'You have claimed your physical PWD ID card.' },
  };

  const idx = statusOrder.indexOf(status);
  if (idx === -1 && status === 'FOR_PRINTING') {
    // FOR_PRINTING goes between APPROVED and PRINTED
    for (const s of ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'FOR_PRINTING'] as ApplicationStatus[]) {
      const info = labels[s];
      if (info) events.push({ status: s, label: info.label, date: '', description: info.desc });
    }
  } else {
    for (let i = 0; i <= Math.max(idx, 0); i++) {
      const s = statusOrder[i];
      const info = labels[s];
      if (info) events.push({ status: s, label: info.label, date: '', description: info.desc });
    }
  }

  return events;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  DRAFT: <FileText size={16} />,
  SUBMITTED: <Send size={16} />,
  PENDING_REVIEW: <Clock size={16} />,
  UNDER_REVIEW: <Eye size={16} />,
  FOR_PRINTING: <Printer size={16} />,
  APPROVED: <CheckCircle2 size={16} />,
  PRINTED: <Printer size={16} />,
  ISSUED: <BadgeCheck size={16} />,
  RETURNED: <AlertCircle size={16} />,
  REJECTED: <XCircle size={16} />,
};

const COLOR_MAP: Record<string, string> = {
  DRAFT: 'bg-slate-500',
  SUBMITTED: 'bg-blue-500',
  PENDING_REVIEW: 'bg-amber-500',
  UNDER_REVIEW: 'bg-amber-500',
  FOR_PRINTING: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  PRINTED: 'bg-green-600',
  ISSUED: 'bg-emerald-600',
  RETURNED: 'bg-red-500',
  REJECTED: 'bg-red-600',
};

const ApplicationHistory: React.FC<ApplicationHistoryProps> = ({
  applicationStatus,
  userName,
  timelineEvents,
}) => {
  const events = timelineEvents?.length
    ? timelineEvents
    : generateTimelineFromStatus(applicationStatus);

  if (!applicationStatus || applicationStatus === 'DRAFT') {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <History size={36} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No History Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your application history will appear here once you submit your application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <History size={24} className="text-purple-600" />
            Application History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track every step of your PWD ID application
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-6">
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              const dotColor = COLOR_MAP[event.status] || 'bg-slate-400';
              const icon = ICON_MAP[event.status] || <Clock size={16} />;

              return (
                <div key={`${event.status}-${index}`} className="relative flex items-start gap-4">
                  {/* Dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-full ${dotColor} flex items-center justify-center text-white shadow-md shrink-0 ${isLast ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''}`}
                    style={isLast ? { ringColor: dotColor.replace('bg-', '').replace('500', '200') } : undefined}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-2 ${isLast ? '' : 'border-b border-slate-100 dark:border-slate-700/50'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isLast ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {event.label}
                      </h4>
                      {event.date && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                          {event.date}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHistory;
