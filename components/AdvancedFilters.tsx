
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check, MapPin, IndianRupee, Sparkles } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';

const AMENITIES = [
  'AC', 'WiFi', 'Mess Facility', 'Laundry', 'CCTV', 'RO Water', 
  'Geyser', 'Attached Washroom', 'Study Table', 'Wardrobe', 'Balcony'
];

const ROOM_TYPES = ['Single', 'Double'];

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters } = useProperties();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const toggleFacility = (facility: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedFacilities: prev.selectedFacilities.includes(facility)
        ? prev.selectedFacilities.filter(f => f !== facility)
        : [...prev.selectedFacilities, facility]
    }));
  };

  const toggleRoomType = (type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(type)
        ? prev.roomTypes.filter(t => t !== type)
        : [...prev.roomTypes, type]
    }));
  };

  const resetFilters = () => {
    const defaultFilters = {
      ...filters,
      priceRange: [0, 50000] as [number, number],
      selectedFacilities: [],
      maxDistance: 0,
      gender: 'All',
      roomTypes: []
    };
    setLocalFilters(defaultFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Advanced Filters</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refine your discovery</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
              {/* Gender Preference */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Gender Preference</h3>
                </div>
                <div className="flex gap-3">
                  {['All', 'Boys', 'Girls'].map(g => (
                    <button
                      key={g}
                      onClick={() => setLocalFilters(prev => ({ ...prev, gender: g }))}
                      className={`flex-1 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                        localFilters.gender === g 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </section>

              {/* Price Range */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <IndianRupee size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Price Range (Monthly)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Rent</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={localFilters.priceRange[0]}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: [Number(e.target.value), prev.priceRange[1]] }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-8 pr-4 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Rent</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input 
                        type="number" 
                        value={localFilters.priceRange[1]}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], Number(e.target.value)] }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-8 pr-4 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50000" 
                  step="1000"
                  value={localFilters.priceRange[1]}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], Number(e.target.value)] }))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </section>

              {/* Room Type */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Room Type</h3>
                </div>
                <div className="flex gap-3">
                  {ROOM_TYPES.map(type => {
                    const isSelected = localFilters.roomTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleRoomType(type)}
                        className={`flex-1 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {type} Seater
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Distance Filter */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <MapPin size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Distance to {localFilters.coaching === 'All' ? 'Institutes' : localFilters.coaching}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">
                      {localFilters.maxDistance === 0 ? 'Any' : `< ${(localFilters.maxDistance / 1000).toFixed(1)} km`}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Walking distance</p>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="100"
                    value={localFilters.maxDistance}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>0m</span>
                    <span>5km</span>
                  </div>
                </div>
              </section>

              {/* Amenities */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Must-have Amenities</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AMENITIES.map(facility => {
                    const isSelected = localFilters.selectedFacilities.includes(facility);
                    return (
                      <button
                        key={facility}
                        onClick={() => toggleFacility(facility)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{facility}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={resetFilters}
                className="flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Reset All
              </button>
              <button 
                onClick={handleApply}
                className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdvancedFilters;
