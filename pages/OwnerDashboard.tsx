import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Plus, TrendingUp, BarChart3, 
  Trash2, UserCheck,
  MessageCircle, Phone, Calendar, User,
  Edit3, AlertTriangle, Wallet, ExternalLink,
  ShieldAlert, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertyContext';
import { ApprovalStatus, Property } from '../types';
import { fetchLeads } from '../db';
import PropertyFormModal from '../components/PropertyFormModal';
import BulkUploadModal from '../components/BulkUploadModal';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties, addProperty, updateProperty, deleteProperty } = useProperties();
  const [searchParams] = useSearchParams();
  const [isAdding, setIsAdding] = useState(searchParams.get('action') === 'add');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'leads'>('portfolio');

  const myProperties = useMemo(() => 
    properties.filter(p => p.ownerId === user?.id),
    [properties, user]
  );

  const leads = useMemo(() => {
    const allLeads = fetchLeads();
    // Filter leads for properties owned by this user
    return allLeads.filter(l => myProperties.some(p => p.id === l.propertyId));
  }, [myProperties]);

  const portfolioStats = useMemo(() => ({
    totalRent: myProperties.reduce((acc, p) => acc + p.RentDouble, 0),
    avgRent: myProperties.length ? Math.round(myProperties.reduce((acc, p) => acc + p.RentDouble, 0) / myProperties.length) : 0,
    totalLeads: leads.length,
    totalViews: myProperties.reduce((acc, p) => acc + (p.views || 0), 0)
  }), [myProperties, leads]);

  if (!user) return null;

  const handleFormSubmit = (property: Property) => {
    if (editingProperty) {
      updateProperty(editingProperty.id, property);
    } else {
      addProperty(property);
    }
    setIsAdding(false);
    setEditingProperty(null);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setIsAdding(true);
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingProperty(null);
  };

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
                { label: 'Total Leads', val: portfolioStats.totalLeads, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-white' },
                { label: 'Total Views', val: portfolioStats.totalViews, icon: BarChart3, color: 'text-blue-600', bg: 'bg-white' },
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-8 border-b border-slate-100 mb-12">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'portfolio' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
          >
            Portfolio Management
            {activeTab === 'portfolio' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('leads')}
            className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'leads' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
          >
            Inquiry Leads
            <span className="ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px]">{leads.length}</span>
            {activeTab === 'leads' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-full" />}
          </button>
        </div>

        {activeTab === 'portfolio' ? (
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
                             <div className="flex items-center justify-end gap-3">
                                <Link 
                                  to={`/property/${p.id}`}
                                  className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                  title="View Profile"
                                >
                                  <ExternalLink size={14} /> View
                                </Link>
                                <button 
                                  onClick={() => handleEdit(p)}
                                  className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                  title="Edit Specifications & Photos"
                                >
                                  <Edit3 size={14} /> Edit Details
                                </button>
                                <button 
                                  onClick={() => deleteProperty(p.id)} 
                                  className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                  title="Delete Property"
                                >
                                  <Trash2 size={16} />
                                </button>
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
                      { label: 'Scholar Leads', val: portfolioStats.totalLeads, color: 'bg-indigo-600', max: Math.max(portfolioStats.totalLeads * 1.5, 10) },
                      { label: 'Discovery Views', val: portfolioStats.totalViews, color: 'bg-blue-500', max: Math.max(portfolioStats.totalViews * 1.5, 100) },
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
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'New Leads', val: leads.filter(l => l.status === 'New').length, icon: AlertTriangle, color: 'text-amber-600' },
                { label: 'WhatsApp', val: leads.filter(l => l.type === 'WhatsApp').length, icon: MessageCircle, color: 'text-emerald-600' },
                { label: 'Call Logs', val: leads.filter(l => l.type === 'Call').length, icon: Phone, color: 'text-blue-600' },
                { label: 'Visit Requests', val: leads.filter(l => l.type === 'VisitRequest').length, icon: Calendar, color: 'text-indigo-600' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                   <s.icon size={20} className={`${s.color} mb-4`} />
                   <p className="text-4xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-[56px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      <th className="px-12 py-8">Scholar Identity</th>
                      <th className="px-12 py-8">Target Asset</th>
                      <th className="px-12 py-8">Signal Type</th>
                      <th className="px-12 py-8">Timestamp</th>
                      <th className="px-12 py-8 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-12 py-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{lead.studentName}</p>
                              <p className="text-xs font-bold text-slate-400">{lead.studentPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-10">
                          <p className="font-bold text-slate-700">{lead.propertyName}</p>
                        </td>
                        <td className="px-12 py-10">
                          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                            lead.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700' : 
                            lead.type === 'Call' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {lead.type === 'WhatsApp' && <MessageCircle size={12} />}
                            {lead.type === 'Call' && <Phone size={12} />}
                            {lead.type === 'VisitRequest' && <Calendar size={12} />}
                            {lead.type}
                          </span>
                        </td>
                        <td className="px-12 py-10 text-[13px] font-bold text-slate-400">
                          {new Date(lead.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-12 py-10 text-right">
                          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
                            Mark Contacted
                          </button>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-12 py-32 text-center">
                          <MessageCircle size={60} className="mx-auto text-slate-100 mb-6" />
                          <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">No leads captured yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asset Registry Modal Test */}
      <BulkUploadModal 
        isOpen={isBulkUploading}
        onClose={() => setIsBulkUploading(false)}
        onUpload={(newProperties) => {
          newProperties.forEach(p => addProperty({ ...p, ownerId: user.id }));
          setIsBulkUploading(false);
        }}
      />

      <PropertyFormModal 
        key={editingProperty ? `edit-${editingProperty.id}` : 'add'}
        isOpen={isAdding}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingProperty || undefined}
        ownerId={user.id}
        ownerName={user.username}
        ownerEmail={user.email}
        ownerPhone={user.phone}
      />
    </div>
  );
};

export default OwnerDashboard;
