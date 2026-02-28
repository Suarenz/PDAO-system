import React, { useState, useEffect } from 'react';
import Skeleton from './components/Skeleton';
import { LayoutDashboard } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NewApplicantForm from './components/NewApplicantForm';
import Dashboard from './pages/Dashboard';
import AddPwd from './pages/AddPwd';
import ListPwd from './pages/ListPwd';
import ApprovalQueue from './pages/ApprovalQueue';
import Accounts from './pages/Accounts';
import HistoryLog from './pages/HistoryLog';
import BackupRestore from './pages/BackupRestore';
import Reports from './pages/Reports';
import AppointmentManagement from './pages/AppointmentManagement';
import ServiceRequestManagement from './pages/ServiceRequestManagement';
import IdLayoutEditor from './pages/IdLayoutEditor';
import MayorDashboard from './pages/MayorDashboard';
import Login from './pages/Login';
import { authApi } from './api';
import { useAuth } from './context';
import UserPortal from './portal/UserPortal';

export interface UserProfile {
  name: string;
  role: 'ADMIN' | 'STAFF' | 'PWD MEMBER' | 'ENCODER' | 'USER' | 'MAYOR';
}

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set initial view based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ENCODER') {
        setCurrentView('add-pwd');
      } else if (user.role === 'USER') {
        setCurrentView('register-pwd');
      } else if (user.role === 'PWD MEMBER') {
        setCurrentView('my-profile');
      } else if (user.role === 'MAYOR') {
        setCurrentView('mayor-dashboard');
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [isAuthenticated, user?.role]);

  const handleLogin = (userProfile: UserProfile) => {
    // Redirection is now handled by the useEffect above when the auth context updates
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('dashboard');
  };

  // Check if current user can access the requested view
  const canAccessView = (view: string, userRole?: string): boolean => {
    // USER role can access 'register-pwd' and 'add-pwd' (account management)
    if (userRole === 'USER') {
      return view === 'register-pwd' || view === 'add-pwd';
    }
    // ENCODER can only access 'add-pwd'
    if (userRole === 'ENCODER') {
      return view === 'add-pwd';
    }
    // PWD MEMBER can only access 'my-profile'
    if (userRole === 'PWD MEMBER') {
      return view === 'my-profile';
    }
    // MAYOR can access executive dashboard and reports
    if (userRole === 'MAYOR') {
      return ['mayor-dashboard', 'reports'].includes(view);
    }
    // ADMIN and STAFF can access most views
    return true;
  };

  // Protected navigation handler
  const handleNavigate = (view: string) => {
    if (canAccessView(view, user?.role)) {
      setCurrentView(view);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'mayor-dashboard':
        return <MayorDashboard />;
      case 'register-pwd':
        return <NewApplicantForm onCancel={() => setCurrentView('add-pwd')} isUserRegistration={true} />;
      case 'add-pwd':
        return <AddPwd userRole={user?.role} />;
      case 'list-pwd':
        return <ListPwd onModalStateChange={setIsModalOpen} />;
      case 'approval-queue':
        return <ApprovalQueue onModalStateChange={setIsModalOpen} />;
      case 'account':
        return <Accounts />;
      case 'history':
        return <HistoryLog />;
      case 'backup':
        return <BackupRestore />;
      case 'reports':
        return <Reports />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'service-requests':
        return <ServiceRequestManagement />;
      case 'id-layout-editor':
        return <IdLayoutEditor />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-slate-500">
            <div className="p-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-800 text-center max-w-sm shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LayoutDashboard className="text-blue-600 dark:text-blue-400" size={36} />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white tracking-tight">Under Construction</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">The <span className="font-bold text-blue-600">{currentView}</span> feature is currently being developed to better serve our PWD community.</p>
            </div>
          </div>
        );
    }
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#020617] font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">PDAO System</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Verifying credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // USER and PWD MEMBER roles get the dedicated User Portal
  if (user?.role === 'USER' || user?.role === 'PWD MEMBER') {
    return (
      <UserPortal
        userId={user.id}
        userName={user.name || 'User'}
        onLogout={handleLogout}
        initialStatus={user.application_status as any}
        pwdNumber={user.pwd_number || undefined}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617] font-sans transition-colors duration-300">
      <div className="print:hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setSidebarOpen} 
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userRole={user?.role || 'STAFF'}
        />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out`}>
        <div className="print:hidden">
          <Header 
            toggleSidebar={toggleSidebar} 
            userName={user?.name || 'User'} 
            userRole={user?.role || 'Staff'}
            hideSearch={user?.role === 'USER'}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth print:p-0 print:overflow-visible">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 print:max-w-none print:m-0">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;