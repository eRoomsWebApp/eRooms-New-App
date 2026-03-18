import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalStatus, UserRole, User, UserStatus, AppConfig, Property, Lead, ActivityLog } from '../types';
import { subscribeToLeads, saveAppConfig, subscribeToUsers, updateUser, deleteUser, subscribeToActivityLogs, updateLead } from '../db';
import { useConfig } from '../context/ConfigContext';
import { transformDriveUrl } from '../utils/urlHelper';
import OptimizedImage from '../components/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, X, 
  Building2, Plus, Trash2, Search,
  Users, Activity, Globe, Database,
  UserPlus, Zap, Server,
  MapPin, MessageCircle, Phone, Calendar,
  Sparkles, ShieldCheck, GraduationCap, Briefcase,
  MousePointer2, Timer, Target, Layers,
  Cpu, Terminal, Command,
  Edit3, Focus, FileSpreadsheet, TrendingUp,
  AlertTriangle, AlertCircle, FileCheck, Star, ArrowUp
} from 'lucide-react';
import PropertyFormModal from '../components/PropertyFormModal';
import BulkUploadModal from '../components/BulkUploadModal';
import BulkPriceUpdateModal from '../components/BulkPriceUpdateModal';

const TableSkeleton = () => (
  <div className="space-y-4 p-8">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-slate-50 rounded w-1/3 animate-pulse" />
        </div>
        <div className="w-24 h-8 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    ))}
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties, addProperty, bulkAddProperties, approveProperty, updateProperty, deleteProperty, bulkUpdatePrices, loading: propertiesLoading } = useProperties();
  const { config } = useConfig();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'leads' | 'config' | 'logs' | 'docs'>(
    searchParams.get('action') === 'add' ? 'listings' : 'overview'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAdding, setIsAdding] = useState(searchParams.get('action') === 'add');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isBulkPriceUpdating, setIsBulkPriceUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  useEffect(() => {
    if (!user) return;

    const unsubscribeUsers = subscribeToUsers((newUsers) => {
      setRegisteredUsers(newUsers);
      setLoadingUsers(false);
    });

    const unsubscribeLeads = subscribeToLeads(user.id, user.role, (newLeads) => {
      setLeads(newLeads);
      setIsLeadsLoading(false);
    });

    const unsubscribeLogs = subscribeToActivityLogs((newLogs) => {
      setActivityLogs(newLogs);
      setLoadingLogs(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLeads();
      unsubscribeLogs();
    };
  }, [user]);

  const handleUpdateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return;
    setIsSyncing(true);
    const newConfig = { ...config, ...updates };
    await saveAppConfig(newConfig);
    
    setIsSyncing(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const stats = useMemo(() => ({
    totalListings: properties.length,
    pendingListings: properties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    totalUsers: registeredUsers.length,
    activeNodes: registeredUsers.filter(u => u.status !== UserStatus.Suspended).length,
    owners: registeredUsers.filter(u => u.role === UserRole.Owner).length,
    scholars: registeredUsers.filter(u => u.role === UserRole.Student).length,
    approvalRate: properties.length > 0 ? ((properties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length / properties.length) * 100).toFixed(0) : 0
  }), [properties, registeredUsers]);

  const systemLogs = useMemo(() => {
    return activityLogs.map(log => ({
      id: log.id,
      event: log.action,
      detail: log.target || 'System protocol',
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: log.importance === 'high' ? AlertCircle : (log.importance === 'medium' ? Target : Activity),
      color: log.importance === 'high' ? 'text-rose-500' : (log.importance === 'medium' ? 'text-amber-500' : 'text-indigo-500')
    }));
  }, [activityLogs]);

  if (!config) return null;

  const filteredListings = properties
    .filter(p => 
      p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Area.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // First sort by isFeatured
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      // Then by priorityScore
      const scoreA = a.priorityScore || 0;
      const scoreB = b.priorityScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Finally by name
      return a.ListingName.localeCompare(b.ListingName);
    });

  const filteredUsers = registeredUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(l => 
    l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.studentPhone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportLeads = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = ['ID', 'Student Name', 'Phone', 'Property', 'Type', 'Status', 'Timestamp'];
    const rows = filteredLeads.map(l => [
      l.id,
      l.studentName,
      l.studentPhone,
      l.propertyName,
      l.type,
      l.status,
      new Date(l.timestamp).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `erooms_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navItems = [
    { id: 'overview', label: 'Command Hub', icon: Command },
    { id: 'listings', label: 'Asset Registry', icon: Building2 },
    { id: 'users', label: 'Node Directory', icon: Users },
    { id: 'docs', label: 'Document Audit', icon: FileCheck },
    { id: 'leads', label: 'Inquiry Stream', icon: MessageCircle },
    { id: 'config', label: 'Kernel Control', icon: Cpu },
    { id: 'logs', label: 'Audit Trail', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      
      {/* 1. Super Admin Command Sidebar */}
      <aside className="w-full lg:w-80 bg-slate-900 border-r border-white/5 p-6 lg:p-10 flex lg:flex-col sticky top-20 z-40 lg:h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
        <div className="hidden lg:flex items-center gap-4 mb-16">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-500/20">
            <Shield size={24} />
          </div>
          <div>
            <p className="font-black text-white text-lg tracking-tighter uppercase leading-none">Kernel</p>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
              {user?.role === UserRole.SuperAdmin ? 'Super Admin' : 'Admin'} v2.1
            </p>
          </div>
        </div>

        <div className="hidden lg:block mb-10 px-4 py-6 bg-white/5 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
              <OptimizedImage src={user?.avatar || ''} className="w-full h-full" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate">{user?.username}</p>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all whitespace-nowrap group ${
                activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-2xl' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-600' : 'text-white/20 group-hover:text-white'} />
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 hidden lg:block border-t border-white/5">
           <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Platform Node</p>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <p className="text-xs font-black text-white uppercase tracking-widest">Connected & Synced</p>
              </div>
           </div>
        </div>
      </aside>

      {/* 2. Command Workspace */}
      <main className="flex-grow p-6 lg:p-16 overflow-x-hidden pb-40 lg:pb-16">
        
        {/* Workspace Header Narrative */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-10">
          <div>
            <h1 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase mb-2">
              {activeTab} Module
            </h1>
            <div className="flex items-center gap-3">
               <span className="text-slate-400 font-bold text-sm">Last Synced: <span className="text-slate-900 font-black">{lastSaved}</span></span>
               <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
               <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">State Locked</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <AnimatePresence>
               {isSyncing && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl border border-indigo-100">
                    <Database size={16} className="animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pushing Local State...</span>
                 </motion.div>
               )}
            </AnimatePresence>
            
            {activeTab === 'leads' && (
              <button 
                onClick={handleExportLeads}
                className="flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                <FileSpreadsheet size={18} />
                Export CSV
              </button>
            )}

            <div className="relative group w-full md:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[28px] outline-none focus:ring-4 focus:ring-indigo-50 w-full md:w-80 lg:w-[400px] font-bold text-slate-900 shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* OVERVIEW MODULE */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
               {/* High-Level Pulse */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Asset Nodes', val: stats.totalListings, trend: '+12%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Directory', val: stats.totalUsers, trend: '+4 today', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Kernel Health', val: '100%', trend: 'OPTIMAL', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Audit Queue', val: stats.pendingListings, trend: 'ACTION REQ', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                       <div className={`w-2 h-12 absolute left-0 top-1/2 -translate-y-1/2 ${stat.bg.replace('bg-', 'bg-')}`}></div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                       <p className="text-6xl font-black text-slate-900 tracking-tighter mb-4">{stat.val}</p>
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.trend}</span>
                       </div>
                    </div>
                  ))}
               </div>

               {/* Growth Vectors */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-slate-900 text-white rounded-[56px] p-12 lg:p-16 shadow-2xl relative overflow-hidden">
                     <Globe className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                           <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Platform Narrative</h3>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                              <div>
                                 <p className="text-5xl font-black text-indigo-400">{stats.scholars}</p>
                                 <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Scholars</p>
                              </div>
                              <div>
                                 <p className="text-5xl font-black text-indigo-400">{stats.owners}</p>
                                 <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Hosts</p>
                              </div>
                              <div>
                                 <p className="text-5xl font-black text-indigo-400">12</p>
                                 <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Clusters</p>
                              </div>
                              <div>
                                 <p className="text-5xl font-black text-indigo-400">{stats.approvalRate}%</p>
                                 <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Verified</p>
                              </div>
                           </div>
                        </div>
                        <div className="mt-16 flex items-center gap-6">
                           <button onClick={() => setActiveTab('listings')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Audit Assets</button>
                           <button onClick={() => setActiveTab('config')} className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">Platform Settings</button>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[56px] p-12 shadow-sm flex flex-col">
                     <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <Activity size={20} className="text-indigo-600" /> Pulse Stream
                     </h3>
                     <div className="space-y-8 flex-grow">
                        {systemLogs.slice(0, 3).map(log => (
                           <div key={log.id} className="flex gap-4">
                              <div className={`mt-1 ${log.color}`}><log.icon size={18} /></div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-900 uppercase">{log.event}</p>
                                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">{log.detail}</p>
                                 <p className="text-[9px] font-black text-slate-200 mt-2">{log.time}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* ASSET REGISTRY (Listings) */}
          {activeTab === 'listings' && (
            <div key="listings" className="space-y-8">
               <div className="flex justify-between items-center">
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Asset Registry</h2>
                     <p className="text-sm font-bold text-slate-400 mt-1">Global management of all property nodes.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsBulkPriceUpdating(true)}
                      className="bg-white border-2 border-slate-200 text-indigo-600 px-8 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-4"
                    >
                       <TrendingUp size={18} /> Price Shift
                    </button>
                    <button 
                      onClick={() => setIsBulkUploading(true)}
                      className="bg-white border-2 border-slate-200 text-slate-600 px-8 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-4"
                    >
                       <FileSpreadsheet size={18} /> Bulk Upload
                    </button>
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="bg-slate-900 text-white px-10 py-5 rounded-[22px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-4"
                    >
                       <Plus size={18} /> New Registration
                    </button>
                  </div>
               </div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
               {propertiesLoading ? (
                 <TableSkeleton />
               ) : (
                 <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-12 py-8">Asset Narrative</th>
                        <th className="px-12 py-8">Owner</th>
                        <th className="px-12 py-8">Cluster</th>
                        <th className="px-12 py-8">Monthly Value</th>
                        <th className="px-12 py-8">Priority</th>
                        <th className="px-12 py-8">Audit Status</th>
                        <th className="px-12 py-8 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredListings.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-20 rounded-3xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <OptimizedImage src={transformDriveUrl(p.PhotoMain)} className="w-full h-full" alt="" />
                              </div>
                              <div>
                                <p className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                  {p.ListingName}
                                  {p.ValidationIssues && p.ValidationIssues.length > 0 && (
                                    <span className="text-rose-500" title={`${p.ValidationIssues.length} issues found`}>
                                      <AlertTriangle size={16} />
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.ListingType} • {p.Gender}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-10">
                            <p className="text-sm font-bold text-slate-900">{p.OwnerName || 'Unknown'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {p.ownerId?.slice(0, 8)}...</p>
                          </td>
                          <td className="px-12 py-10 text-sm font-bold text-slate-600">{p.Area}</td>
                          <td className="px-12 py-10">
                            <p className="text-lg font-black text-slate-900">₹{(Array.isArray(p.RentDouble) ? p.RentDouble[0] : p.RentDouble || 0).toLocaleString()}</p>
                            <p className="text-[10px] font-black text-slate-300 uppercase mt-1">Base Rental</p>
                          </td>
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => updateProperty(p.id, { isFeatured: !p.isFeatured })}
                                className={`p-3 rounded-xl transition-all ${p.isFeatured ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                title={p.isFeatured ? 'Featured' : 'Mark as Featured'}
                              >
                                <Star size={18} fill={p.isFeatured ? 'currentColor' : 'none'} />
                              </button>
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                <ArrowUp size={14} className="text-indigo-500" />
                                <input 
                                  type="number" 
                                  value={p.priorityScore || 0}
                                  onChange={(e) => updateProperty(p.id, { priorityScore: parseInt(e.target.value) || 0 })}
                                  className="w-12 bg-transparent font-black text-xs outline-none"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-10">
                            <div className="flex flex-col gap-2">
                              <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3 ${
                                p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                <div className={`w-2 h-2 rounded-full ${p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                {p.ApprovalStatus}
                              </span>
                              {p.ValidationIssues && p.ValidationIssues.length > 0 && (
                                <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 flex items-center gap-2">
                                  <AlertCircle size={12} />
                                  Issues Detected
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-12 py-10 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {p.ApprovalStatus === ApprovalStatus.Pending && (
                                <button 
                                  onClick={() => approveProperty(p.id)} 
                                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                                >
                                  Verify
                                </button>
                              )}
                              <button 
                                onClick={() => setEditingProperty(p)}
                                className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                title="Edit Listing"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => setDeletingId(p.id)} 
                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                title="Delete Listing"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
               )}
            </motion.div>
            </div>
          )}

          {/* NODE DIRECTORY (Users) */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
               {loadingUsers ? (
                 <TableSkeleton />
               ) : (
                 <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-12 py-8">Global Identifier</th>
                        <th className="px-12 py-8">Role Registry</th>
                        <th className="px-12 py-8">Compliance</th>
                        <th className="px-12 py-8">Account Activation</th>
                        <th className="px-12 py-8 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id || u.email} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-slate-100 rounded-[24px] overflow-hidden border border-slate-100 flex-shrink-0">
                                 <OptimizedImage src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-full h-full" />
                              </div>
                              <div>
                                <p className="text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                                  {u.username}
                                  {u.isVerified && (
                                    <span className="text-indigo-600" title="Verified Node">
                                      <ShieldCheck size={16} />
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-10">
                             <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                               u.role === UserRole.SuperAdmin ? 'bg-indigo-600 text-white' : 
                               u.role === UserRole.Admin ? 'bg-slate-900 text-white' : 
                               u.role === UserRole.Owner ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                             }`}>
                               {u.role}
                             </span>
                          </td>
                          <td className="px-12 py-10">
                             <div className="flex items-center gap-3">
                               <div className={`w-2.5 h-2.5 rounded-full ${u.status === UserStatus.Suspended ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                               <span className="text-[10px] font-black uppercase text-slate-700">{u.status || 'Active Protocol'}</span>
                             </div>
                          </td>
                          <td className="px-12 py-10 text-sm font-bold text-slate-500">
                             {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-12 py-10 text-right">
                             <button onClick={() => setSelectedUser(u)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Audit Dossier</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                 </div>
               )}
            </motion.div>
          )}

          {/* INQUIRY STREAM (Leads) */}
          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
               {isLeadsLoading ? (
                 <TableSkeleton />
               ) : (
                 <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-12 py-8">Scholar Identity</th>
                        <th className="px-12 py-8">Target Asset</th>
                        <th className="px-12 py-8">Signal Type</th>
                        <th className="px-12 py-8">Status</th>
                        <th className="px-12 py-8 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users size={20} />
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
                          <td className="px-12 py-10">
                            <select 
                              value={lead.status}
                              onChange={(e) => updateLead(lead.id, { status: e.target.value as Lead['status'] })}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border-none cursor-pointer ${
                                lead.status === 'New' ? 'bg-indigo-50 text-indigo-600' :
                                lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="px-12 py-10 text-right">
                             <a 
                              href={`https://wa.me/91${lead.studentPhone.replace(/\D/g, '')}?text=Hi ${lead.studentName}, I'm from erooms.in. You inquired about ${lead.propertyName}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl inline-block"
                            >
                              Contact
                            </a>
                          </td>
                        </tr>
                      ))}
                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-12 py-32 text-center">
                            <MessageCircle size={60} className="mx-auto text-slate-100 mb-6" />
                            <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">No leads matching your search.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                 </div>
               )}
            </motion.div>
          )}

          {/* DOCUMENT AUDIT (Verification Docs) */}
          {activeTab === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
               {loadingUsers ? (
                 <TableSkeleton />
               ) : (
                 <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-12 py-8">Owner Identity</th>
                        <th className="px-12 py-8">Document Type</th>
                        <th className="px-12 py-8">Submission Date</th>
                        <th className="px-12 py-8">Audit Status</th>
                        <th className="px-12 py-8 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {registeredUsers.filter(u => u.role === UserRole.Owner && u.verificationDocs && u.verificationDocs.length > 0).flatMap(u => 
                        (u.verificationDocs || []).map(doc => ({ user: u, doc }))
                      ).sort((a, b) => new Date(b.doc.uploadedAt).getTime() - new Date(a.doc.uploadedAt).getTime()).map(({ user: u, doc }) => (
                        <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                 <OptimizedImage src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-full h-full" />
                              </div>
                              <div>
                                <p className="text-lg font-black text-slate-900 leading-tight">{u.username}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-10">
                             <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                               {doc.type}
                             </span>
                          </td>
                          <td className="px-12 py-10 text-sm font-bold text-slate-500">
                             {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-12 py-10">
                             <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3 ${
                               doc.status === ApprovalStatus.Approved ? 'bg-emerald-50 text-emerald-700' : 
                               doc.status === ApprovalStatus.Rejected ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                             }`}>
                               <div className={`w-2 h-2 rounded-full ${
                                 doc.status === ApprovalStatus.Approved ? 'bg-emerald-500' : 
                                 doc.status === ApprovalStatus.Rejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                               }`}></div>
                               {doc.status}
                             </span>
                          </td>
                          <td className="px-12 py-10 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                  title="View Document"
                                >
                                   <Globe size={16} />
                                </a>
                                {doc.status === ApprovalStatus.Pending && (
                                  <>
                                    <button 
                                      onClick={async () => {
                                        const updatedDocs = (u.verificationDocs || []).map(d => 
                                          d.id === doc.id ? { ...d, status: ApprovalStatus.Approved, reviewedAt: new Date().toISOString() } : d
                                        );
                                        // If all docs are approved, mark user as verified
                                        const allApproved = updatedDocs.every(d => d.status === ApprovalStatus.Approved);
                                        await updateUser(u.id, { verificationDocs: updatedDocs, isVerified: allApproved });
                                      }}
                                      className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        const reason = window.prompt('Enter rejection reason:');
                                        if (reason) {
                                          const updatedDocs = (u.verificationDocs || []).map(d => 
                                            d.id === doc.id ? { ...d, status: ApprovalStatus.Rejected, reviewedAt: new Date().toISOString(), rejectionReason: reason } : d
                                          );
                                          await updateUser(u.id, { verificationDocs: updatedDocs, isVerified: false });
                                        }
                                      }}
                                      className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                      {registeredUsers.filter(u => u.role === UserRole.Owner && u.verificationDocs && u.verificationDocs.length > 0).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-12 py-32 text-center">
                            <FileCheck size={60} className="mx-auto text-slate-100 mb-6" />
                            <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-xs">No documents pending audit.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                 </div>
               )}
            </motion.div>
          )}

          {/* KERNEL CONTROL (Global Config) */}
          {activeTab === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
               {/* Health Switches */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm">
                     <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[24px] flex items-center justify-center shadow-sm">
                           <Server size={24} />
                        </div>
                        <div className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`} onClick={() => handleUpdateConfig({ maintenanceMode: !config.maintenanceMode })}>
                           <motion.div animate={{ x: config.maintenanceMode ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>
                     <h4 className="text-2xl font-black text-slate-900 mb-2">Maintenance Mode</h4>
                     <p className="text-xs font-bold text-slate-400">Lock platform for internal kernel updates.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm">
                     <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center shadow-sm">
                           <UserPlus size={24} />
                        </div>
                        <div className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${config.allowNewRegistrations ? 'bg-emerald-500' : 'bg-slate-200'}`} onClick={() => handleUpdateConfig({ allowNewRegistrations: !config.allowNewRegistrations })}>
                           <motion.div animate={{ x: config.allowNewRegistrations ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>
                     <h4 className="text-2xl font-black text-slate-900 mb-2">Registration Gate</h4>
                     <p className="text-xs font-bold text-slate-400">Control scholar and host onboarding capability.</p>
                  </div>

                  <div className="bg-slate-900 text-white rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
                     <Database className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center">
                           <ShieldCheck size={28} className="text-indigo-400" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black mb-1">State Protected</h4>
                           <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Global Persistence v1.0</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Branding Narrative */}
               <section className="bg-white border border-slate-200 rounded-[56px] p-12 lg:p-16 shadow-sm">
                  <h3 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-6">
                     <Sparkles size={28} className="text-amber-500" /> Branding Archetype
                     <div className="h-px flex-grow bg-slate-100"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Site Designation</label>
                        <input 
                           type="text" 
                           className="w-full px-8 py-5 rounded-[28px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-black text-slate-900"
                           value={config.siteName}
                           onChange={(e) => handleUpdateConfig({ siteName: e.target.value })}
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Global Tagline</label>
                        <input 
                           type="text" 
                           className="w-full px-8 py-5 rounded-[28px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-black text-slate-900"
                           value={config.tagline}
                           onChange={(e) => handleUpdateConfig({ tagline: e.target.value })}
                        />
                     </div>
                     <div className="space-y-4 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Hero Narrative Description</label>
                        <textarea 
                           className="w-full px-8 py-6 rounded-[32px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 h-32"
                           value={config.heroDescription}
                           onChange={(e) => handleUpdateConfig({ heroDescription: e.target.value })}
                        />
                     </div>
                  </div>
               </section>

               {/* Hero Imagery CMS */}
               <section className="bg-white border border-slate-200 rounded-[56px] p-12 lg:p-16 shadow-sm">
                  <h3 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-6">
                     <Building2 size={28} className="text-indigo-500" /> Hero Imagery CMS
                     <div className="h-px flex-grow bg-slate-100"></div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {(config.heroImages || []).map((img, idx) => (
                        <div key={idx} className="relative group rounded-[40px] overflow-hidden aspect-video border border-slate-100 shadow-sm">
                           <OptimizedImage src={img} className="w-full h-full object-cover" alt="" />
                           <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button 
                                onClick={() => {
                                  const newImages = [...(config.heroImages || [])];
                                  newImages.splice(idx, 1);
                                  handleUpdateConfig({ heroImages: newImages });
                                }}
                                className="p-4 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors"
                              >
                                 <Trash2 size={20} />
                              </button>
                           </div>
                        </div>
                     ))}
                     <button 
                       onClick={() => {
                         const url = window.prompt('Enter Hero Image URL:');
                         if (url) {
                           handleUpdateConfig({ heroImages: [...(config.heroImages || []), url] });
                         }
                       }}
                       className="border-4 border-dashed border-slate-100 rounded-[40px] aspect-video flex flex-col items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-100 transition-all group"
                     >
                        <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add Hero Asset</span>
                     </button>
                  </div>
               </section>

               {/* Announcement Stream */}
               <section className="bg-white border border-slate-200 rounded-[56px] p-12 lg:p-16 shadow-sm">
                  <h3 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-6">
                     <Zap size={28} className="text-emerald-500" /> Announcement Stream
                     <div className="h-px flex-grow bg-slate-100"></div>
                  </h3>
                  <div className="space-y-6">
                     {(config.announcements || []).map((ann, idx) => (
                        <div key={ann.id} className="flex items-center gap-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${ann.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                              <Zap size={20} />
                           </div>
                           <div className="flex-grow">
                              <input 
                                type="text"
                                className="w-full bg-transparent border-none outline-none font-bold text-slate-900 mb-1"
                                value={ann.text}
                                onChange={(e) => {
                                  const newAnn = [...(config.announcements || [])];
                                  newAnn[idx].text = e.target.value;
                                  handleUpdateConfig({ announcements: newAnn });
                                }}
                              />
                              <input 
                                type="text"
                                placeholder="Optional Link URL"
                                className="w-full bg-transparent border-none outline-none text-[10px] font-black uppercase text-slate-400 tracking-widest"
                                value={ann.link || ''}
                                onChange={(e) => {
                                  const newAnn = [...(config.announcements || [])];
                                  newAnn[idx].link = e.target.value;
                                  handleUpdateConfig({ announcements: newAnn });
                                }}
                              />
                           </div>
                           <div className="flex items-center gap-4">
                              <div 
                                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${ann.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                onClick={() => {
                                  const newAnn = [...(config.announcements || [])];
                                  newAnn[idx].active = !newAnn[idx].active;
                                  handleUpdateConfig({ announcements: newAnn });
                                }}
                              >
                                 <motion.div animate={{ x: ann.active ? 22 : 4 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                              </div>
                              <button 
                                onClick={() => {
                                  const newAnn = [...(config.announcements || [])];
                                  newAnn.splice(idx, 1);
                                  handleUpdateConfig({ announcements: newAnn });
                                }}
                                className="p-3 text-red-400 hover:text-red-600 transition-colors"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                     ))}
                     <button 
                       onClick={() => {
                         const newAnn = [...(config.announcements || []), { id: `ann-${Date.now()}`, text: 'New Announcement', active: true }];
                         handleUpdateConfig({ announcements: newAnn });
                       }}
                       className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 font-black uppercase tracking-widest text-[11px] hover:border-indigo-500 hover:text-indigo-500 transition-all"
                     >
                        + Initialize New Announcement Node
                     </button>
                  </div>
               </section>

               {/* Footer Narrative */}
               <section className="bg-white border border-slate-200 rounded-[56px] p-12 lg:p-16 shadow-sm">
                  <h3 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-6">
                     <Globe size={28} className="text-slate-900" /> Footer Narrative
                     <div className="h-px flex-grow bg-slate-100"></div>
                  </h3>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Global Footer Text</label>
                     <textarea 
                        className="w-full px-8 py-6 rounded-[32px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 h-32"
                        value={config.footerText}
                        onChange={(e) => handleUpdateConfig({ footerText: e.target.value })}
                     />
                  </div>
               </section>

               {/* Cluster Configuration */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-[48px] p-12 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Cluster Registry</h3>
                        <button onClick={() => {
                           const name = prompt('New Cluster Identity:');
                           if(name) handleUpdateConfig({ areas: [...config.areas, name] });
                        }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"><Plus size={20} /></button>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {config.areas.map(a => (
                          <div key={a} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 group">
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{a.split(' (')[0]}</span>
                             <button onClick={() => handleUpdateConfig({ areas: config.areas.filter(x => x !== a) })} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[48px] p-12 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Facility Matrix</h3>
                        <button onClick={() => {
                           const name = prompt('New Facility Descriptor:');
                           if(name) handleUpdateConfig({ facilities: [...config.facilities, name] });
                        }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"><Plus size={20} /></button>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {config.facilities.map(f => (
                          <div key={f} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 group">
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{f}</span>
                             <button onClick={() => handleUpdateConfig({ facilities: config.facilities.filter(x => x !== f) })} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[48px] p-12 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Coaching Matrix</h3>
                        <button onClick={() => {
                           const name = prompt('New Coaching Institute:');
                           if(name) handleUpdateConfig({ institutes: [...config.institutes, name] });
                        }} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl"><Plus size={20} /></button>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {config.institutes.map(i => (
                          <div key={i} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 group">
                             <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{i}</span>
                             <button onClick={() => handleUpdateConfig({ institutes: config.institutes.filter(x => x !== i) })} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>
               </section>

               {/* Danger Protocol */}
               <section className="bg-red-50 border border-red-100 rounded-[48px] p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                     <h4 className="text-3xl font-black text-red-900 tracking-tighter uppercase mb-2">Factory Reset</h4>
                     <p className="text-red-600/60 font-bold">Wipe platform state and restore initial kernel defaults. <span className="text-red-600 font-black">THIS IS IRREVERSIBLE.</span></p>
                  </div>
                  <button 
                     onClick={() => setIsResetting(true)}
                     className="bg-red-600 text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all"
                  >
                     Initiate Reset
                  </button>
               </section>
            </motion.div>
          )}

          {/* AUDIT TRAIL (Logs) */}
          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="bg-slate-900 border border-white/5 rounded-[48px] p-12 shadow-2xl font-mono">
                  <div className="flex items-center gap-3 mb-10 text-emerald-400">
                     <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                     <span className="text-[11px] font-black uppercase tracking-widest">Real-time Stream Terminal</span>
                  </div>
                  {loadingLogs ? (
                    <div className="space-y-6">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-3xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                       {activityLogs.map(log => (
                         <div key={log.id} className="flex gap-6 p-6 hover:bg-white/5 transition-all rounded-3xl border border-transparent hover:border-white/5">
                            <div className={`mt-1 ${
                              log.importance === 'high' ? 'text-rose-500' :
                              log.importance === 'medium' ? 'text-amber-500' :
                              'text-indigo-400'
                            }`}>
                              {log.importance === 'high' ? <AlertTriangle size={20} /> : <Zap size={20} />}
                            </div>
                            <div>
                               <div className="flex items-center gap-4 mb-2">
                                  <p className="text-white font-black text-sm uppercase tracking-widest">{log.action}</p>
                                  <span className="text-[10px] font-black text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</span>
                               </div>
                               <p className="text-xs text-white/40 leading-relaxed font-bold">
                                 {log.target && <span className="text-indigo-400">[{log.target}] </span>}
                                 {Object.entries(log.metadata || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                               </p>
                            </div>
                         </div>
                       ))}
                       {activityLogs.length === 0 && (
                         <div className="py-20 text-center">
                           <p className="text-white/20 font-black uppercase tracking-widest">No logs recorded in the current session.</p>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* NODE DOSSIER OVERLAY (Behavioral Audit) */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="bg-white w-full max-w-6xl h-[94vh] overflow-hidden rounded-[64px] shadow-2xl relative z-10 flex flex-col lg:flex-row border border-white/20">
               
               {/* Dossier Meta Sidebar */}
               <div className="lg:w-96 bg-neutral-50 p-12 border-r border-slate-100 flex flex-col items-center overflow-y-auto no-scrollbar">
                  <div className="w-48 h-48 rounded-[56px] overflow-hidden border-8 border-white shadow-2xl mb-10">
                     <OptimizedImage src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-full h-full" alt="" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 text-center mb-1 leading-tight">{selectedUser.username}</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-12 flex items-center gap-2">
                     <ShieldCheck size={14} /> Registered Node
                  </p>
                  
                  <div className="w-full space-y-4 mb-16">
                     <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-[10px] font-black uppercase text-slate-300">Node Compliance</p>
                           <div 
                             onClick={() => setSelectedUser({ ...selectedUser, isVerified: !selectedUser.isVerified })}
                             className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${selectedUser.isVerified ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                           >
                             <ShieldCheck size={12} />
                             <span className="text-[9px] font-black uppercase tracking-widest">{selectedUser.isVerified ? 'Verified' : 'Unverified'}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${selectedUser.status === UserStatus.Suspended ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                           <span className="text-lg font-black text-slate-900">{selectedUser.status || 'Active'}</span>
                        </div>
                     </div>
                     <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-300 mb-2">Identity Role</p>
                        <p className="text-lg font-black text-slate-900 uppercase tracking-widest">{selectedUser.role}</p>
                     </div>
                  </div>

                  <div className="mt-auto w-full space-y-4">
                     <div className="grid grid-cols-1 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Username</label>
                          <input 
                            type="text"
                            value={selectedUser.username}
                            onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Email Address</label>
                          <input 
                            type="email"
                            value={selectedUser.email}
                            onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Phone Number</label>
                          <input 
                            type="text"
                            value={selectedUser.phone || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Role Registry</label>
                            <select 
                              value={selectedUser.role}
                              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-[10px] uppercase outline-none"
                            >
                              {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Compliance</label>
                            <select 
                              value={selectedUser.status}
                              onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as UserStatus })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-black text-[10px] uppercase outline-none"
                            >
                              {Object.values(UserStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                     </div>
                     <button 
                        onClick={async () => {
                          await updateUser(selectedUser.id, selectedUser);
                          setSelectedUser(null);
                        }}
                        className="w-full py-6 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                      >
                        Commit Changes
                      </button>
                     <button 
                        onClick={async () => {
                          await updateUser(selectedUser.id, { status: UserStatus.Suspended });
                          setSelectedUser(null);
                        }}
                        className="w-full py-6 bg-red-600 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl"
                      >
                        Instant Suspend
                      </button>
                     <button 
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to permanently delete this user? This action is irreversible.')) {
                            await deleteUser(selectedUser.id);
                            setSelectedUser(null);
                          }
                        }}
                        className="w-full py-6 border border-red-100 text-red-500 rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                     >
                        Purge Node
                     </button>
                  </div>
               </div>

               {/* Intelligence Pulse Content */}
               <div className="flex-grow p-10 lg:p-20 overflow-y-auto bg-white custom-scrollbar">
                  <div className="flex justify-between items-start mb-20">
                     <div>
                        <h4 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2">Behavioral Matrix</h4>
                        <p className="text-slate-400 font-bold text-lg italic">Platform ID: <span className="font-mono text-slate-900 font-black">{selectedUser.id}</span></p>
                     </div>
                     <button onClick={() => setSelectedUser(null)} className="p-5 bg-slate-50 rounded-full hover:bg-slate-200 transition-colors shadow-sm"><X size={28} /></button>
                  </div>

                  {selectedUser.role === UserRole.Student && (
                    <section className="bg-white border border-slate-100 p-12 rounded-[56px] shadow-sm mb-12">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 flex items-center gap-3"><GraduationCap size={16} /> Academic Credentials</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">College/Institute</label>
                          <input 
                            type="text"
                            value={selectedUser.college || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, college: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Allen Career Institute"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Course/Batch</label>
                          <input 
                            type="text"
                            value={selectedUser.course || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, course: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. JEE Advanced 2026"
                          />
                        </div>
                      </div>
                    </section>
                  )}

                  {selectedUser.role === UserRole.Owner && (
                    <section className="bg-white border border-slate-100 p-12 rounded-[56px] shadow-sm mb-12">
                      <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 flex items-center gap-3"><Briefcase size={16} /> Business Identity</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Business Name</label>
                          <input 
                            type="text"
                            value={selectedUser.businessName || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, businessName: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Sharma Residency Group"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 ml-2">GST Number (Optional)</label>
                          <input 
                            type="text"
                            value={selectedUser.gstNumber || ''}
                            onChange={(e) => setSelectedUser({ ...selectedUser, gstNumber: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="22AAAAA0000A1Z5"
                          />
                        </div>
                      </div>
                    </section>
                  )}

                  {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                       {[
                         { label: 'Avg Pulse Time', val: `${selectedUser.behavioralMetrics.avgSessionTime}m`, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-50' },
                         { label: 'Total Cycles', val: selectedUser.behavioralMetrics.totalSessions, icon: MousePointer2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                         { label: 'Price Affinity', val: `₹${selectedUser.behavioralMetrics.pricePreference.max / 1000}k`, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                         { label: 'Search Depth', val: `${selectedUser.behavioralMetrics.searchDepth}/10`, icon: Focus, color: 'text-amber-600', bg: 'bg-amber-50' },
                       ].map((kpi) => (
                         <div key={kpi.label} className={`p-10 rounded-[48px] ${kpi.bg} border border-white shadow-sm flex flex-col items-center text-center`}>
                            <div className={`${kpi.color} mb-4`}><kpi.icon size={28} /></div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{kpi.label}</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{kpi.val}</p>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center bg-slate-50 rounded-[56px] mb-20 border border-dashed border-slate-200">
                       <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Uninitialized Node - No Behavioral Intelligence</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                     <div className="lg:col-span-12 space-y-16">
                        
                        {/* Area Preferences */}
                        {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && (
                           <section className="bg-slate-50 p-12 rounded-[56px] border border-slate-100">
                             <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 flex items-center gap-3"><Layers size={16} /> Cluster Affinity Heatmap</h5>
                             <div className="flex flex-wrap gap-4">
                                {selectedUser.behavioralMetrics.topAreas.map((area) => (
                                   <div key={area} className="px-8 py-5 bg-white rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-indigo-500 transition-colors">
                                      <MapPin size={20} className="text-indigo-500" />
                                      <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">{area}</span>
                                      <span className="text-[9px] font-black text-slate-300 uppercase">92% Match</span>
                                   </div>
                                ))}
                             </div>
                           </section>
                        )}

                        {/* Activity Stream */}
                        {selectedUser.activityLog && (
                           <section className="bg-white border border-slate-100 p-12 rounded-[56px] shadow-sm">
                             <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-12 flex items-center gap-3"><Activity size={16} /> Activity Stream Terminal</h5>
                             <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                {selectedUser.activityLog.map((log) => (
                                   <div key={log.id} className="relative pl-12">
                                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-md ${log.importance === 'high' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                      <div className="flex justify-between items-start mb-1">
                                         <p className="font-black text-slate-900 text-lg leading-none uppercase tracking-tighter">{log.action}</p>
                                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-400 italic mt-2">Asset Node: {log.target}</p>
                                   </div>
                                ))}
                             </div>
                           </section>
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BulkUploadModal 
        isOpen={isBulkUploading}
        onClose={() => setIsBulkUploading(false)}
        onUpload={(newProperties) => {
          const propertiesWithIds = newProperties.map((p, index) => ({
            ...p,
            id: `bulk-${Date.now()}-${index}`
          })) as Property[];
          
          bulkAddProperties(propertiesWithIds);
          setIsBulkUploading(false);
        }}
      />

      <BulkPriceUpdateModal 
        isOpen={isBulkPriceUpdating}
        onClose={() => setIsBulkPriceUpdating(false)}
        onUpdate={(area, amount) => {
          bulkUpdatePrices(area, amount);
        }}
      />

      <PropertyFormModal 
        key={editingProperty ? `edit-${editingProperty.id}` : (isAdding ? 'admin-add-new' : 'admin-add')}
        isOpen={!!editingProperty || isAdding} 
        onClose={() => {
          setEditingProperty(null);
          setIsAdding(false);
        }} 
        onSubmit={(updated) => {
          if (editingProperty) {
            updateProperty(updated.id, updated);
          } else {
            addProperty(updated);
          }
          setEditingProperty(null);
          setIsAdding(false);
        }}
        initialData={editingProperty || undefined}
        ownerId={editingProperty?.ownerId || user?.id || 'admin'}
        ownerName={editingProperty?.OwnerName || user?.username || 'Admin'}
        ownerEmail={editingProperty?.OwnerEmail || user?.email || 'admin@erooms.in'}
        ownerPhone={editingProperty?.OwnerWhatsApp || user?.phone}
      />

      {/* Deletion Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-12 rounded-[48px] shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Decommission Asset?</h3>
              <p className="text-slate-400 font-bold mb-10 leading-relaxed">
                This action will permanently remove the property node from the Kota cluster. This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (deletingId) {
                      await deleteProperty(deletingId);
                      setDeletingId(null);
                    }
                  }}
                  className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsResetting(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-12 rounded-[48px] shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Factory Reset?</h3>
              <p className="text-slate-400 font-bold mb-10 leading-relaxed">
                This will reset the global configuration to defaults. This action is irreversible.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsResetting(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    await handleUpdateConfig({ siteName: 'erooms.in', tagline: 'Future of Student Living' });
                    setIsResetting(false);
                  }}
                  className="flex-1 py-5 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
