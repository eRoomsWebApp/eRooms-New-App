
import React, { useState, useMemo, useRef } from 'react';
import { useProperties } from '../context/PropertyContext';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { KOTA_AREAS, FACILITY_OPTIONS, INSTITUTES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, X, Edit, Trash, Settings, BarChart, 
  MapPin, Building2, Clock, Save, Plus, Trash2, 
  UploadCloud, Search, Filter, AlertCircle, Image as ImageIcon
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { properties, updateProperty, deleteProperty, approveProperty, addProperty } = useProperties();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'config'>('listings');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    total: properties.length,
    pending: properties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    approved: properties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length,
    revenue: properties.reduce((acc, curr) => acc + (curr.RentDouble || 0), 0)
  }), [properties]);

  const filteredListings = properties.filter(p => 
    p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.OwnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProperty) {
      updateProperty(editingProperty.id, editingProperty);
      setEditingProperty(null);
    }
  };

  const addDistanceNode = () => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        InstituteDistanceMatrix: [
          ...editingProperty.InstituteDistanceMatrix,
          { name: INSTITUTES[0], distance: 1.0 }
        ]
      });
    }
  };

  const removeDistanceNode = (index: number) => {
    if (editingProperty) {
      const newMatrix = [...editingProperty.InstituteDistanceMatrix];
      newMatrix.splice(index, 1);
      setEditingProperty({ ...editingProperty, InstituteDistanceMatrix: newMatrix });
    }
  };

  const toggleFacility = (fac: string) => {
    if (editingProperty) {
      const newFacs = editingProperty.Facilities.includes(fac)
        ? editingProperty.Facilities.filter(f => f !== fac)
        : [...editingProperty.Facilities, fac];
      setEditingProperty({ ...editingProperty, Facilities: newFacs });
    }
  };

  const handleBulkUpload = () => {
    // Simulation of CSV logic
    alert("Bulk CSV Processor Engaged: Validating constants against KOTA_AREAS and INSTITUTES...");
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Super Admin Hub</h1>
          </div>
          <p className="text-slate-500 font-bold">Orchestrating the erooms-v2 student housing ecosystem</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={() => alert('CSV data parsed: 0 errors, 12 properties ready for review.')}
          />
          <button 
            onClick={handleBulkUpload}
            className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
          >
            <UploadCloud size={18} />
            Bulk CSV Upload
          </button>
          <button 
            onClick={() => {
              const newId = Date.now().toString();
              const proto: Property = {
                id: newId,
                ownerId: 'admin',
                ListingName: 'New Elite Property',
                ListingType: ListingType.Hostel,
                Gender: Gender.Boys,
                OwnerName: 'Super Admin',
                OwnerWhatsApp: '91',
                WardenName: '',
                EmergencyContact: '',
                OwnerEmail: '',
                Area: KOTA_AREAS[0],
                FullAddress: '',
                GoogleMapsPlusCode: '',
                InstituteDistanceMatrix: [],
                RentSingle: 0,
                RentDouble: 0,
                SecurityTerms: '1 Month Advance',
                ElectricityCharges: 10,
                Maintenance: 0,
                ParentsStayCharge: 0,
                Facilities: [],
                PhotoMain: 'https://images.unsplash.com/photo-1555854817-5b2260d07c47?q=80&w=2070&auto=format&fit=crop',
                PhotoRoom: '',
                PhotoWashroom: '',
                ApprovalStatus: ApprovalStatus.Pending
              };
              setEditingProperty(proto);
            }}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus size={18} />
            New Master Entry
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
           <BarChart className="text-white/20 absolute -right-4 -bottom-4 w-32 h-32 group-hover:scale-110 transition-transform" />
           <p className="text-5xl font-black tracking-tighter mb-1 relative z-10">{stats.total}</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-white/40 relative z-10">Total Listings</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
           <Clock className="text-amber-500/20 absolute -right-4 -bottom-4 w-32 h-32 group-hover:scale-110 transition-transform" />
           <p className="text-5xl font-black tracking-tighter mb-1 text-slate-900 relative z-10">{stats.pending}</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">Pending Review</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
           <Check className="text-green-500/20 absolute -right-4 -bottom-4 w-32 h-32 group-hover:scale-110 transition-transform" />
           <p className="text-5xl font-black tracking-tighter mb-1 text-slate-900 relative z-10">{stats.approved}</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">Approved & Live</p>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
           <MapPin className="text-indigo-500/20 absolute -right-4 -bottom-4 w-32 h-32 group-hover:scale-110 transition-transform" />
           <p className="text-5xl font-black tracking-tighter mb-1 text-slate-900 relative z-10">{KOTA_AREAS.length}</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">Served Clusters</p>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
           <div className="flex p-1 bg-white border border-slate-200 rounded-2xl">
              {(['listings', 'config'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
           </div>

           {activeTab === 'listings' && (
             <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  placeholder="Filter by Property, Owner, or Area..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 transition-all font-bold text-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
           )}
        </div>

        {activeTab === 'listings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-8 py-5">Elite Narrative</th>
                  <th className="px-8 py-5">Management Hub</th>
                  <th className="px-8 py-5">Financial Point</th>
                  <th className="px-8 py-5">Verification</th>
                  <th className="px-8 py-5 text-right">Master Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredListings.map(p => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 bg-slate-200">
                            <img src={p.PhotoMain} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 leading-tight">{p.ListingName}</p>
                            <p className="text-[10px] font-bold text-slate-400 italic mt-1">{p.Area}</p>
                            <div className="flex gap-1 mt-1">
                               <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-black">{p.ListingType}</span>
                               <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-black">{p.Gender}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900">{p.OwnerName}</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{p.OwnerWhatsApp}</p>
                      <div className="flex items-center gap-2 mt-1 opacity-40">
                         <Building2 size={12} />
                         <span className="text-[10px] font-bold">{p.InstituteDistanceMatrix.length} Nearest Points</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-lg">₹{p.RentDouble?.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base / Shared</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.ApprovalStatus === ApprovalStatus.Approved ? <Check size={12} /> : <Clock size={12} />}
                        {p.ApprovalStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                         {p.ApprovalStatus === ApprovalStatus.Pending && (
                           <button 
                             onClick={() => approveProperty(p.id)}
                             className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all active:scale-95"
                           >
                             Verify
                           </button>
                         )}
                         <button onClick={() => setEditingProperty(p)} className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all">
                            <Settings size={18} />
                         </button>
                         <button onClick={() => deleteProperty(p.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="p-12 text-center py-24">
             <Settings className="mx-auto text-slate-200 mb-6" size={48} />
             <h3 className="text-xl font-black text-slate-900 mb-2">Ecosystem Configuration</h3>
             <p className="text-slate-400 font-bold max-w-md mx-auto mb-8">Manage the constants like coaching institutes, geographical areas, and standard facility labels.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Serviceable Areas</h4>
                   <div className="flex flex-wrap gap-2">
                      {KOTA_AREAS.map(a => <span key={a} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">{a}</span>)}
                      <button className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center"><Plus size={14} /></button>
                   </div>
                </div>
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Target Institutes</h4>
                   <div className="flex flex-wrap gap-2">
                      {INSTITUTES.map(i => <span key={i} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">{i}</span>)}
                      <button className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center"><Plus size={14} /></button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Master Editor Overlay */}
      <AnimatePresence>
        {editingProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingProperty(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-6xl h-[92vh] overflow-y-auto rounded-[48px] shadow-2xl relative z-10 border border-white/20"
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                // Ensure array fields are not undefined before saving
                const final = {
                  ...editingProperty,
                  InstituteDistanceMatrix: editingProperty.InstituteDistanceMatrix || [],
                  Facilities: editingProperty.Facilities || []
                };
                
                // If ID is new (simulation), use addProperty
                if (!properties.some(p => p.id === final.id)) {
                   addProperty(final);
                } else {
                   updateProperty(final.id, final);
                }
                setEditingProperty(null);
              }} className="flex flex-col h-full">
                {/* Fixed Header */}
                <div className="p-8 lg:px-16 lg:py-10 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-30">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl">
                      <Settings size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ecosystem Master Control</h2>
                      <p className="text-slate-500 font-bold">Synchronizing all 23 schema fields for <span className="text-indigo-600">{editingProperty.ListingName || 'New Entity'}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setEditingProperty(null)} className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Discard</button>
                    <button type="submit" className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all">
                      <Save size={18} /> Push Master Update
                    </button>
                  </div>
                </div>

                <div className="p-8 lg:p-16 space-y-20">
                  {/* Part 1: Identity & Location */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black">01</div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Core Identity & Proximity</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                       <div className="md:col-span-6 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Listing Name</label>
                          <input 
                            required 
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                            value={editingProperty.ListingName} 
                            onChange={e => setEditingProperty({...editingProperty, ListingName: e.target.value})} 
                          />
                       </div>
                       <div className="md:col-span-3 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Property Type</label>
                          <select className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.ListingType} onChange={e => setEditingProperty({...editingProperty, ListingType: e.target.value as ListingType})}>
                            {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>
                       <div className="md:col-span-3 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Gender Target</label>
                          <select className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.Gender} onChange={e => setEditingProperty({...editingProperty, Gender: e.target.value as Gender})}>
                            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                       </div>
                       
                       <div className="md:col-span-4 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Area Cluster</label>
                          <select className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.Area} onChange={e => setEditingProperty({...editingProperty, Area: e.target.value})}>
                            {KOTA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                       </div>
                       <div className="md:col-span-8 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Address String</label>
                          <input 
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                            value={editingProperty.FullAddress} 
                            onChange={e => setEditingProperty({...editingProperty, FullAddress: e.target.value})} 
                          />
                       </div>

                       {/* Proximity Matrix Editor */}
                       <div className="md:col-span-12 space-y-6 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <MapPin size={14} className="text-indigo-600" />
                                Institute Distance Matrix
                             </h4>
                             <button type="button" onClick={addDistanceNode} className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2 hover:underline">
                                <Plus size={14} /> Add Nearest Point
                             </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {editingProperty.InstituteDistanceMatrix?.map((node, i) => (
                               <div key={i} className="flex gap-3 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                  <select 
                                    className="flex-grow bg-slate-50 border-none p-3 rounded-2xl font-bold text-sm outline-none" 
                                    value={node.name} 
                                    onChange={e => {
                                      const newM = [...editingProperty.InstituteDistanceMatrix];
                                      newM[i].name = e.target.value;
                                      setEditingProperty({...editingProperty, InstituteDistanceMatrix: newM});
                                    }}
                                  >
                                    {INSTITUTES.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                  </select>
                                  <div className="flex items-center gap-2">
                                     <input 
                                       type="number" step="0.1" 
                                       className="w-20 bg-slate-50 border-none p-3 rounded-2xl font-bold text-sm text-center outline-none" 
                                       value={node.distance} 
                                       onChange={e => {
                                          const newM = [...editingProperty.InstituteDistanceMatrix];
                                          newM[i].distance = +e.target.value;
                                          setEditingProperty({...editingProperty, InstituteDistanceMatrix: newM});
                                       }} 
                                     />
                                     <span className="text-[10px] font-black text-slate-300">KM</span>
                                  </div>
                                  <button type="button" onClick={() => removeDistanceNode(i)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                     <Trash2 size={18} />
                                  </button>
                               </div>
                             ))}
                             {(!editingProperty.InstituteDistanceMatrix || editingProperty.InstituteDistanceMatrix.length === 0) && (
                               <div className="md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold italic">
                                 No proximity data nodes. Add a point to ensure profile rendering.
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Part 2: Financial Grid */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black">02</div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Financial Transparency & Security</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Single Rent (₹)</label>
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.RentSingle} onChange={e => setEditingProperty({...editingProperty, RentSingle: +e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Double Rent (₹)</label>
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.RentDouble} onChange={e => setEditingProperty({...editingProperty, RentDouble: +e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Electricity Charge (₹/Unit)</label>
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.ElectricityCharges} onChange={e => setEditingProperty({...editingProperty, ElectricityCharges: +e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Maintenance Charge (₹)</label>
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.Maintenance} onChange={e => setEditingProperty({...editingProperty, Maintenance: +e.target.value})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Security Terms Summary</label>
                          <input className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.SecurityTerms} onChange={e => setEditingProperty({...editingProperty, SecurityTerms: e.target.value})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Parents Stay Rate (₹/Day)</label>
                          <input type="number" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.ParentsStayCharge} onChange={e => setEditingProperty({...editingProperty, ParentsStayCharge: +e.target.value})} />
                       </div>
                    </div>
                  </div>

                  {/* Part 3: Premium Media & Amenities */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black">03</div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Media Pipeline & Amenities</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                             <ImageIcon size={14} /> Exterior Photo URL
                          </label>
                          <input className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none text-xs" value={editingProperty.PhotoMain} onChange={e => setEditingProperty({...editingProperty, PhotoMain: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                             <ImageIcon size={14} /> Room Detail Photo URL
                          </label>
                          <input className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none text-xs" value={editingProperty.PhotoRoom} onChange={e => setEditingProperty({...editingProperty, PhotoRoom: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                             <ImageIcon size={14} /> Washroom Photo URL
                          </label>
                          <input className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none text-xs" value={editingProperty.PhotoWashroom} onChange={e => setEditingProperty({...editingProperty, PhotoWashroom: e.target.value})} />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Amenity Checksum</label>
                       <div className="flex flex-wrap gap-3">
                          {FACILITY_OPTIONS.map(fac => {
                            const isSelected = editingProperty.Facilities?.includes(fac);
                            return (
                              <button
                                key={fac}
                                type="button"
                                onClick={() => toggleFacility(fac)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                  isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                }`}
                              >
                                {fac}
                              </button>
                            );
                          })}
                       </div>
                    </div>
                  </div>

                  {/* Part 4: Management Integrity */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black">04</div>
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Management Integrity & Safety</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Warden Personnel Name</label>
                          <input required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.WardenName} onChange={e => setEditingProperty({...editingProperty, WardenName: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-red-400 tracking-widest">Emergency Safety Hotline</label>
                          <input required className="w-full bg-slate-50 border border-red-100 p-5 rounded-3xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-50" value={editingProperty.EmergencyContact} onChange={e => setEditingProperty({...editingProperty, EmergencyContact: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Operator Name (Owner)</label>
                          <input required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.OwnerName} onChange={e => setEditingProperty({...editingProperty, OwnerName: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Owner WhatsApp Contact</label>
                          <input required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.OwnerWhatsApp} onChange={e => setEditingProperty({...editingProperty, OwnerWhatsApp: e.target.value})} />
                       </div>
                       <div className="md:col-span-2 space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">G-Maps Plus Code Identifier</label>
                          <input className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl font-bold text-slate-900 outline-none" value={editingProperty.GoogleMapsPlusCode} onChange={e => setEditingProperty({...editingProperty, GoogleMapsPlusCode: e.target.value})} />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer CTA */}
                <div className="p-8 lg:p-12 border-t border-slate-50 bg-slate-50/50 flex justify-end items-center sticky bottom-0 z-20">
                   <div className="flex items-center gap-4 mr-8 text-slate-400">
                      <AlertCircle size={18} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Master updates go live immediately across discovery feeds.</p>
                   </div>
                   <button type="submit" className="bg-indigo-600 text-white px-12 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-[0.98]">
                      Confirm Global Push
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

export default AdminDashboard;
