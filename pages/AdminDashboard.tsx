
import React, { useState, useMemo, useEffect } from 'react';
import { useProperties } from '../context/PropertyContext';
import { Property, ListingType, Gender, ApprovalStatus, UserRole, User, AppConfig } from '../types';
import { getAppConfig, saveAppConfig, getMockUsers } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from '../constants';
import { 
  Shield, Check, X, Edit, Settings, Building2, Trash2, Search, 
  Users, Cpu, Terminal, Command, Database, Zap, ShieldCheck, 
  UserPlus, Navigation, MapPin, Phone, Mail, User as UserIcon,
  Sparkles, Camera, CreditCard, ShieldAlert, Activity, LayoutGrid, ArrowRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { properties, approveProperty, deleteProperty, updateProperty } = useProperties();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'config' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  const [config, setConfig] = useState<AppConfig>(getAppConfig());

  const stats = useMemo(() => ({
    totalListings: properties.length,
    pendingListings: properties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    totalUsers: getMockUsers().length,
  }), [properties]);

  const filteredListings = properties.filter(p => 
    p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKernelUpdate = (p: Property) => {
    setIsSyncing(true);
    updateProperty(p.id, p);
    setTimeout(() => {
      setIsSyncing(false);
      setEditingProperty(null);
    }, 800);
  };

  const navItems = [
    { id: 'overview', label: 'Command Hub', icon: Command },
    { id: 'listings', label: 'Asset Registry', icon: Building2 },
    { id: 'users', label: 'Node Directory', icon: Users },
    { id: 'config', label: 'Kernel Control', icon: Cpu },
    { id: 'logs', label: 'Audit Trail', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 border-r border-white/5 p-6 lg:p-10 flex lg:flex-col sticky top-20 z-40 lg:h-[calc(100vh-80px)]">
        <div className="hidden lg:flex items-center gap-4 mb-16">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl"><Shield size={24} /></div>
          <div>
            <p className="font-black text-white text-lg uppercase tracking-tighter">Kernel</p>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Super Admin v2.5</p>
          </div>
        </div>
        <nav className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar lg:overflow-visible">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all whitespace-nowrap group ${
                activeTab === tab.id ? 'bg-white text-slate-900' : 'text-white/40 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="flex-grow p-6 lg:p-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{activeTab}</h1>
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text"
              placeholder="Search assets..."
              className="pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-2xl w-full font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'listings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-10 py-8">Asset Node</th>
                      <th className="px-10 py-8">Cluster</th>
                      <th className="px-10 py-8">Status</th>
                      <th className="px-10 py-8 text-right">Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredListings.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <img src={p.PhotoMain} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                            <div>
                              <p className="text-lg font-black text-slate-900 tracking-tight">{p.ListingName}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.OwnerName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 font-bold text-slate-500">{p.Area}</td>
                        <td className="px-10 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {p.ApprovalStatus}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right space-x-3">
                          <button 
                            onClick={() => setEditingProperty(p)}
                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteProperty(p.id)}
                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                   <Building2 className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
                   <h3 className="text-5xl font-black mb-2">{stats.totalListings}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Active Asset Nodes</p>
                </div>
                <div className="bg-white border border-slate-200 p-12 rounded-[48px] shadow-sm">
                   <h3 className="text-5xl font-black text-slate-900 mb-2">{stats.pendingListings}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Awaiting Audit</p>
                </div>
                <div className="bg-indigo-600 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                   <Users className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" />
                   <h3 className="text-5xl font-black mb-2">{stats.totalUsers}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Registered Identities</p>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Universal Kernel Editor Overlay */}
      <AnimatePresence>
        {editingProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProperty(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-7xl h-[94vh] rounded-[48px] relative z-10 overflow-hidden flex flex-col">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Kernel Overrider</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">Direct Manipulation Protocol: {editingProperty.id}</p>
                </div>
                <button onClick={() => setEditingProperty(null)} className="p-4 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-all"><X size={24} /></button>
              </div>

              <div className="flex-grow overflow-y-auto p-12 space-y-16 no-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* Column 1: Core Narrative */}
                  <div className="lg:col-span-8 space-y-12">
                    <section className="space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><Sparkles size={18} className="text-indigo-600" /> Identity Narrative</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Listing Name</label>
                             <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none" value={editingProperty.ListingName} onChange={e => setEditingProperty({...editingProperty, ListingName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Listing Type</label>
                             <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none" value={editingProperty.ListingType} onChange={e => setEditingProperty({...editingProperty, ListingType: e.target.value as ListingType})}>
                                {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Gender Protocol</label>
                             <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none" value={editingProperty.Gender} onChange={e => setEditingProperty({...editingProperty, Gender: e.target.value as Gender})}>
                                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Status Registry</label>
                             <select className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black border-none" value={editingProperty.ApprovalStatus} onChange={e => setEditingProperty({...editingProperty, ApprovalStatus: e.target.value as ApprovalStatus})}>
                                {Object.values(ApprovalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><MapPin size={18} className="text-indigo-600" /> Geo Location</h3>
                       <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cluster Area</label>
                             <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none" value={editingProperty.Area} onChange={e => setEditingProperty({...editingProperty, Area: e.target.value})}>
                                {KOTA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Full Vector Address</label>
                             <textarea className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none h-24" value={editingProperty.FullAddress} onChange={e => setEditingProperty({...editingProperty, FullAddress: e.target.value})} />
                          </div>
                       </div>
                    </section>

                    <section className="space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><CreditCard size={18} className="text-indigo-600" /> Financial Protocol</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            { l: 'Rent Single', k: 'RentSingle' },
                            { l: 'Rent Double', k: 'RentDouble' },
                            { l: 'Electricity', k: 'ElectricityCharges' },
                            { l: 'Maintenance', k: 'Maintenance' },
                          ].map(f => (
                            <div key={f.k} className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{f.l}</label>
                               <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl font-black border-none" value={(editingProperty as any)[f.k]} onChange={e => setEditingProperty({...editingProperty, [f.k]: Number(e.target.value)})} />
                            </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><LayoutGrid size={18} className="text-indigo-600" /> Amenity Matrix</h3>
                       <div className="flex flex-wrap gap-3">
                          {FACILITY_OPTIONS.map(fac => (
                             <button 
                                key={fac}
                                onClick={() => {
                                   const current = editingProperty.Facilities || [];
                                   const next = current.includes(fac) ? current.filter(x => x !== fac) : [...current, fac];
                                   setEditingProperty({...editingProperty, Facilities: next});
                                }}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                   editingProperty.Facilities?.includes(fac) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                             >
                                {fac}
                             </button>
                          ))}
                       </div>
                    </section>
                  </div>

                  {/* Column 2: Media & Emergency */}
                  <div className="lg:col-span-4 space-y-12">
                    <section className="space-y-8">
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><Camera size={18} className="text-indigo-600" /> Image Cluster</h3>
                       <div className="space-y-6">
                          {[
                            { l: 'Hero Image', k: 'PhotoMain' },
                            { l: 'Room View', k: 'PhotoRoom' },
                            { l: 'Washroom Node', k: 'PhotoWashroom' },
                          ].map(img => (
                             <div key={img.k} className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">{img.l}</label>
                                <div className="relative">
                                   <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none pr-12" value={(editingProperty as any)[img.k]} onChange={e => setEditingProperty({...editingProperty, [img.k]: e.target.value})} />
                                   <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm">
                                      <img src={(editingProperty as any)[img.k]} className="w-full h-full object-cover" />
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-8 bg-slate-900 p-8 rounded-[40px] text-white">
                       <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><ShieldAlert size={18} className="text-red-500" /> Guardian Matrix</h3>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/30 ml-2">Host Name</label>
                             <input type="text" className="w-full bg-white/10 p-4 rounded-2xl font-bold border-none text-white" value={editingProperty.OwnerName} onChange={e => setEditingProperty({...editingProperty, OwnerName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/30 ml-2">Warden Identity</label>
                             <input type="text" className="w-full bg-white/10 p-4 rounded-2xl font-bold border-none text-white" value={editingProperty.WardenName} onChange={e => setEditingProperty({...editingProperty, WardenName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-white/30 ml-2">Emergency Hotline</label>
                             <input type="text" className="w-full bg-red-500/20 p-4 rounded-2xl font-black border-none text-white" value={editingProperty.EmergencyContact} onChange={e => setEditingProperty({...editingProperty, EmergencyContact: e.target.value})} />
                          </div>
                       </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400">
                    <Database size={16} /> Ready to commit state to Atlas
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setEditingProperty(null)} className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-900 transition-all">Abort Override</button>
                    <button 
                      onClick={() => handleKernelUpdate(editingProperty)}
                      className="px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                    >
                       {isSyncing ? <Zap size={16} className="animate-spin" /> : <Database size={16} />}
                       Push to Cluster
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

export default AdminDashboard;
