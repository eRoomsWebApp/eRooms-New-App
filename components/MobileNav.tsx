import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Phone, MessageCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { EROOMS_CALL_TEL, EROOMS_WHATSAPP_NUMBER } from '../utils/tracking';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isStaff =
    user &&
    (user.role === UserRole.Admin ||
      user.role === UserRole.SuperAdmin ||
      user.role === UserRole.Owner);

  const staffDashboardPath =
    user?.role === UserRole.Owner ? '/owner/dashboard' : '/admin/dashboard';

  // Hostel pages have their own sticky WhatsApp / Visit / Call bar — don't stack two bars.
  const segs = location.pathname.split('/').filter(Boolean);
  const isPropertyPage =
    segs.length === 2 && !['area', 'near', 'admin', 'owner', 'student', 'property'].includes(segs[0]);
  if (isPropertyPage) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-2.5 z-[70] flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 transition-all ${
          location.pathname === '/' ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <div className={`p-1 rounded-xl ${location.pathname === '/' ? 'bg-blue-50' : ''}`}>
          <Home size={20} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">Hostels</span>
      </Link>

      <a
        href={`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
          'Namaste eRooms, mujhe Kota mein Hostel / PG chahiye.'
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-1 text-emerald-600"
      >
        <div className="p-1 rounded-xl bg-emerald-50">
          <MessageCircle size={20} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
      </a>

      <a
        href={`tel:${EROOMS_CALL_TEL}`}
        className="flex flex-col items-center gap-1 text-blue-600"
      >
        <div className="p-1 rounded-xl bg-blue-50">
          <Phone size={20} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
      </a>

      {isStaff && (
        <Link
          to={staffDashboardPath}
          className="flex flex-col items-center gap-1 text-slate-600"
        >
          <div className="p-1 rounded-xl bg-slate-100">
            <Building2 size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </Link>
      )}
    </div>
  );
};

export default MobileNav;
