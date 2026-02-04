
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User as UserIcon, ShieldCheck, Mail, Phone, Lock, ChevronRight, ArrowLeft, Key } from 'lucide-react';

const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: ''
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (view === 'login') {
      const success = await login(formData.email, formData.password, role);
      if (success) {
        if (role === UserRole.Admin) navigate('/admin/dashboard');
        else if (role === UserRole.Owner) navigate('/owner/dashboard');
        else navigate('/');
      } else {
        setStatus({ type: 'error', message: 'Invalid credentials for selected role.' });
      }
    } else if (view === 'signup') {
      const success = await signup({ 
        username: formData.username, 
        email: formData.email, 
        password: formData.password, 
        role 
      });
      if (success) {
        if (role === UserRole.Owner) navigate('/owner/dashboard');
        else navigate('/');
      } else {
        setStatus({ type: 'error', message: 'User with this email already exists.' });
      }
    } else if (view === 'forgot') {
      setStatus({ type: 'success', message: 'Recovery link transmitted to your secure inbox.' });
      setTimeout(() => setView('login'), 3000);
    }
  };

  const roleConfigs = {
    [UserRole.Student]: { label: 'Student', icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    [UserRole.Owner]: { label: 'Property Owner', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    [UserRole.Admin]: { label: 'Super Admin', icon: Key, color: 'text-slate-900', bg: 'bg-slate-100' },
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 bg-neutral-50/50 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 w-full max-w-xl p-8 md:p-12 rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <div className="bg-slate-900 text-white w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-4xl mx-auto mb-8 shadow-2xl rotate-3">e</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Portal Access</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            {view === 'forgot' ? 'Security Recovery' : view === 'signup' ? 'Create New Account' : 'Gateway Verification'}
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1.5 bg-slate-50 rounded-[28px] mb-10 border border-slate-100">
          {(Object.keys(roleConfigs) as UserRole[]).map((r) => {
            const Config = roleConfigs[r];
            const isActive = role === r;
            return (
              <button 
                key={r}
                onClick={() => { setRole(r); setView('login'); }}
                className={`flex-1 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isActive ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Config.icon size={14} />
                {Config.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAction} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${role}-${view}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              {view === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" className="w-full pl-14 pr-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all font-bold text-slate-900" placeholder="Your Name" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">
                  {role === UserRole.Admin ? 'Staff Identifier' : 'Registered Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type={role === UserRole.Admin ? "text" : "email"} className="w-full pl-14 pr-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all font-bold text-slate-900" placeholder={role === UserRole.Admin ? "admin" : "email@example.com"} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              {view !== 'forgot' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Security Key</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="password" className="w-full pl-14 pr-6 py-5 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-50 outline-none transition-all font-bold text-slate-900" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {status && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center border ${
                status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
              }`}
            >
              {status.message}
            </motion.div>
          )}

          <button 
            type="submit"
            className={`w-full text-white py-6 rounded-[32px] font-black text-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group bg-slate-900 hover:bg-slate-800`}
          >
            {view === 'forgot' ? 'Reset Security' : view === 'signup' ? 'Create Account' : 'Verify Entry'}
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
           {role !== UserRole.Admin && view === 'login' && (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 italic">No account yet?</span>
               <button onClick={() => setView('signup')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Register Now</button>
             </div>
           )}

           {role !== UserRole.Admin && view === 'signup' && (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400 italic">Already a member?</span>
               <button onClick={() => setView('login')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Sign In</button>
             </div>
           )}

           {view === 'login' && role !== UserRole.Admin && (
             <button onClick={() => setView('forgot')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Forgotten your security key?</button>
           )}

           {view !== 'login' && (
             <button onClick={() => setView('login')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
               <ArrowLeft size={12} /> Return to Login
             </button>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
