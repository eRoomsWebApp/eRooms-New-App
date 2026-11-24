import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useConfig } from '../context/ConfigContext';
import { MessageCircle } from 'lucide-react';
import { EROOMS_WHATSAPP_NUMBER } from '../utils/tracking';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { config } = useConfig();

  if (!config) return null;

  const navItems = [
    { label: 'Hostels', path: '/' },
    { label: 'PG', path: '/?type=PG' },
    { label: 'Boys', path: '/?gender=Boys' },
    { label: 'Girls', path: '/?gender=Girls' }
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.Admin || user.role === UserRole.SuperAdmin) return '/admin/dashboard';
    if (user.role === UserRole.Owner) return '/owner/dashboard';
    return '/';
  };

  const whatsappUrl = `https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Namaste eRooms, mujhe Kota mein Hostel / PG ke baare mein details chahiye.'
  )}`;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <a
            href="https://www.erooms.in/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-200 group-hover:bg-blue-700 transition-colors">
              e
            </div>
            <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-slate-900">
              eRooms<span className="text-blue-600">.in</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-6 pl-4 border-l border-slate-100">
            {navItems.map(item => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/' && !location.search.includes('type=')
                  : location.pathname + location.search === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-[12px] font-black uppercase tracking-widest transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin || user?.role === UserRole.Owner) && (
            <div className="hidden lg:flex items-center gap-3">
              <Link
                to={getDashboardPath()}
                className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-[11px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 px-2"
              >
                Logout
              </button>
            </div>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md shadow-blue-100 transition-all"
          >
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
