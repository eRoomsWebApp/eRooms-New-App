import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAppConfig } from '../db';

interface BulkPriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (area: string, amount: number) => void;
}

const BulkPriceUpdateModal: React.FC<BulkPriceUpdateModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const config = getAppConfig();
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [updateAmount, setUpdateAmount] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !updateAmount) return;

    onUpdate(selectedArea, parseFloat(updateAmount));
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-slate-100"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Bulk Price Update</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Market Adjustment</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Update Successful</h3>
                <p className="text-slate-500 font-medium">Market rates have been synchronized.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                    <MapPin size={12} /> Select Cluster
                  </label>
                  <select 
                    required
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-8 py-5 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none"
                  >
                    <option value="">Choose an area...</option>
                    <option value="All">Global (All Areas)</option>
                    {config.areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                    <TrendingUp size={12} /> Adjustment Amount (₹)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 500 or -500"
                      value={updateAmount}
                      onChange={(e) => setUpdateAmount(e.target.value)}
                      className="w-full px-8 py-5 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-black text-slate-900 text-2xl"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      {parseFloat(updateAmount) > 0 ? (
                        <TrendingUp className="text-emerald-500" size={24} />
                      ) : parseFloat(updateAmount) < 0 ? (
                        <TrendingDown className="text-red-500" size={24} />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 ml-2 italic">
                    Use positive values to increase, negative to decrease.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                    This action will modify the rent for <span className="font-black">ALL</span> properties in the selected cluster. This cannot be undone easily.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={!selectedArea || !updateAmount}
                  className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Execute Price Shift
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkPriceUpdateModal;
