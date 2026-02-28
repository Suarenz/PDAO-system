import React, { useState, useEffect } from 'react';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import NotificationCenter, { NotificationBell } from './NotificationCenter';

interface HeaderProps {
  toggleSidebar: () => void;
  userName: string;
  userRole: string;
  hideSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, userName, userRole, hideSearch = false }) => {
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAdmin = userRole.toUpperCase() === 'ADMIN';

  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));
  }, []);

  // Real-time clock for admin
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <header className="h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all flex-shrink-0"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
             <img src="/pdao-logo2-circular.png" alt="PDAO Logo" className="w-8 h-8 hidden sm:block flex-shrink-0" />
             <div className="flex flex-col min-w-0">
                <h1 className="text-[10px] md:text-[13px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight uppercase truncate">
                 Person with Disability Affairs Office
                </h1>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.05em] leading-tight truncate">
                 municipality of pagsanjan
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden lg:flex flex-col items-center bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl px-5 py-2 border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">{formatTime(currentTime).split(' ')[1]}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono tracking-tight">
                        {formatTime(currentTime).split(' ')[0]}
                    </span>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {formatDate(currentTime)}
                    </span>
                </div>
            </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all"
            >
               {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Notification Bell - shown for all roles */}
            <NotificationBell onClick={() => setShowNotifications(true)} />
          </div>
          
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-900 ml-1">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[150px]">{userName}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{userRole}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Center Modal - shown for all roles */}
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
};

export default Header;