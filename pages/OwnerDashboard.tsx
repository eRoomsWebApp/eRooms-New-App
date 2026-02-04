
import React, { useState, useMemo } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { KOTA_AREAS, FACILITY_OPTIONS, INSTITUTES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, LayoutGrid, CheckCircle, Clock, Trash2, Edit3, MessageCircle } from 'lucide-react';

const OwnerDashboard: React.FC = () => {
  const { properties, addProperty, deleteProperty } = useProperties();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const myProperties = useMemo(() => {
    return properties.filter(p => p.ownerId === user?.id);
  }, [properties, user]);

  const initialForm: Omit<Property, 'id'> = {
    ownerId: user?.id || 'owner',
    ListingName: '',
    ListingType: ListingType.Hostel,
    Gender: Gender.Boys,
    OwnerName: user?.username || 'Property Owner',
    OwnerWhatsApp: '',
    WardenName: '',
    EmergencyContact: '',
    OwnerEmail: '',
    Area: KOTA_AREAS[0],
    FullAddress: '',
    GoogleMapsPlusCode: '',
    // Initializing with at least one distance node to prevent UI issues
    InstituteDistanceMatrix: [{ name: INSTITUTES[0], distance: 1.0 }],
    RentSingle: 0,
    RentDouble: 0,
    SecurityTerms: 'Standard security terms apply.',
    ElectricityCharges: 0,
    Maintenance: 0,
    ParentsStayCharge: 0,
    Facilities: [],
    PhotoMain: 'https://picsum.photos/seed/p1/1200/800',
    PhotoRoom: 'https://picsum.photos/seed/p2/1200/800',
    PhotoWashroom: 'https://picsum.photos/seed/p3/1200/800',
    ApprovalStatus: ApprovalStatus.Pending
  };

  const [formData, setFormData] = useState<Omit<Property, 'id'>>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProperty({ ...formData, id: Date.now().toString() });
    setIsAdding(false);
    setFormData(initialForm);
  };

  const toggleFacility = (fac: string) => {
    setFormData(prev => ({
      ...prev,
      Facilities: prev.Facilities.includes(fac) 
        ? prev.Facilities.filter(f => f !== fac)
        : [...prev.Facilities, fac]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Owner Workspace</h1>
          <p className="text-slate-500 font-bold">Manage your properties and track application status</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus size={20} />
          List New Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <LayoutGrid size={24} />
              </div>
              <span className="text-3xl font-black text-slate-900">{myProperties.length}</span>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Listings</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <span className="text-3xl font-black text-slate-900">
                {myProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length}
              </span>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Listings</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock size={24} />
              </div>
              <span className="text-3xl font-black text-slate-900">
                {myProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length}
              </span>
           </div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Review</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-xl font-black text-slate-900">Your Property Collection</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-5">Property Narrative</th>
                <th className="px-8 py-5">Area</th>
                <th className="px-8 py-5">Monthly Rent</th>
                <th className="px-8 py-5">Current Status</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myProperties.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                          <img src={p.PhotoMain} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <p className="font-black text-slate-900">{p.ListingName}</p>
                          <p className="text-xs font-bold text-slate-400">{p.ListingType}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">{p.Area}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900">₹{p.RentDouble}</p>
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Starting Price</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.ApprovalStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => deleteProperty(p.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative z-10 p-10 lg:p-14 border border-slate-100"
            >
              <div className="flex justify-between items-start mb-12">
                 <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Property Registration</h2>
                   <p className="text-slate-500 font-bold">Provide 23 mandatory fields for verification</p>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* General Info */}
                  <div className="space-y-6 lg:col-span-3">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 border-b border-slate-50 pb-2">Core Identity</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Name</label>
                           <input required className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 focus:bg-white" value={formData.ListingName} onChange={e => setFormData({...formData, ListingName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                           <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.ListingType} onChange={e => setFormData({...formData, ListingType: e.target.value as ListingType})}>
                             {Object.values(ListingType).map(v => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                           <select className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.Gender} onChange={e => setFormData({...formData, Gender: e.target.value as Gender})}>
                             {Object.values(Gender).map(v => <option key={v} value={v}>{v}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-6 lg:col-span-3">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 border-b border-slate-50 pb-2">Financial Transparency</h3>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Single Rent (₹)</label>
                           <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.RentSingle} onChange={e => setFormData({...formData, RentSingle: +e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Double Rent (₹)</label>
                           <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.RentDouble} onChange={e => setFormData({...formData, RentDouble: +e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Electricity (₹/Unit)</label>
                           <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.ElectricityCharges} onChange={e => setFormData({...formData, ElectricityCharges: +e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance (₹)</label>
                           <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100" value={formData.Maintenance} onChange={e => setFormData({...formData, Maintenance: +e.target.value})} />
                        </div>
                     </div>
                  </div>

                  {/* Facilities */}
                  <div className="space-y-6 lg:col-span-3">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 border-b border-slate-50 pb-2">Amenities</h3>
                     <div className="flex flex-wrap gap-3">
                        {FACILITY_OPTIONS.map(fac => (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => toggleFacility(fac)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              formData.Facilities.includes(fac) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {fac}
                          </button>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="pt-12 border-t border-slate-50">
                   <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl">
                      List for Review
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerDashboard;
