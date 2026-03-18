
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) return '/admin/dashboard';
    if (user.role === UserRole.Owner) return '/owner/dashboard';
    if (user.role === UserRole.Student) return '/student/dashboard';
    return '/';
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/', icon: Search }, // Search is on home
    { label: 'Shortlist', path: user?.role === UserRole.Student ? '/student/dashboard' : '/login', icon: Heart },
    { label: 'Profile', path: getDashboardPath(), icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 py-3 z-[100] flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.label} 
            to={item.path} 
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
          >
            <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50' : ''}`}>
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
      
      {/* Special List Property Button for Owners */}
      {(user?.role === UserRole.Owner || !isAuthenticated) && (
        <Link 
          to={!isAuthenticated ? '/login' : '/owner/dashboard?action=add'}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <div className="p-1 rounded-xl bg-slate-50">
            <PlusCircle size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Host</span>
        </Link>
      )}
    </div>
  );
};

export default MobileNav;
