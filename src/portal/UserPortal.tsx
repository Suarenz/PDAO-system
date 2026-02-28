import React, { useState, useEffect } from 'react';
import { Menu, Clock, Bell, Sun, Moon, Accessibility } from 'lucide-react';
import PortalSidebar from './PortalSidebar';
import PortalDashboard from './PortalDashboard';
import MyApplication from './MyApplication';
import MyDigitalId from './MyDigitalId';
import AppointmentPickup from './AppointmentPickup';
import ApplicationHistory from './ApplicationHistory';
import Services from './Services';
import ProfileAccessibility from './ProfileAccessibility';
import { AccessibilityProvider } from './AccessibilityContext';
import NotificationCenter, { NotificationBell } from '../components/NotificationCenter';
import Modal from '../components/Modal';
import { authApi } from '../api/auth';
import type { PortalView, ApplicationStatus, DigitalIdData } from './types';
import { isDigitalIdUnlocked, isAppointmentUnlocked } from './types';

interface UserPortalProps {
  userId?: string | number;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  onLogout: () => void;
  initialStatus?: ApplicationStatus;
  pwdNumber?: string;
}

const PortalHeader: React.FC<{
  toggleSidebar: () => void;
  userName: string;
}> = ({ toggleSidebar, userName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 px-4 md:px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all md:hidden flex items-center justify-center min-h-[44px] min-w-[44px]"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/pdao-logo2-circular.png" alt="PDAO Logo" className="w-8 h-8 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight uppercase tracking-tight">
              PDAO Portal
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.05em] leading-tight">
              municipality of pagsanjan
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl px-4 py-1.5 border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-black text-slate-800 dark:text-white font-mono tracking-tight">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>
        {/* Notification Bell */}
        <NotificationBell onClick={() => setShowNotifications(true)} />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline">
            {userName}
          </span>
        </div>
      </div>
    </header>
    {/* Notification Center Modal */}
    {showNotifications && (
      <NotificationCenter onClose={() => setShowNotifications(false)} />
    )}
    </>
  );
};

const UserPortal: React.FC<UserPortalProps> = ({ userId, userName, userEmail, userPhone, onLogout, initialStatus, pwdNumber }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [currentView, setCurrentView] = useState<PortalView>('portal-dashboard');
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Contact info state (fetched from application data — populated only after approval)
  const [contactData, setContactData] = useState({
    phone: '',
    email: '',
    landline: '',
    guardianContact: '',
  });

  // Return comment from admin when application is returned for changes
  const [returnComment, setReturnComment] = useState<string | undefined>(undefined);

  // Load status from initialStatus or draft
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | undefined>(initialStatus);

  // Sync state with prop updates (e.g. after async auth load completes)
  useEffect(() => {
    if (initialStatus && initialStatus !== applicationStatus) {
      setApplicationStatus(initialStatus);
    }
  }, [initialStatus]);

  // Fetch application data on mount to detect RETURNED status (UNDER_REVIEW + remarks)
  // and to populate return comment for the application form
  useEffect(() => {
    const checkForReturnedStatus = async () => {
      // Only check if status is UNDER_REVIEW (backend uses this for both regular review and return-for-changes)
      if (!applicationStatus || !['UNDER_REVIEW', 'RETURNED'].includes(applicationStatus)) return;
      try {
        const data = await authApi.getApplication();
        if (data) {
          const remarks = data.remarks || data.review_notes || data.return_comment;
          if (remarks) {
            // Backend set UNDER_REVIEW with remarks = admin requested changes
            setReturnComment(remarks);
            setApplicationStatus('RETURNED');
          }
        }
      } catch (error) {
        console.error('Failed to check return status:', error);
      }
    };
    checkForReturnedStatus();
  }, [initialStatus]);

  // Modal states for user feedback
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' as 'confirm' | 'alert' | 'prompt' | 'success' | 'error' | 'warning' | 'info'
  });

  const showFeedback = (title: string, message: string, type: 'confirm' | 'alert' | 'prompt' | 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setFeedbackModal({ isOpen: true, title, message, type });
  };

  // Load draft status from localStorage on mount if no initial status
  useEffect(() => {
    if (applicationStatus) return; // Keep the real status if we have it

    const draftKey = userId ? `pdao_application_draft_${userId}` : 'pdao_application_draft';
    const savedDraft = localStorage.getItem(draftKey);
    // Also check generic key for migration/backup
    const genericDraft = localStorage.getItem('pdao_application_draft');
    
    if ((savedDraft || genericDraft)) {
      setApplicationStatus('DRAFT');
    }
  }, [userId, applicationStatus, initialStatus]);

  const idUnlocked = isDigitalIdUnlocked(applicationStatus);
  const appointmentOk = isAppointmentUnlocked(applicationStatus);

  // Raw ISO expiry date for Services renewal eligibility check
  const [rawExpiryDate, setRawExpiryDate] = useState<string | undefined>(undefined);

  const [demoIdData, setDemoIdData] = useState<DigitalIdData>({
    pwdNumber: 'PWD-0437-2026-00142',
    fullName: userName,
    dateOfBirth: '1990-05-15',
    sex: 'Male',
    address: 'Brgy. Poblacion I, Pagsanjan, Laguna',
    disabilityType: 'Physical Disability (Orthopedic)',
    bloodType: 'O+',
    dateIssued: '2026-01-20',
    expiryDate: '2029-01-20',
    qrCodeData: 'PWD-0437-2026-00142',
  });
  // Fetch real application data (including contact info) when ID is unlocked
  useEffect(() => {
    if (idUnlocked) {
      const fetchAppData = async () => {
        try {
          const data = await authApi.getApplication();
          // Extract contact info from formData
          if (data) {
            const app = data.formData || data;
            setContactData(prev => ({
              phone: app.mobileNo || prev.phone,
              email: app.email || prev.email,
              landline: app.landlineNo || prev.landline,
              guardianContact: app.guardianContactNo || prev.guardianContact,
            }));
          }
          if (data) {
            // Priority: if backend provides a specific formData object, use it. 
            // Otherwise, check if fields are flat in the response (depends on backend implementation).
            const app = data.formData || data; 

            const fullName = [
              app.lastName ? app.lastName + ',' : '',
              app.firstName,
              app.middleName,
              app.suffix
            ].filter(Boolean).join(' ');

            const address = [
              app.houseNoStreet,
              app.barangay,
              app.city,
              app.province
            ].filter(Boolean).join(', ');

            const mappedData: DigitalIdData = {
              pwdNumber: app.pwdNumber || app.pwd_number || data.pwdNumber || data.pwd_number || pwdNumber || 'PENDING',
              fullName: fullName || userName,
              dateOfBirth: app.dob || app.dateOfBirth || app.birth_date || 'N/A', 
              sex: app.sex || app.gender || 'N/A',
              address: address || 'N/A',
              disabilityType: app.disabilityType || app.disability_type || 'N/A',
              bloodType: app.bloodType || app.blood_type || 'N/A',
              photo: app.photo || data.photo, 
              dateIssued: (data.dateApproved || data.date_approved) ? new Date(data.dateApproved || data.date_approved).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              expiryDate: (data.expiryDate || data.expiry_date) ? new Date(data.expiryDate || data.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              qrCodeData: app.pwdNumber || app.pwd_number || data.pwdNumber || data.pwd_number || 'PENDING',
              // Guardian resolution: Guardian → Spouse → Father → Mother
              guardian: (() => {
                const guardianName = [app.guardianFName, app.guardianMName, app.guardianLName].filter(Boolean).join(' ');
                if (guardianName.trim()) return guardianName;
                const spouseName = app.spouseName;
                if (spouseName && spouseName.trim()) return spouseName;
                const fatherName = [app.fatherFName, app.fatherMName, app.fatherLName].filter(Boolean).join(' ');
                if (fatherName.trim()) return fatherName;
                const motherName = [app.motherFName, app.motherMName, app.motherLName].filter(Boolean).join(' ');
                if (motherName.trim()) return motherName;
                return '';
              })(),
              contactNo: app.guardianContactNo || app.mobileNo || '',
            };
            setDemoIdData(mappedData);

            // Store the raw ISO expiry date for renewal eligibility
            const rawExpiry = data.expiry_date || data.expiryDate;
            if (rawExpiry) {
              setRawExpiryDate(rawExpiry);
            } else {
              // Fallback: 5 years from now as ISO string
              const fallback = new Date();
              fallback.setFullYear(fallback.getFullYear() + 5);
              setRawExpiryDate(fallback.toISOString().split('T')[0]);
            }
          }
        } catch (error) {
          console.error('Failed to load application data for ID:', error);
        }
      };
      
      fetchAppData();
    }
  }, [idUnlocked, pwdNumber]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view as PortalView);
    if (view === 'portal-history' && applicationStatus && applicationStatus !== 'DRAFT') {
      fetchHistory();
    }
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await authApi.getApplication();
      if (data && data.history) {
        setHistoryEvents(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'portal-dashboard':
        return (
          <PortalDashboard
            applicationStatus={applicationStatus}
            userName={userName}
            pwdNumber={idUnlocked ? pwdNumber : undefined}
            onNavigate={handleNavigate}
          />
        );

      case 'portal-application':
        return (
          <MyApplication
            userId={userId}
            applicationStatus={applicationStatus}
            returnComment={returnComment}
            returnedFields={[]}
            onSaveDraft={(data) => {
              setApplicationStatus('DRAFT');
              console.log('Draft saved:', data);
            }}
            onSubmit={(data) => {
              setApplicationStatus('SUBMITTED');
              setReturnComment(undefined);
              console.log('Application submitted:', data);
            }}
            onStatusChange={(status) => {
              setApplicationStatus(status);
              if (status === 'SUBMITTED') setReturnComment(undefined);
            }}
          />
        );

      case 'portal-digital-id':
        return (
          <MyDigitalId
            applicationStatus={applicationStatus}
            isApproved={idUnlocked}
            idData={idUnlocked ? demoIdData : undefined}
          />
        );

      case 'portal-history':
        return (
          <ApplicationHistory
            applicationStatus={applicationStatus}
            userName={userName}
            timelineEvents={historyEvents}
          />
        );

      case 'portal-appointment':
        return (
          <AppointmentPickup
            applicationStatus={applicationStatus}
            userName={userName}
            pwdNumber={demoIdData.pwdNumber}
            userPhone={contactData.phone}
            onBookAppointment={(date, time) => console.log('Booked:', date, time)}
            onCancelAppointment={(id) => console.log('Cancelled:', id)}
          />
        );

      case 'portal-services':
        return (
          <Services
            idExpiryDate={idUnlocked ? rawExpiryDate : undefined}
            onSubmitRequest={(type, notes, file) => console.log('Service request:', type, notes, file?.name)}
          />
        );

      case 'portal-profile':
        return (
          <ProfileAccessibility
            userName={userName}
            userEmail={contactData.email}
            userPhone={contactData.phone}
            applicationStatus={applicationStatus}
            majorDetails={idUnlocked ? {
              fullName: demoIdData.fullName,
              dateOfBirth: demoIdData.dateOfBirth,
              sex: demoIdData.sex,
              civilStatus: 'Single',
              bloodType: demoIdData.bloodType,
              disabilityType: demoIdData.disabilityType,
              address: demoIdData.address,
            } : undefined}
            onChangePassword={async (cur, nw, conf) => {
              try {
                await authApi.changePassword(cur, nw, conf);
                showFeedback('Password Changed', 'Your password has been updated successfully.', 'success');
              } catch (err: any) {
                const message = err.response?.data?.message || 'Failed to change password. Please verify your current password.';
                showFeedback('Error Updating Password', message, 'error');
                throw err;
              }
            }}
            userLandline={contactData.landline}
            guardianContactNo={contactData.guardianContact}
            onUpdateContact={async (ph, em, ln, gc) => {
              try {
                await authApi.updateContact(ph, em, ln, gc);
                setContactData({ phone: ph, email: em, landline: ln, guardianContact: gc });
                showFeedback('Contact Updated', 'Your contact information has been saved successfully.', 'success');
              } catch (err: any) {
                const message = err.response?.data?.message || 'Failed to update contact information.';
                showFeedback('Update Failed', message, 'error');
                throw err;
              }
            }}
          />
        );

      default:
        return <PortalDashboard applicationStatus={applicationStatus} userName={userName} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <PortalSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        userName={userName}
        applicationStatus={applicationStatus}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          userName={userName}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      <Modal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        showCancel={false}
      />
    </div>
  );
};

// Wrapped with AccessibilityProvider
const UserPortalWithAccessibility: React.FC<UserPortalProps> = (props) => (
  <AccessibilityProvider>
    <UserPortal {...props} />
  </AccessibilityProvider>
);

export default UserPortalWithAccessibility;
