
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ChevronRight, User, Building2 } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithGoogle, user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<UserRole | null>(null);

  useEffect(() => {
    if (isAuthReady && user) {
      if (user.role === UserRole.Admin) navigate('/admin/dashboard');
      else if (user.role === UserRole.Owner) navigate('/owner/dashboard');
      else navigate('/student/dashboard');
    }
  }, [user, isAuthReady, navigate]);

  const handleGoogleLogin = async (role: UserRole) => {
    setLoading(role);
    await signInWithGoogle(role);
    setLoading(null);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 bg-neutral-50/50 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 w-full max-w-md p-8 md:p-12 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden text-center"
      >
        <div className="mb-10">
          <div className="bg-slate-900 text-white w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-4xl mx-auto mb-8 shadow-2xl rotate-3">e</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Portal Access</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            Identity Verification
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
            Choose your role to continue with Google.
          </p>

          <button 
            onClick={() => handleGoogleLogin(UserRole.Student)}
            disabled={!!loading}
            className={`w-full bg-white border-2 border-slate-100 hover:border-indigo-600 text-slate-900 py-5 rounded-[32px] font-black text-lg shadow-sm hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 group ${loading === UserRole.Student ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <User size={20} className="text-indigo-600" />
            {loading === UserRole.Student ? 'Verifying...' : 'I am a Student'}
            <ChevronRight className="group-hover:translate-x-1 transition-transform ml-auto" />
          </button>

          <button 
            onClick={() => handleGoogleLogin(UserRole.Owner)}
            disabled={!!loading}
            className={`w-full bg-slate-900 text-white py-5 rounded-[32px] font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group ${loading === UserRole.Owner ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Building2 size={20} className="text-indigo-400" />
            {loading === UserRole.Owner ? 'Verifying...' : 'I am an Owner'}
            <ChevronRight className="group-hover:translate-x-1 transition-transform ml-auto" />
          </button>

          <div className="pt-8 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Secured by Firebase Identity
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

