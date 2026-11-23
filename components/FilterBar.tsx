import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProperties, DEFAULT_FILTERS } from '../context/PropertyContext';
import { SlidersHorizontal } from 'lucide-react';
import AdvancedFilters from './AdvancedFilters';

const PILLS = [
  { id: 'Luxury', label: '💎 Luxury Hostels', sub: 'Price > 15k' },
  { id: 'Budget', label: '🪙 Budget Friendly', sub: 'Price < 10k' },
  { id: 'Girls', label: '👩 Girls Only', sub: '' },
  { id: 'Boys', label: '👦 Boys Only', sub: '' },
  { id: 'Near Allen', label: '📍 Near Allen', sub: '< 500m' },
  { id: 'Near PW', label: '📍 Near PW', sub: '< 500m' },
  { id: 'AC', label: '❄️ AC Rooms', sub: '' },
  { id: 'Food', label: '🍱 With Food', sub: 'Mess Incl.' }
];

const FilterBar: React.FC = () => {
  const { filters, setFilters, isFiltering } = useProperties();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const togglePill = (id: string) => {
    setFilters(prev => ({
      ...prev,
      activePills: prev.activePills.includes(id)
        ? prev.activePills.filter(p => p !== id)
        : [...prev.activePills, id]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 scroll-smooth">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] whitespace-nowrap mr-2">
            Quick Filters:
          </span>

          <button
            type="button"
            onClick={() => setIsAdvancedOpen(true)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-[18px] text-[12px] font-black uppercase tracking-widest transition-all border shadow-lg ${
              isFiltering
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {PILLS.map((pill) => {
          const isActive = filters.activePills.includes(pill.id);
          return (
            <motion.button
              type="button"
              key={pill.id}
              onClick={() => togglePill(pill.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`whitespace-nowrap px-6 py-3.5 rounded-[18px] text-[13px] font-bold transition-all border flex flex-col items-start min-w-max ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <span>{pill.label}</span>
              {pill.sub && (
                <span
                  className={`text-[9px] font-medium opacity-60 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {pill.sub}
                </span>
              )}
            </motion.button>
          );
        })}

        {isFiltering && (
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>

      <AdvancedFilters isOpen={isAdvancedOpen} onClose={() => setIsAdvancedOpen(false)} />
    </div>
  );
};

export default FilterBar;
