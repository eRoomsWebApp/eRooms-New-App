
import React from 'react';
import { useProperties } from '../context/PropertyContext';
import { INSTITUTES, KOTA_AREAS } from '../constants';
import { Gender } from '../types';

const SearchBar: React.FC = () => {
  const { filters, setFilters } = useProperties();

  const handleUpdate = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-2 rounded-[28px] md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 relative z-20">
      {/* Coaching Segment */}
      <div className="flex-1 p-5 md:p-6 group">
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 transition-colors group-hover:text-indigo-500 text-left">Target Coaching</label>
        <div className="relative">
          <select 
            className="w-full bg-transparent focus:outline-none font-black text-slate-900 cursor-pointer appearance-none pr-6 text-sm md:text-base"
            value={filters.coaching}
            onChange={(e) => handleUpdate('coaching', e.target.value)}
          >
            <option value="All">All Institutes</option>
            {INSTITUTES.map(inst => <option key={inst} value={inst}>{inst}</option>)}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </div>
        </div>
      </div>

      {/* Gender Segment */}
      <div className="flex-1 p-5 md:p-6 group">
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 transition-colors group-hover:text-indigo-500 text-left">Gender Preference</label>
        <div className="relative">
          <select 
            className="w-full bg-transparent focus:outline-none font-black text-slate-900 cursor-pointer appearance-none pr-6 text-sm md:text-base"
            value={filters.gender}
            onChange={(e) => handleUpdate('gender', e.target.value)}
          >
            <option value="All">Anyone</option>
            <option value={Gender.Boys}>Boys Only</option>
            <option value={Gender.Girls}>Girls Only</option>
            <option value={Gender.Unisex}>Unisex</option>
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </div>
        </div>
      </div>

      {/* Area Segment */}
      <div className="flex-1 p-5 md:p-6 group">
        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 transition-colors group-hover:text-indigo-500 text-left">Specific Area</label>
        <div className="relative">
          <select 
            className="w-full bg-transparent focus:outline-none font-black text-slate-900 cursor-pointer appearance-none pr-6 text-sm md:text-base"
            value={filters.area}
            onChange={(e) => handleUpdate('area', e.target.value)}
          >
            <option value="All">Across Kota</option>
            {KOTA_AREAS.map(area => <option key={area} value={area}>{area.split(' (')[0]}</option>)}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
          </div>
        </div>
      </div>

      <button className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 md:py-0 rounded-[22px] md:rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 transition-all m-2 active:scale-95">
        Refine Results
      </button>
    </div>
  );
};

export default SearchBar;

