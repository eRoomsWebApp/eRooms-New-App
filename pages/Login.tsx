import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ChevronRight, Building2, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithGoogle, user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<UserRole | null>(null);

  useEffect(() => {
    if (isAuthReady && user) {
      if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) navigate('/admin/dashboard');
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-slate-50 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 w-full max-w-md p-8 md:p-12 rounded-[40px] shadow-xl relative overflow-hidden text-center"
      >
        <div className="mb-8">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto mb-6 shadow-lg">
            e
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Partner Portal</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">eRooms.in Property Management</p>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4">
            Hostel &amp; PG owners can sign in with Google to manage their property listings. Students can browse and enquire directly without logging in.
          </p>

          <button
            onClick={() => handleGoogleLogin(UserRole.Owner)}
            disabled={!!loading}
            className={`w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-black text-base shadow-lg hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group ${
              loading === UserRole.Owner ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Building2 size={20} className="text-blue-400" />
            {loading === UserRole.Owner ? 'Signing in...' : 'Continue as Property Owner'}
            <ChevronRight className="group-hover:translate-x-1 transition-transform ml-auto" />
          </button>

          <Link
            to="/"
            className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Hostel Catalogue
          </Link>

          <div className="pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Secured by Google Authentication</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
