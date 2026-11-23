import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, TrendingUp, BarChart3,
  Trash2, UserCheck,
  MessageCircle, Phone, Calendar, User,
  Edit3, AlertTriangle, Wallet, ExternalLink,
  ShieldAlert, FileText, Upload, CheckCircle2, XCircle, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertyContext';
import { ApprovalStatus, Property, VerificationDoc, UserRole, Lead } from '../types';
import { transformDriveUrl } from '../utils/urlHelper';
import { getPropertyPath } from '../utils/slug';
import OptimizedImage from '../components/OptimizedImage';
import { fetchLeads, fetchOwnerProperties, updateUser } from '../db';

const PropertyFormModal = React.lazy(() => import('../components/PropertyFormModal'));
const BulkUploadModal = React.lazy(() => import('../components/BulkUploadModal'));

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addProperty, bulkAddProperties, updateProperty, deleteProperty } = useProperties();
  const [searchParams] = useSearchParams();
  const [isAdding, setIsAdding] = useState(searchParams.get('action') === 'add');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'leads' | 'verification'>('portfolio');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ownerProperties, setOwnerProperties] = useState<Property[]>([]);
  const [isPropsLoading, setIsPropsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verificationDocs, setVerificationDocs] = useState<VerificationDoc[]>(user?.verificationDocs || []);

  useEffect(() => {
    setVerificationDocs(user?.verificationDocs || []);
  }, [user?.verificationDocs]);

  const loadPortfolio = useCallback(async () => {
    if (!user) return;
    setIsPropsLoading(true);
    try {
      const props = await fetchOwnerProperties(user.id);
      setOwnerProperties(props);
    } finally {
      setIsPropsLoading(false);
    }
  }, [user]);

  const loadLeads = useCallback(async () => {
    if (!user) return;
    setIsLeadsLoading(true);
    try {
      const fetched = await fetchLeads(user.id, user.role);
      setLeads(fetched);
    } finally {
      setIsLeadsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    if (activeTab === 'leads' && leads.length === 0) {
      loadLeads();
    }
  }, [activeTab, leads.length, loadLeads]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([loadPortfolio(), loadLeads()]);
    setIsRefreshing(false);
  };

  const myLeads = useMemo(() => {
    if (user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin) return leads;
    const propertyIds = new Set(ownerProperties.map(p => p.id));
    return leads.filter(l => propertyIds.has(l.propertyId));
  }, [leads, ownerProperties, user]);

  const portfolioStats = useMemo(() => {
    const getFirstRent = (p: Property) =>
      Array.isArray(p.RentDouble) && p.RentDouble.length > 0
        ? p.RentDouble[0]
        : Array.isArray(p.RentSingle) && p.RentSingle.length > 0
          ? p.RentSingle[0]
          : 0;
    const totalRent = ownerProperties.reduce((acc, p) => acc + getFirstRent(p), 0);
    return {
      totalRent,
      avgRent: ownerProperties.length ? Math.round(totalRent / ownerProperties.length) : 0,
      totalLeads: myLeads.length,
      totalViews: ownerProperties.reduce((acc, p) => acc + (p.views || 0), 0)
    };
  }, [ownerProperties, myLeads]);

  if (!user) return null;

  const handleFormSubmit = async (property: Property) => {
    if (editingProperty) {
      await updateProperty(editingProperty.id, property);
      setOwnerProperties(prev => prev.map(p => (p.id === editingProperty.id ? { ...p, ...property } : p)));
    } else {
      await addProperty(property);
      setOwnerProperties(prev => [...prev.filter(p => p.id !== property.id), property]);
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
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={10} /> Verified Host
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Management, {user.username.split(' ')[0]}
                </h1>
              </div>
            </div>
            <p className="text-slate-500 font-bold max-w-xl leading-relaxed text-sm">
              Manage your verified hostels, PGs, and flats listed on eRooms.in Kota. All student enquiries are coordinated by the eRooms team.
            </p>
          </div>

          <div className="flex flex-col items-end gap-4 w-full md:w-auto">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Portfolio'}
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full md:w-auto">
              {[
                { label: 'Properties', val: ownerProperties.length, icon: Building2, color: 'text-blue-600', bg: 'bg-white' },
                { label: 'Logged Leads', val: portfolioStats.totalLeads, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-white' },
                { label: 'Approved', val: ownerProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-white' }
              ].map((s, i) => (
                <div key={i} className={`${s.bg} border border-slate-100 p-8 rounded-[40px] shadow-sm min-w-[180px] group hover:shadow-xl transition-all`}>
                  <s.icon size={20} className={`${s.color} mb-3 group-hover:scale-125 transition-transform`} />
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-8 border-b border-slate-100 mb-12 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
              activeTab === 'portfolio' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            Portfolio Management
            {activeTab === 'portfolio' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
              activeTab === 'leads' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            Inquiry Leads
            <span className="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[9px]">{myLeads.length}</span>
            {activeTab === 'leads' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
              activeTab === 'verification' ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            Verification Audit
            {activeTab === 'verification' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        </div>

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-12">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Portfolio Registry</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Manage your property listings and room tariffs.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsBulkUploading(true)}
                    className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} /> Bulk Upload
                  </button>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <Plus size={18} /> New Registration
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[48px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <th className="px-10 py-7">Asset Profile</th>
                        <th className="px-10 py-7">Area</th>
                        <th className="px-10 py-7">Audit State</th>
                        <th className="px-10 py-7 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isPropsLoading ? (
                        <tr>
                          <td colSpan={4} className="px-10 py-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                            Loading properties...
                          </td>
                        </tr>
                      ) : ownerProperties.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-[20px] overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                                <OptimizedImage src={transformDriveUrl(p.PhotoMain, 400)} className="w-full h-full" alt={p.ListingName} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-lg tracking-tight leading-none mb-2">{p.ListingName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.ListingType} • {p.Gender}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-[13px] font-bold text-slate-500">{p.Area.split(' (')[0]}</td>
                          <td className="px-10 py-8">
                            <span
                              className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                p.ApprovalStatus === ApprovalStatus.Approved
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : p.ApprovalStatus === ApprovalStatus.Rejected
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  p.ApprovalStatus === ApprovalStatus.Approved
                                    ? 'bg-emerald-500'
                                    : p.ApprovalStatus === ApprovalStatus.Rejected
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500 animate-pulse'
                                }`}
                              />
                              {p.ApprovalStatus}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                to={getPropertyPath(p)}
                                className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                              >
                                <ExternalLink size={14} /> View
                              </Link>
                              <button
                                onClick={() => handleEdit(p)}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                              >
                                <Edit3 size={14} /> Edit
                              </button>
                              <button
                                onClick={() => setDeletingId(p.id)}
                                className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Delete Property"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!isPropsLoading && ownerProperties.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-10 py-24 text-center">
                            <Building2 size={56} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Registry Empty. Register your first property.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <section className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <TrendingUp size={120} />
                </div>
                <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em] mb-10">Tariff Summary</h3>
                <div className="mb-10">
                  <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">Combined Base Rent</p>
                  <p className="text-5xl font-black tracking-tighter">
                    ₹{(portfolioStats.totalRent || 0).toLocaleString()}
                    <span className="text-lg font-bold text-white/20 ml-1">/mo</span>
                  </p>
                </div>
                <div className="p-6 bg-white/5 rounded-[28px] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Average Rent</p>
                    <p className="text-2xl font-black">₹{(portfolioStats.avgRent || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Wallet size={22} />
                  </div>
                </div>
              </section>

              <section className="bg-white border border-slate-200 p-10 rounded-[48px] shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tighter flex items-center gap-3">
                  <BarChart3 size={20} className="text-blue-600" /> Activity Summary
                </h3>
                <div className="space-y-8">
                  {[
                    { label: 'Scholar Leads', val: portfolioStats.totalLeads, color: 'bg-blue-600', max: Math.max(portfolioStats.totalLeads * 1.5, 10) },
                    { label: 'Logged Views', val: portfolioStats.totalViews, color: 'bg-emerald-500', max: Math.max(portfolioStats.totalViews * 1.5, 100) }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className="text-slate-900">{stat.val}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stat.val / stat.max) * 100)}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full ${stat.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'New Leads', val: myLeads.filter(l => l.status === 'New').length, icon: AlertTriangle, color: 'text-amber-600' },
                { label: 'WhatsApp', val: myLeads.filter(l => l.type === 'WhatsApp').length, icon: MessageCircle, color: 'text-emerald-600' },
                { label: 'Call Logs', val: myLeads.filter(l => l.type === 'Call').length, icon: Phone, color: 'text-blue-600' },
                { label: 'Visit Requests', val: myLeads.filter(l => l.type === 'VisitRequest').length, icon: Calendar, color: 'text-blue-700' }
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                  <s.icon size={20} className={`${s.color} mb-4`} />
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-[48px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      <th className="px-10 py-7">Scholar Identity</th>
                      <th className="px-10 py-7">Target Property</th>
                      <th className="px-10 py-7">Type</th>
                      <th className="px-10 py-7">Timestamp</th>
                      <th className="px-10 py-7 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLeadsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-24 text-center">
                          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Loading Leads...</p>
                        </td>
                      </tr>
                    ) : myLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base">{lead.studentName}</p>
                              <p className="text-xs font-bold text-slate-400">{lead.studentPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 font-bold text-slate-700">{lead.propertyName}</td>
                        <td className="px-10 py-8">
                          <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700">
                            {lead.type}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-xs font-bold text-slate-400">
                          {new Date(lead.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <a
                            href={`https://wa.me/91${lead.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.studentName}, regarding ${lead.propertyName} on eRooms.in.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all inline-block"
                          >
                            Contact
                          </a>
                        </td>
                      </tr>
                    ))}
                    {!isLeadsLoading && myLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-10 py-24 text-center">
                          <MessageCircle size={56} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">No direct leads stored here. Student enquiries route to eRooms team.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-slate-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12">
                <ShieldAlert size={200} />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-4">Host Verification Protocol</h2>
                <p className="text-white/70 font-bold text-base leading-relaxed max-w-2xl">
                  All property partners verify their identity before listings appear live on eRooms.in. Upload your Aadhar Card and GST (if applicable).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(['Aadhar', 'GST'] as const).map(type => {
                const docItem = verificationDocs.find(d => d.type === type);
                return (
                  <div key={type} className="bg-white border border-slate-100 p-10 rounded-[40px] shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                        <FileText size={26} />
                      </div>
                      {docItem ? (
                        <span
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            docItem.status === ApprovalStatus.Approved
                              ? 'bg-emerald-50 text-emerald-700'
                              : docItem.status === ApprovalStatus.Rejected
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {docItem.status === ApprovalStatus.Approved ? (
                            <CheckCircle2 size={12} />
                          ) : docItem.status === ApprovalStatus.Rejected ? (
                            <XCircle size={12} />
                          ) : (
                            <AlertTriangle size={12} />
                          )}
                          {docItem.status}
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-400">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{type} Document</h3>
                    <p className="text-xs font-bold text-slate-400 mb-10">
                      {type === 'Aadhar' ? 'Government issued identity proof.' : 'Business registration certificate.'}
                    </p>

                    {docItem?.status === ApprovalStatus.Rejected && (
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-8">
                        <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1">Rejection Reason</p>
                        <p className="text-xs font-bold text-rose-700">{docItem.rejectionReason}</p>
                      </div>
                    )}

                    <div className="mt-auto">
                      {docItem ? (
                        <a
                          href={docItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-center block"
                        >
                          View Uploaded Asset
                        </a>
                      ) : (
                        <button
                          onClick={async () => {
                            const url = window.prompt(`Enter ${type} Document URL (PDF/Image):`);
                            if (url) {
                              const newDoc: VerificationDoc = {
                                id: `doc-${Date.now()}`,
                                type,
                                url,
                                status: ApprovalStatus.Pending,
                                uploadedAt: new Date().toISOString()
                              };
                              const updatedDocs = [...verificationDocs, newDoc];
                              await updateUser(user.id, { verificationDocs: updatedDocs });
                              setVerificationDocs(updatedDocs);
                            }
                          }}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                          <Upload size={14} /> Upload Document
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {isBulkUploading && (
          <BulkUploadModal
            isOpen={isBulkUploading}
            onClose={() => setIsBulkUploading(false)}
            onUpload={async (newProperties) => {
              const withIds = newProperties.map((p, idx) => ({
                ...p,
                id: `owner-${Date.now()}-${idx}`,
                ownerId: user.id,
                ApprovalStatus: ApprovalStatus.Pending
              })) as Property[];
              await bulkAddProperties(withIds);
              await loadPortfolio();
              setIsBulkUploading(false);
            }}
          />
        )}

        {isAdding && (
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
        )}
      </Suspense>

      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Remove Property?</h3>
              <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">
                This permanently removes the property listing from eRooms.in Kota. This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deletingId) {
                      await deleteProperty(deletingId);
                      setOwnerProperties(prev => prev.filter(p => p.id !== deletingId));
                      setDeletingId(null);
                    }
                  }}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerDashboard;
