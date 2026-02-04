
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { getAppConfig, CONFIG_UPDATED_EVENT } from '../db';
import { Menu, X, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [siteName, setSiteName] = useState(getAppConfig().siteName);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleSync = (e: any) => {
      setSiteName(e.detail.siteName);
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Hostel', path: '/?type=Hostel' },
    { label: 'PG', path: '/?type=PG' },
    { label: 'Flats', path: '/?type=Flat' },
    { label: 'Mess', path: '/?type=Mess' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.Admin) return '/admin/dashboard';
    if (user.role === UserRole.Owner) return '/owner/dashboard';
    if (user.role === UserRole.Student) return '/student/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-xl">{siteName[0]}</div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-slate-900 truncate max-w-[150px] md:max-w-none">{siteName}</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link key={item.label} to={item.path} className={`text-[12px] font-black uppercase tracking-widest transition-colors ${location.pathname === item.path ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>{item.label}</Link>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to={getDashboardPath()} className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg">Dashboard</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 px-2">Logout</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-900 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all">Login</button>
          )}
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
    </nav>
  );
};

export default Navbar;
