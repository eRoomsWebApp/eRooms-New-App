
import React from 'react';
import { useConfig } from '../context/ConfigContext';

const TopBar: React.FC = () => {
  const { config } = useConfig();

  if (!config) return null;

  return (
    <div className="bg-slate-900 text-white py-2.5 px-4 overflow-hidden hidden md:block border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.15em]">
        <div className="flex items-center gap-8">
          <a href={`tel:${config.supportPhone}`} className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
            <span className="text-slate-500 italic">Call Us:</span>
            <span>{config.supportPhone}</span>
          </a>
          <a 
            href={`https://wa.me/${config.supportWhatsApp}?text=${encodeURIComponent('नमस्ते, मैं रूम देख रहा था, मुझे रूम की जरूरत है।')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <span className="text-slate-500 italic">WhatsApp:</span>
            <span>+{config.supportWhatsApp}</span>
          </a>
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

