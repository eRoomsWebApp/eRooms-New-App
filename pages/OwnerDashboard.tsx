
import React, { useState, useMemo } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Property, ListingType, Gender, ApprovalStatus, UserRole } from '../types';
import { KOTA_AREAS, FACILITY_OPTIONS, INSTITUTES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, LayoutGrid, CheckCircle, Clock, 
  Trash2, Edit3, MessageCircle, Building2,
  TrendingUp, ShieldCheck, PieChart, Wallet,
  Zap, ArrowRight, UserCheck, AlertTriangle,
  ArrowUpRight, BarChart3, Database, ShieldAlert
} from 'lucide-react';

const OwnerDashboard: React.FC = () => {
  const { properties, addProperty, deleteProperty } = useProperties();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const myProperties = useMemo(() => {
    return properties.filter(p => p.ownerId === user?.id || p.ownerId === 'owner');
  }, [properties, user]);

  const portfolioStats = useMemo(() => ({
    totalRent: myProperties.reduce((acc, p) => acc + p.RentDouble, 0),
    liveNodes: myProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length,
    pendingAudit: myProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    avgRent: myProperties.length > 0 ? Math.floor(myProperties.reduce((acc, p) => acc + p.RentDouble, 0) / myProperties.length) : 0
  }), [myProperties]);

  const initialForm: Omit<Property, 'id'> = {
    ownerId: user?.id || 'owner',
    ListingName: '',
    ListingType: ListingType.Hostel,
    Gender: Gender.Boys,
    OwnerName: user?.username || 'Property Owner',
    OwnerWhatsApp: '',
    WardenName: '',
    EmergencyContact: '',
    OwnerEmail: user?.email || '',
    Area: KOTA_AREAS[0],
    FullAddress: '',
    GoogleMapsPlusCode: '',
    InstituteDistanceMatrix: INSTITUTES.map(name => ({ name, distance: 1.0 })),
    RentSingle: 0,
    RentDouble: 0,
    SecurityTerms: 'Standard security terms apply. One month rent as security.',
    ElectricityCharges: 0,
    Maintenance: 0,
    ParentsStayCharge: 0,
    Facilities: [],
    PhotoMain: 'https://images.unsplash.com/photo-1512917774-50ad913ee29a?auto=format&fit=crop&q=80&w=2000',
    PhotoRoom: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=2000',
    PhotoWashroom: 'https://images.unsplash.com/photo-1584622650-61f8c508fe54?auto=format&fit=crop&q=80&w=2000',
    ApprovalStatus: ApprovalStatus.Pending
  };

  const [formData, setFormData] = useState<Omit<Property, 'id'>>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProperty({ ...formData, id: `prop-${Date.now()}` });
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

  if (user?.role !== UserRole.Owner) return null;

  return (
    <div className="min-h-screen bg-white pb-32">
      
      {/* 1. Host Portfolio Header - Professional Real Estate Theme */}
      <header className="bg-slate-50 border-b border-slate-100 pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
           <div className="space-y-4">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-slate-200">
                    {user.username[0]}
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Host Portfolio Hub</span>
                       <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <UserCheck size={10} /> Verified Host
                       </span>
                    </div>
                    <h1 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Management, {user.username.split(' ')[0]}</h1>
                 </div>
              </div>
              <p className="text-slate-400 font-bold max-w-xl leading-relaxed text-sm">
                Real-time performance metrics for your asset collection in the Kota cluster. Direct communication with scholars is active.
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full md:w-auto">
              {[
                { label: 'Asset Nodes', val: myProperties.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-white' },
                { label: 'Live Yield', val: portfolioStats.liveNodes, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-white' },
                { label: 'Trust Index', val: '9.8', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-white' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} border border-slate-100 p-8 rounded-[40px] shadow-sm min-w-[200px] group hover:shadow-xl transition-all`}>
                   <s.icon size={20} className={`${s.color} mb-3 group-hover:scale-125 transition-transform`} />
                   <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                   <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">{s.label}</p>
                </div>
              ))}
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-20">
        
        {/* 2. Portfolio Management Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
           
           {/* Registry Table */}
           <div className="lg:col-span-8 space-y-16">
              <div className="flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Portfolio Registry</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1">Live management of your property narratives.</p>
                 </div>
                 <button 
                   onClick={() => setIsAdding(true)}
                   className="bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-4"
                 >
                    <Plus size={18} /> New Registration
                 </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-[56px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <th className="px-12 py-8">Asset Profile</th>
                        <th className="px-12 py-8">Cluster</th>
                        <th className="px-12 py-8">Audit State</th>
                        <th className="px-12 py-8 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {myProperties.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-[22px] overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                  <img src={p.PhotoMain} className="w-full h-full object-cover" alt="" />
                               </div>
                               <div>
                                  <p className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{p.ListingName}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.ListingType} • {p.Gender}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-12 py-10 text-[13px] font-bold text-slate-500">{p.Area.split(' (')[0]}</td>
                          <td className="px-12 py-10">
                            <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-3 ${
                              p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                              {p.ApprovalStatus}
                            </span>
                          </td>
                          <td className="px-12 py-10 text-right">
                             <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Edit3 size={18} /></button>
                                <button onClick={() => deleteProperty(p.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {myProperties.length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-12 py-32 text-center">
                              <Building2 size={60} className="mx-auto text-slate-100 mb-6" />
                              <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">Registry Empty. Register your first asset.</p>
                           </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>

           {/* Performance Sidebar */}
           <div className="lg:col-span-4 space-y-10">
              <section className="bg-slate-900 text-white p-12 rounded-[64px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"><TrendingUp size={120} /></div>
                 <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-12">Revenue Intelligence</h3>
                 <div className="mb-14">
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Est. Portfolio Monthly Flow</p>
                    <p className="text-6xl font-black tracking-tighter">₹{portfolioStats.totalRent.toLocaleString()}<span className="text-lg font-bold text-white/10 ml-1">/mo</span></p>
                 </div>
                 <div className="p-7 bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-between backdrop-blur-md">
                    <div>
                       <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1">Mean Asset Yield</p>
                       <p className="text-2xl font-black">₹{portfolioStats.avgRent.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Wallet size={24} /></div>
                 </div>
              </section>

              <section className="bg-white border border-slate-200 p-12 rounded-[64px] shadow-sm">
                 <h3 className="text-xl font-black text-slate-900 mb-10 uppercase tracking-tighter flex items-center gap-3"><BarChart3 size={20} className="text-indigo-600" /> Inquiry Pulse</h3>
                 <div className="space-y-10">
                    {[
                      { label: 'Scholar Leads', val: 42, color: 'bg-indigo-600', max: 100 },
                      { label: 'WhatsApp Signal', val: 156, color: 'bg-green-500', max: 300 },
                      { label: 'Discovery Views', val: 942, color: 'bg-blue-500', max: 1500 },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-4">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">{stat.label}</span>
                            <span className="text-slate-900">{stat.val}</span>
                         </div>
                         <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stat.val / stat.max) * 100}%` }} transition={{ duration: 1.2, delay: i * 0.1 }} className={`h-full ${stat.color} rounded-full`} />
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <div className="bg-amber-50 border border-amber-100 p-12 rounded-[64px] flex items-center gap-8 group hover:bg-amber-100/50 transition-all cursor-pointer">
                 <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform"><ShieldAlert size={28} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Compliance Alert</p>
                    <p className="text-sm font-bold text-amber-900 leading-tight">2 Assets are missing verified high-res washroom photos.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Asset Registry Modal - Fully Restored */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-6xl h-[94vh] overflow-hidden rounded-[64px] shadow-2xl relative z-10 flex flex-col border border-white/20"
            >
              <div className="p-12 lg:p-16 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">Asset Registration</h2>
                   <p className="text-slate-400 font-bold text-sm">Provide core narrative and financial vectors for Atlas verification.</p>
                 </div>
                 <button onClick={() => setIsAdding(false)} className="p-6 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={32} /></button>
              </div>

              <div className="flex-grow overflow-y-auto p-12 lg:p-16 custom-scrollbar space-y-20">
                 <form id="asset-form" onSubmit={handleSubmit} className="space-y-20">
                    <section className="space-y-10">
                       <h3 className="text-2xl font-black uppercase flex items-center gap-5 tracking-tight"><Building2 size={24} className="text-indigo-600" /> Core Asset Narrative</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Listing Name</label>
                             <input required className="w-full bg-slate-50 p-6 rounded-[28px] font-black border-none focus:ring-4 focus:ring-indigo-50 transition-all outline-none" value={formData.ListingName} onChange={e => setFormData({...formData, ListingName: e.target.value})} placeholder="e.g. Royal Zenith Elite" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Asset Class</label>
                             <select className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.ListingType} onChange={e => setFormData({...formData, ListingType: e.target.value as ListingType})}>
                               {Object.values(ListingType).map(v => <option key={v} value={v}>{v}</option>)}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Gender Exclusion</label>
                             <select className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.Gender} onChange={e => setFormData({...formData, Gender: e.target.value as Gender})}>
                               {Object.values(Gender).map(v => <option key={v} value={v}>{v}</option>)}
                             </select>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-10">
                       <h3 className="text-2xl font-black uppercase flex items-center gap-5 tracking-tight"><Wallet size={24} className="text-indigo-600" /> Economic Protocol</h3>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Single Rent (₹)</label>
                             <input type="number" required className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.RentSingle} onChange={e => setFormData({...formData, RentSingle: +e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Double Rent (₹)</label>
                             <input type="number" required className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.RentDouble} onChange={e => setFormData({...formData, RentDouble: +e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Elec. (₹/Unit)</label>
                             <input type="number" className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.ElectricityCharges} onChange={e => setFormData({...formData, ElectricityCharges: +e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Maintenance (₹)</label>
                             <input type="number" className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.Maintenance} onChange={e => setFormData({...formData, Maintenance: +e.target.value})} />
                          </div>
                       </div>
                    </section>

                    <section className="space-y-10">
                       <h3 className="text-2xl font-black uppercase flex items-center gap-5 tracking-tight"><Zap size={24} className="text-indigo-600" /> Amenity Matrix</h3>
                       <div className="flex flex-wrap gap-4">
                          {FACILITY_OPTIONS.map(fac => (
                            <button
                              key={fac}
                              type="button"
                              onClick={() => toggleFacility(fac)}
                              className={`px-10 py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all border ${
                                formData.Facilities.includes(fac) ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              {fac}
                            </button>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-10">
                       <h3 className="text-2xl font-black uppercase flex items-center gap-5 tracking-tight"><Clock size={24} className="text-indigo-600" /> Geographic Cluster</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Target Area</label>
                             <select className="w-full bg-slate-50 p-6 rounded-[28px] font-black outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.Area} onChange={e => setFormData({...formData, Area: e.target.value})}>
                               {KOTA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Address Narrative</label>
                             <input required className="w-full bg-slate-50 p-6 rounded-[28px] font-bold outline-none border-none focus:ring-4 focus:ring-indigo-50" value={formData.FullAddress} onChange={e => setFormData({...formData, FullAddress: e.target.value})} placeholder="Detailed Location Vector" />
                          </div>
                       </div>
                    </section>
                 </form>
              </div>

              <div className="p-12 lg:p-16 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
                 <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-5"><Database size={20} /> Transmitting to Atlas Master Node v2.4</div>
                 <div className="flex gap-6 w-full md:w-auto">
                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 md:flex-none px-14 py-6 font-black uppercase text-slate-400 hover:text-slate-900 transition-all">Abort Registry</button>
                    <button type="submit" form="asset-form" className="flex-1 md:flex-none px-20 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-xs shadow-[0_24px_48px_-12px_rgba(15,23,42,0.3)] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4">
                       Finalize Transmit <ArrowRight size={20} />
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerDashboard;
