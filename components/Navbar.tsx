
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Hostel', path: '/?type=Hostel' },
    { label: 'PG', path: '/?type=PG' },
    { label: 'Flats', path: '/?type=Flat' },
    { label: 'Mess', path: '/?type=Mess' },
    { label: 'About Us', path: '/about' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.Admin) return '/admin/dashboard';
    if (user.role === UserRole.Owner) return '/owner/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-xl">e</div>
          <span className="font-extrabold text-2xl tracking-tighter text-slate-900">erooms.in</span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              to={item.path} 
              className={`text-[13px] font-black uppercase tracking-widest transition-colors ${
                location.pathname === item.path ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link 
                to={getDashboardPath()} 
                className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg"
              >
                {user?.role === UserRole.Admin ? 'Admin Hub' : user?.role === UserRole.Owner ? 'Owner Dashboard' : 'My Portal'}
              </Link>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 px-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-900 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all"
            >
              Login / Signup
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
