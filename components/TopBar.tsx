
import React, { useState, useEffect } from 'react';
import { getAppConfig, CONFIG_UPDATED_EVENT } from '../db';

const TopBar: React.FC = () => {
  const [config, setConfig] = useState(getAppConfig());

  useEffect(() => {
    const handleSync = (e: any) => {
      setConfig(e.detail);
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
  }, []);

  return (
    <div className="bg-slate-900 text-white py-2.5 px-4 overflow-hidden hidden md:block border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.15em]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 italic">Call Us:</span>
            <span>{config.supportPhone}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 italic">WhatsApp:</span>
            <span>+{config.supportWhatsApp}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-indigo-400 transition-colors">Career</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full transition-all text-[10px] font-black shadow-lg shadow-indigo-500/20">
            List Your Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

