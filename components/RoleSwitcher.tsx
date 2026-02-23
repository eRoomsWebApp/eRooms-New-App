
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, User, Store, Ghost } from 'lucide-react';

const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();

  const currentRole = user?.role || 'guest';

  const roles = [
    { id: 'guest', label: 'Guest', icon: Ghost },
    { id: UserRole.Student, label: 'Student', icon: User },
    { id: UserRole.Owner, label: 'Owner', icon: Store },
    { id: UserRole.Admin, label: 'Admin', icon: Shield },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-[9999] pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-slate-200 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-1"
      >
        <div className="px-4 py-2 border-r border-slate-100 mr-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Emulator</p>
          <p className="text-[11px] font-black text-slate-900 leading-none capitalize">{currentRole}</p>
        </div>

        <div className="flex items-center gap-1">
          {roles.map((role) => {
            const isActive = currentRole === role.id;
            const Icon = role.icon;
            
            return (
              <button
                key={role.id}
                onClick={() => switchRole(role.id as any)}
                className={`relative group px-4 py-2.5 rounded-full transition-all duration-300 flex items-center gap-2 overflow-hidden ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
                <span className="text-[11px] font-black uppercase tracking-wider">{role.label}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeRole"
                    className="absolute inset-0 bg-blue-600 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default RoleSwitcher;

