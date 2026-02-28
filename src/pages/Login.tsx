import React, { useState } from 'react';
import { 
  ArrowRight,
  IdCard,
  Lock,
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context';
import Modal, { useModal } from '../components/Modal';
import NewApplicantForm from '../components/NewApplicantForm';

interface LoginProps {
  onLogin: (user: { name: string; role: 'ADMIN' | 'STAFF' | 'PWD MEMBER' | 'ENCODER' | 'USER' | 'MAYOR' }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'apply'>('login');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Registration states
  const [regData, setRegData] = useState({
    fullName: '',
    idNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const { showAlert, ModalComponent } = useModal();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the login function from AuthContext
      await login({ id_number: idNumber, password });
      
      // Get the user from storage to pass back for immediate view routing
      const user = authApi.getStoredUser();
      
      // Fallback if user is null but login succeeded (race condition or token-only response)
      // We can try to fetch me() but simpler to rely on AuthProvider
      if (user) {
         // Validate role before passing
         const validRoles = ['ADMIN', 'STAFF', 'PWD MEMBER', 'ENCODER', 'USER', 'MAYOR'];
         const role = validRoles.includes(user.role) ? user.role : 'USER';

        onLogin({
          name: user.name || 'User',
          role: role as 'ADMIN' | 'STAFF' | 'PWD MEMBER' | 'ENCODER' | 'USER' | 'MAYOR'
        });
      }
    } catch (err: any) {
      let message = err.response?.data?.message || 
                     err.response?.data?.errors?.id_number?.[0];
      
      if (!message) {
        // Fallback to error message from interceptor (e.g., 'Unexpected server response format.')
        if (err.message && err.message !== 'Network Error') {
             message = err.message;
        } else {
             message = 'Login failed. Please check your credentials.';
        }
      }

      // Safety check: specific handling for HTML responses or very long error messages
      if (typeof message === 'string' && (message.trim().startsWith('<') || message.length > 200)) {
        console.error("Raw error response:", message);
        message = "Server Error: The application encountered a critical error. Please contact support.";
      }
                     
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate confirm password
    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    // Split full name into first and last
    const nameParts = regData.fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.pop() : '';
    const firstName = nameParts.join(' ');

    try {
      const { user } = await authApi.register({
        first_name: firstName || regData.fullName,
        last_name: lastName || 'User',
        id_number: regData.idNumber || undefined,
        username: regData.username || undefined,
        password: regData.password,
      });

      // Update context manually after registration to ensure immediate login
      // A better way would be to add register to AuthContext
      window.location.reload(); // Simple way to trigger AuthProvider's checkAuth
      
      showAlert("Registration Successful", "Welcome to PDAO System!", "success");
    } catch (err: any) {
      const message = err.response?.data?.message || 
                     Object.values(err.response?.data?.errors || {}).flat()[0] ||
                     'Registration failed. Please check your data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-4 font-sans overflow-hidden">
      {/* Background Image with Slow Zoom Effect */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center scale-100 transition-transform duration-[30s] ease-linear transform hover:scale-110"
        style={{ backgroundImage: 'url("/pagsanjan-background.jpg")' }}
      />
      
      {/* Dark Overlay Gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/40 to-black/60 backdrop-brightness-75" />

      {/* Glassmorphism Container */}
      <div className={`relative z-20 w-full ${view === 'apply' ? 'max-w-[1100px]' : 'max-w-[400px]'} bg-white/85 backdrop-blur-[15px] rounded-[24px] border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500`}>
        
        <div className={view === 'apply' ? "p-0" : "p-6 sm:p-8"}>
          {view !== 'apply' && (
            <>
              {/* Seals / Logos */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <img 
                  src="/pdao-logo-circular.png" 
                  alt="PDAO Logo" 
                  className="h-[50px] w-auto drop-shadow-md hover:scale-105 transition-transform duration-300" 
                />
                <img 
                  src="/pdao-logo2-circular.png" 
                  alt="PDAO Logo 2" 
                  className="h-[50px] w-auto drop-shadow-md hover:scale-105 transition-transform duration-300" 
                />
              </div>

              {/* Branding Hierarchy */}
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl sm:text-2xl text-slate-900 leading-tight">
                  Municipality of Pagsanjan
                </h2>
                <p className="font-sans text-[9px] sm:text-[10px] uppercase tracking-[1.2px] font-bold text-slate-600 mt-1.5 opacity-80">
                  Pagsanjan Disability Data Management System
                </p>
              </div>
            </>
          )}

          {view === 'login' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight border-b-2 border-slate-800/10 pb-1 inline-block">Sign In</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5 w-4 h-4" />
                  <p className="text-[11px] font-medium text-rose-700 leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* ID Number Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">ID Number or Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-blue-700 transition-colors duration-200">
                      <IdCard size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full bg-white border border-[#E0E0E0] pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/5 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="Enter ID number or username"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 group-focus-within:text-blue-700 transition-colors duration-200">
                      <Lock size={16} />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-[#E0E0E0] pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-700/5 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="pt-1.5">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#1e293b] hover:bg-[#334155] disabled:bg-slate-400 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                    ) : (
                      <>Login <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : view === 'register' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight border-b-2 border-slate-800/10 pb-1 inline-block">Create Account</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5 w-4 h-4" />
                  <p className="text-[11px] font-medium text-rose-700 leading-snug">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={regData.fullName}
                    onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                    className="w-full bg-white border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 transition-all duration-200"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">Username</label>
                    <input 
                      type="text" 
                      value={regData.username}
                      onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                      className="w-full bg-white border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 transition-all duration-200"
                      placeholder="jdelacruz"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">PWD ID Number (Optional)</label>
                    <input 
                      type="text" 
                      value={regData.idNumber}
                      onChange={(e) => setRegData({ ...regData, idNumber: e.target.value })}
                      className="w-full bg-white border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 transition-all duration-200"
                      placeholder="RR-PPMM-BBB-NNNNNNN"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">Password</label>
                  <input 
                    type="password" 
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="w-full bg-white border border-[#E0E0E0] px-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#555555] uppercase tracking-wider ml-1">Confirm Password</label>
                  <input 
                    type="password" 
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className={`w-full bg-white border px-4 py-2.5 text-sm font-medium text-slate-800 rounded-xl focus:outline-none focus:border-blue-700 transition-all duration-200 ${regData.confirmPassword && regData.password !== regData.confirmPassword ? 'border-rose-400' : 'border-[#E0E0E0]'}`}
                    placeholder="••••••••"
                    required
                  />
                  {regData.confirmPassword && regData.password !== regData.confirmPassword && (
                    <p className="text-[10px] text-rose-600 font-medium ml-1">Passwords do not match</p>
                  )}
                </div>

                <div className="pt-1.5">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#1e293b] hover:bg-[#334155] disabled:bg-slate-400 text-white rounded-xl py-3 font-bold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Register Account</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <NewApplicantForm onCancel={() => setView('login')} isUserRegistration={true} />
            </div>
          )}

          {/* Toggle View Link */}
          {view !== 'apply' && (
            <div className="mt-8 pt-4 border-t border-slate-200/60 text-center flex flex-col gap-3">
              <button 
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                {view === 'login' ? "New here? Create an account." : "Already have an account? Sign in."}
              </button>
            </div>
          )}
        </div>
      </div>

      {ModalComponent}
    </div>
  );
};

export default Login;