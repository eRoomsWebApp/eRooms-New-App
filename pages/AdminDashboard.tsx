import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { ApprovalStatus, UserRole, User, UserStatus, AppConfig, Property, Lead, ActivityLog } from '../types';
import {
  fetchLeads,
  saveAppConfig,
  fetchUsersOnce,
  updateUser,
  deleteUser,
  fetchActivityLogs,
  updateLead,
  fetchAllProperties,
  migratePrivateFieldsToCollection
} from '../db';
import { useConfig } from '../context/ConfigContext';
import { transformDriveUrl } from '../utils/urlHelper';
import { getPropertyPath } from '../utils/slug';
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
  AlertTriangle, AlertCircle, FileCheck, Star, ArrowUp,
  RefreshCw, Lock, ExternalLink
} from 'lucide-react';

const PropertyFormModal = React.lazy(() => import('../components/PropertyFormModal'));
const BulkUploadModal = React.lazy(() => import('../components/BulkUploadModal'));
const BulkPriceUpdateModal = React.lazy(() => import('../components/BulkPriceUpdateModal'));

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
  const { addProperty, bulkAddProperties, approveProperty, updateProperty, deleteProperty, bulkUpdatePrices } = useProperties();
  const { config } = useConfig();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'leads' | 'config' | 'logs' | 'docs'>(
    searchParams.get('action') === 'add' ? 'listings' : 'overview'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [adminProperties, setAdminProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMigratingPrivate, setIsMigratingPrivate] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isAdding, setIsAdding] = useState(searchParams.get('action') === 'add');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isBulkPriceUpdating, setIsBulkPriceUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const userId = user?.id;
  const userRole = user?.role;

  const refreshAllData = useCallback(async () => {
    if (!userId || !userRole) return;
    setIsRefreshing(true);
    setPropertiesLoading(true);
    setLoadingUsers(true);
    setIsLeadsLoading(true);
    setLoadingLogs(true);
    try {
      const [allProps, allUsers, allLeads, allLogs] = await Promise.all([
        fetchAllProperties().catch(() => []),
        fetchUsersOnce().catch(() => []),
        fetchLeads(userId, userRole).catch(() => []),
        fetchActivityLogs().catch(() => [])
      ]);
      setAdminProperties(allProps);
      setRegisteredUsers(allUsers);
      setLeads(allLeads);
      setActivityLogs(allLogs);
      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setPropertiesLoading(false);
      setLoadingUsers(false);
      setIsLeadsLoading(false);
      setLoadingLogs(false);
      setIsRefreshing(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const handleMigratePrivateFields = async () => {
    setIsMigratingPrivate(true);
    setMigrationStatus(null);
    try {
      const result = await migratePrivateFieldsToCollection();
      setMigrationStatus(
        `Scanned ${result.totalScanned} properties; moved private contact & address fields on ${result.migratedCount} records to property_private.`
      );
      await refreshAllData();
    } catch (error) {
      setMigrationStatus(error instanceof Error ? `Migration failed: ${error.message}` : 'Migration failed.');
    } finally {
      setIsMigratingPrivate(false);
    }
  };

  const handleUpdateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return;
    setIsSyncing(true);
    const newConfig = { ...config, ...updates };
    await saveAppConfig(newConfig);
    setIsSyncing(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const stats = useMemo(() => ({
    totalListings: adminProperties.length,
    pendingListings: adminProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    totalUsers: registeredUsers.length,
    activeNodes: registeredUsers.filter(u => u.status !== UserStatus.Suspended).length,
    owners: registeredUsers.filter(u => u.role === UserRole.Owner).length,
    scholars: registeredUsers.filter(u => u.role === UserRole.Student).length,
    approvalRate:
      adminProperties.length > 0
        ? ((adminProperties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length / adminProperties.length) * 100).toFixed(0)
        : '0'
  }), [adminProperties, registeredUsers]);

  const systemLogs = useMemo(() => {
    return activityLogs.map(log => ({
      id: log.id,
      event: log.action,
      detail: log.target || 'System protocol',
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: log.importance === 'high' ? AlertCircle : log.importance === 'medium' ? Target : Activity,
      color: log.importance === 'high' ? 'text-rose-500' : log.importance === 'medium' ? 'text-amber-500' : 'text-blue-500'
    }));
  }, [activityLogs]);

  if (!config) return null;

  const filteredListings = adminProperties
    .filter(
      p =>
        p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.Area.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      const scoreA = a.priorityScore || 0;
      const scoreB = b.priorityScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.ListingName.localeCompare(b.ListingName);
    });

  const filteredUsers = registeredUsers.filter(
    u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(
    l =>
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
    { id: 'logs', label: 'Audit Trail', icon: Terminal }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 bg-slate-900 border-r border-white/5 p-6 lg:p-10 flex lg:flex-col sticky top-20 z-40 lg:h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
        <div className="hidden lg:flex items-center gap-4 mb-16">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20">
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
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all whitespace-nowrap group ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-white/20 group-hover:text-white'} />
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-10 hidden lg:block border-t border-white/5">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Firestore Mode</p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-xs font-black text-white uppercase tracking-widest">On-Demand Sync</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-grow p-6 lg:p-16 overflow-x-hidden pb-40 lg:pb-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-2">{activeTab} Module</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold text-sm">
                Last Synced: <span className="text-slate-900 font-black">{lastSaved}</span>
              </span>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Low-Read Mode</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl border border-blue-100"
                >
                  <Database size={16} className="animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Saving Config...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-800 px-6 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>

            {activeTab === 'leads' && (
              <button
                onClick={handleExportLeads}
                className="flex items-center gap-3 bg-slate-900 text-white px-7 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
              >
                <FileSpreadsheet size={18} />
                Export CSV
              </button>
            )}

            <div className="relative group w-full md:w-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-50 w-full md:w-72 lg:w-[340px] font-bold text-slate-900 shadow-sm transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {migrationStatus && (
          <div className="mb-8 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-bold flex items-center justify-between gap-4">
            <span>{migrationStatus}</span>
            <button onClick={() => setMigrationStatus(null)} className="p-1 text-blue-600 hover:text-blue-900">
              <X size={16} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Properties', val: stats.totalListings, trend: 'CATALOGUE', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Registered Users', val: stats.totalUsers, trend: 'ACCOUNTS', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Approval Rate', val: `${stats.approvalRate}%`, trend: 'VERIFIED', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Audit Queue', val: stats.pendingListings, trend: 'PENDING', color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{stat.val}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${stat.color}`}>{stat.trend}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-slate-900 text-white rounded-[48px] p-12 shadow-2xl relative overflow-hidden">
                  <Globe className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5 rotate-12" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">Platform Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                        <div>
                          <p className="text-5xl font-black text-blue-400">{stats.scholars}</p>
                          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Students</p>
                        </div>
                        <div>
                          <p className="text-5xl font-black text-blue-400">{stats.owners}</p>
                          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Owners</p>
                        </div>
                        <div>
                          <p className="text-5xl font-black text-blue-400">{config.areas.length}</p>
                          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Areas</p>
                        </div>
                        <div>
                          <p className="text-5xl font-black text-blue-400">{stats.approvalRate}%</p>
                          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-2">Approved</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-14 flex flex-wrap items-center gap-4">
                      <button onClick={() => setActiveTab('listings')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">
                        Manage Listings
                      </button>
                      <button onClick={() => setActiveTab('config')} className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
                        Platform Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <Activity size={20} className="text-blue-600" /> Recent Activity
                  </h3>
                  <div className="space-y-6 flex-grow">
                    {systemLogs.slice(0, 4).map(log => (
                      <div key={log.id} className="flex gap-4">
                        <div className={`mt-1 ${log.color}`}>
                          <log.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase">{log.event}</p>
                          <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">{log.detail}</p>
                          <p className="text-[9px] font-black text-slate-300 mt-1">{log.time}</p>
                        </div>
                      </div>
                    ))}
                    {systemLogs.length === 0 && (
                      <p className="text-xs font-bold text-slate-400">No recent activity logs.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'listings' && (
            <div key="listings" className="space-y-8">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Asset Registry</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Manage listings, approvals, and private contact isolation.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleMigratePrivateFields}
                    disabled={isMigratingPrivate}
                    className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2 disabled:opacity-60"
                    title="Move OwnerWhatsApp, OwnerEmail, EmergencyContact and FullAddress to property_private collection"
                  >
                    <Lock size={16} />
                    {isMigratingPrivate ? 'Moving Private Fields...' : 'Move Private Fields'}
                  </button>
                  <button
                    onClick={() => setIsBulkPriceUpdating(true)}
                    className="bg-white border-2 border-slate-200 text-blue-600 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                  >
                    <TrendingUp size={16} /> Price Shift
                  </button>
                  <button
                    onClick={() => setIsBulkUploading(true)}
                    className="bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"
                  >
                    <FileSpreadsheet size={16} /> Bulk Upload
                  </button>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all flex items-center gap-3"
                  >
                    <Plus size={18} /> New Registration
                  </button>
                </div>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                {propertiesLoading ? (
                  <TableSkeleton />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          <th className="px-10 py-7">Asset Narrative</th>
                          <th className="px-10 py-7">Owner</th>
                          <th className="px-10 py-7">Area</th>
                          <th className="px-10 py-7">Monthly Value</th>
                          <th className="px-10 py-7">Priority</th>
                          <th className="px-10 py-7">Audit Status</th>
                          <th className="px-10 py-7 text-right">Command</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredListings.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                                  <OptimizedImage src={transformDriveUrl(p.PhotoMain, 400)} className="w-full h-full" alt={p.ListingName} />
                                </div>
                                <div>
                                  <p className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    {p.ListingName}
                                    {p.ValidationIssues && p.ValidationIssues.length > 0 && (
                                      <span className="text-rose-500" title={`${p.ValidationIssues.length} issues found`}>
                                        <AlertTriangle size={15} />
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {p.ListingType} • {p.Gender}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <p className="text-sm font-bold text-slate-900">{p.OwnerName || 'Unknown'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                ID: {p.ownerId?.slice(0, 8)}...
                              </p>
                            </td>
                            <td className="px-10 py-8 text-sm font-bold text-slate-600">{p.Area}</td>
                            <td className="px-10 py-8">
                              <p className="text-base font-black text-slate-900">
                                ₹{(Array.isArray(p.RentDouble) ? p.RentDouble[0] : p.RentDouble || 0).toLocaleString()}
                              </p>
                              <p className="text-[10px] font-black text-slate-300 uppercase mt-1">Base Double</p>
                            </td>
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={async () => {
                                    const next = !p.isFeatured;
                                    await updateProperty(p.id, { isFeatured: next });
                                    setAdminProperties(prev => prev.map(x => (x.id === p.id ? { ...x, isFeatured: next } : x)));
                                  }}
                                  className={`p-2.5 rounded-xl transition-all ${
                                    p.isFeatured ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                                  }`}
                                  title={p.isFeatured ? 'Featured' : 'Mark as Featured'}
                                >
                                  <Star size={16} fill={p.isFeatured ? 'currentColor' : 'none'} />
                                </button>
                                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                  <ArrowUp size={13} className="text-blue-600" />
                                  <input
                                    type="number"
                                    value={p.priorityScore || 0}
                                    onChange={async e => {
                                      const val = parseInt(e.target.value, 10) || 0;
                                      setAdminProperties(prev => prev.map(x => (x.id === p.id ? { ...x, priorityScore: val } : x)));
                                      await updateProperty(p.id, { priorityScore: val });
                                    }}
                                    className="w-12 bg-transparent font-black text-xs outline-none"
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
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
                              <div className="flex items-center justify-end gap-2">
                                {p.ApprovalStatus === ApprovalStatus.Pending && (
                                  <button
                                    onClick={async () => {
                                      await approveProperty(p.id);
                                      setAdminProperties(prev =>
                                        prev.map(x => (x.id === p.id ? { ...x, ApprovalStatus: ApprovalStatus.Approved } : x))
                                      );
                                    }}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                                  >
                                    Verify
                                  </button>
                                )}
                                <Link
                                  to={getPropertyPath(p)}
                                  className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                  title="View Public Page"
                                >
                                  <ExternalLink size={16} />
                                </Link>
                                <button
                                  onClick={() => setEditingProperty(p)}
                                  className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                  title="Edit Listing"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => setDeletingId(p.id)}
                                  className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
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

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              {loadingUsers ? (
                <TableSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-10 py-7">User</th>
                        <th className="px-10 py-7">Role</th>
                        <th className="px-10 py-7">Status</th>
                        <th className="px-10 py-7">Joined</th>
                        <th className="px-10 py-7 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map(u => (
                        <tr key={u.id || u.email} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                <OptimizedImage
                                  src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                  alt=""
                                  className="w-full h-full"
                                />
                              </div>
                              <div>
                                <p className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                                  {u.username}
                                  {u.isVerified && (
                                    <span className="text-blue-600" title="Verified">
                                      <ShieldCheck size={16} />
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span
                              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                                u.role === UserRole.SuperAdmin
                                  ? 'bg-blue-600 text-white'
                                  : u.role === UserRole.Admin
                                    ? 'bg-slate-900 text-white'
                                    : u.role === UserRole.Owner
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${u.status === UserStatus.Suspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                              <span className="text-[10px] font-black uppercase text-slate-700">{u.status || 'Active'}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-sm font-bold text-slate-500">
                            {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-10 py-8 text-right">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
                            >
                              Audit Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'leads' && (
            <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              {isLeadsLoading ? (
                <TableSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-10 py-7">Scholar Identity</th>
                        <th className="px-10 py-7">Target Property</th>
                        <th className="px-10 py-7">Type</th>
                        <th className="px-10 py-7">Status</th>
                        <th className="px-10 py-7 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users size={18} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-base">{lead.studentName}</p>
                                <p className="text-xs font-bold text-slate-400">{lead.studentPhone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 font-bold text-slate-700">{lead.propertyName}</td>
                          <td className="px-10 py-8">
                            <span className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 bg-blue-50 text-blue-700">
                              {lead.type === 'WhatsApp' && <MessageCircle size={12} />}
                              {lead.type === 'Call' && <Phone size={12} />}
                              {lead.type === 'VisitRequest' && <Calendar size={12} />}
                              {lead.type}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <select
                              value={lead.status}
                              onChange={async e => {
                                const nextStatus = e.target.value as Lead['status'];
                                await updateLead(lead.id, { status: nextStatus });
                                setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, status: nextStatus } : l)));
                              }}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer ${
                                lead.status === 'New'
                                  ? 'bg-blue-50 text-blue-700'
                                  : lead.status === 'Contacted'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="px-10 py-8 text-right">
                            <a
                              href={`https://wa.me/91${lead.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${lead.studentName}, from eRooms.in regarding ${lead.propertyName}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all inline-block"
                            >
                              Contact
                            </a>
                          </td>
                        </tr>
                      ))}
                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-10 py-24 text-center">
                            <MessageCircle size={56} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">
                              Public leads are forwarded to Google Sheets CRM.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              {loadingUsers ? (
                <TableSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <th className="px-10 py-7">Owner Identity</th>
                        <th className="px-10 py-7">Document Type</th>
                        <th className="px-10 py-7">Submission Date</th>
                        <th className="px-10 py-7">Audit Status</th>
                        <th className="px-10 py-7 text-right">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {registeredUsers
                        .filter(u => u.role === UserRole.Owner && u.verificationDocs && u.verificationDocs.length > 0)
                        .flatMap(u => (u.verificationDocs || []).map(doc => ({ user: u, doc })))
                        .sort((a, b) => new Date(b.doc.uploadedAt).getTime() - new Date(a.doc.uploadedAt).getTime())
                        .map(({ user: u, doc }) => (
                          <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                  <OptimizedImage
                                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                                    alt=""
                                    className="w-full h-full"
                                  />
                                </div>
                                <div>
                                  <p className="text-base font-black text-slate-900">{u.username}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
                                {doc.type}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-sm font-bold text-slate-500">
                              {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })}
                            </td>
                            <td className="px-10 py-8">
                              <span
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                  doc.status === ApprovalStatus.Approved
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : doc.status === ApprovalStatus.Rejected
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-right">
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
                                        const allApproved = updatedDocs.every(d => d.status === ApprovalStatus.Approved);
                                        await updateUser(u.id, { verificationDocs: updatedDocs, isVerified: allApproved });
                                        setRegisteredUsers(prev =>
                                          prev.map(x => (x.id === u.id ? { ...x, verificationDocs: updatedDocs, isVerified: allApproved } : x))
                                        );
                                      }}
                                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const reason = window.prompt('Rejection reason:') || 'Document unclear';
                                        const updatedDocs = (u.verificationDocs || []).map(d =>
                                          d.id === doc.id
                                            ? { ...d, status: ApprovalStatus.Rejected, rejectionReason: reason, reviewedAt: new Date().toISOString() }
                                            : d
                                        );
                                        await updateUser(u.id, { verificationDocs: updatedDocs, isVerified: false });
                                        setRegisteredUsers(prev =>
                                          prev.map(x => (x.id === u.id ? { ...x, verificationDocs: updatedDocs, isVerified: false } : x))
                                        );
                                      }}
                                      className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm"
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
                          <td colSpan={5} className="px-10 py-24 text-center">
                            <FileCheck size={56} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">No documents pending audit.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Server size={24} />
                    </div>
                    <div
                      className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${
                        config.maintenanceMode ? 'bg-red-500' : 'bg-slate-200'
                      }`}
                      onClick={() => handleUpdateConfig({ maintenanceMode: !config.maintenanceMode })}
                    >
                      <motion.div animate={{ x: config.maintenanceMode ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Maintenance Mode</h4>
                  <p className="text-xs font-bold text-slate-400">Lock platform for maintenance updates.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <UserPlus size={24} />
                    </div>
                    <div
                      className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors ${
                        config.allowNewRegistrations ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                      onClick={() => handleUpdateConfig({ allowNewRegistrations: !config.allowNewRegistrations })}
                    >
                      <motion.div animate={{ x: config.allowNewRegistrations ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Registration Gate</h4>
                  <p className="text-xs font-bold text-slate-400">Control partner onboarding access.</p>
                </div>

                <div className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                  <Lock className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 rotate-12" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={26} className="text-blue-400" />
                    </div>
                    <div className="mt-6">
                      <h4 className="text-xl font-black mb-2">PII Isolation Migration</h4>
                      <button
                        onClick={handleMigratePrivateFields}
                        disabled={isMigratingPrivate}
                        className="px-5 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                      >
                        {isMigratingPrivate ? 'Migrating...' : 'Move private fields'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <section className="bg-white border border-slate-200 rounded-[48px] p-10 lg:p-14 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <Sparkles size={24} className="text-amber-500" /> Branding Settings
                  <div className="h-px flex-grow bg-slate-100" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Site Name</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all font-black text-slate-900"
                      value={config.siteName}
                      onChange={e => handleUpdateConfig({ siteName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Global Tagline</label>
                    <input
                      type="text"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all font-black text-slate-900"
                      value={config.tagline}
                      onChange={e => handleUpdateConfig({ tagline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Hero Description</label>
                    <textarea
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 h-28"
                      value={config.heroDescription}
                      onChange={e => handleUpdateConfig({ heroDescription: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Footer Text</label>
                    <textarea
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 h-24"
                      value={config.footerText}
                      onChange={e => handleUpdateConfig({ footerText: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Kota Areas</h3>
                    <button
                      onClick={() => {
                        const name = prompt('New Area Name (e.g., Kunhari):');
                        if (name && name.trim()) handleUpdateConfig({ areas: [...config.areas, name.trim()] });
                      }}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {config.areas.map(a => (
                      <div key={a} className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{a.split(' (')[0]}</span>
                        <button onClick={() => handleUpdateConfig({ areas: config.areas.filter(x => x !== a) })} className="text-slate-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Facilities</h3>
                    <button
                      onClick={() => {
                        const name = prompt('New Facility Name:');
                        if (name && name.trim()) handleUpdateConfig({ facilities: [...config.facilities, name.trim()] });
                      }}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {config.facilities.map(f => (
                      <div key={f} className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{f}</span>
                        <button onClick={() => handleUpdateConfig({ facilities: config.facilities.filter(x => x !== f) })} className="text-slate-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Coaching Institutes</h3>
                    <button
                      onClick={() => {
                        const name = prompt('New Coaching Institute:');
                        if (name && name.trim()) handleUpdateConfig({ institutes: [...config.institutes, name.trim()] });
                      }}
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {config.institutes.map(i => (
                      <div key={i} className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{i}</span>
                        <button onClick={() => handleUpdateConfig({ institutes: config.institutes.filter(x => x !== i) })} className="text-slate-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-red-50 border border-red-100 rounded-[40px] p-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h4 className="text-2xl font-black text-red-900 tracking-tighter uppercase mb-1">Reset Config Defaults</h4>
                  <p className="text-red-700/70 font-bold text-sm">Restore default site branding values in Firestore.</p>
                </div>
                <button
                  onClick={() => setIsResetting(true)}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-red-700 transition-all"
                >
                  Initiate Reset
                </button>
              </section>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-900 border border-white/5 rounded-[40px] p-10 shadow-2xl font-mono">
                <div className="flex items-center gap-3 mb-8 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Audit Log Snapshot</span>
                </div>
                {loadingLogs ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map(log => (
                      <div key={log.id} className="flex gap-5 p-5 hover:bg-white/5 transition-all rounded-2xl border border-transparent hover:border-white/5">
                        <div className={`mt-1 ${log.importance === 'high' ? 'text-rose-500' : log.importance === 'medium' ? 'text-amber-500' : 'text-blue-400'}`}>
                          {log.importance === 'high' ? <AlertTriangle size={18} /> : <Zap size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-1">
                            <p className="text-white font-black text-sm uppercase tracking-widest">{log.action}</p>
                            <span className="text-[10px] font-black text-white/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-white/50 font-bold">
                            {log.target && <span className="text-blue-400">[{log.target}] </span>}
                            {Object.entries(log.metadata || {})
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="py-16 text-center">
                        <p className="text-white/30 font-black uppercase tracking-widest">No logs recorded yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-5xl h-[90vh] overflow-hidden rounded-[48px] shadow-2xl relative z-10 flex flex-col lg:flex-row border border-white/20"
            >
              <div className="lg:w-96 bg-neutral-50 p-10 border-r border-slate-100 flex flex-col items-center overflow-y-auto no-scrollbar">
                <div className="w-36 h-36 rounded-[40px] overflow-hidden border-4 border-white shadow-xl mb-6">
                  <OptimizedImage
                    src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                    className="w-full h-full"
                    alt=""
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-900 text-center mb-1">{selectedUser.username}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-8 flex items-center gap-2">
                  <ShieldCheck size={14} /> Registered Node
                </p>

                <div className="w-full space-y-4 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Username</label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      onChange={e => setSelectedUser({ ...selectedUser, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number</label>
                    <input
                      type="text"
                      value={selectedUser.phone || ''}
                      onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Role</label>
                      <select
                        value={selectedUser.role}
                        onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white font-black text-[10px] uppercase outline-none"
                      >
                        {Object.values(UserRole).map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</label>
                      <select
                        value={selectedUser.status}
                        onChange={e => setSelectedUser({ ...selectedUser, status: e.target.value as UserStatus })}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white font-black text-[10px] uppercase outline-none"
                      >
                        {Object.values(UserStatus).map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-auto">
                  <button
                    onClick={async () => {
                      await updateUser(selectedUser.id, selectedUser);
                      setRegisteredUsers(prev => prev.map(u => (u.id === selectedUser.id ? selectedUser : u)));
                      setSelectedUser(null);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                  >
                    Commit Changes
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to permanently delete this user?')) {
                        await deleteUser(selectedUser.id);
                        setRegisteredUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                        setSelectedUser(null);
                      }
                    }}
                    className="w-full py-3.5 border border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                  >
                    Delete User
                  </button>
                </div>
              </div>

              <div className="flex-grow p-10 overflow-y-auto bg-white">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">User Profile</h4>
                    <p className="text-slate-400 font-bold text-sm">ID: {selectedUser.id}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={22} />
                  </button>
                </div>

                {selectedUser.role === UserRole.Student && (
                  <section className="bg-slate-50 border border-slate-100 p-8 rounded-3xl mb-8">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                      <GraduationCap size={16} /> Academic Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Coaching / College</label>
                        <input
                          type="text"
                          value={selectedUser.college || ''}
                          onChange={e => setSelectedUser({ ...selectedUser, college: e.target.value })}
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                          placeholder="e.g. Allen Career Institute"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Course / Batch</label>
                        <input
                          type="text"
                          value={selectedUser.course || ''}
                          onChange={e => setSelectedUser({ ...selectedUser, course: e.target.value })}
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                          placeholder="e.g. JEE Advanced"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {selectedUser.role === UserRole.Owner && (
                  <section className="bg-slate-50 border border-slate-100 p-8 rounded-3xl mb-8">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                      <Briefcase size={16} /> Business Identity
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Business Name</label>
                        <input
                          type="text"
                          value={selectedUser.businessName || ''}
                          onChange={e => setSelectedUser({ ...selectedUser, businessName: e.target.value })}
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                          placeholder="e.g. Sharma Residency"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">GST Number</label>
                        <input
                          type="text"
                          value={selectedUser.gstNumber || ''}
                          onChange={e => setSelectedUser({ ...selectedUser, gstNumber: e.target.value })}
                          className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {selectedUser.behavioralMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Avg Session', val: `${selectedUser.behavioralMetrics.avgSessionTime}m`, icon: Timer },
                      { label: 'Sessions', val: selectedUser.behavioralMetrics.totalSessions, icon: MousePointer2 },
                      { label: 'Max Budget', val: `₹${Math.round(selectedUser.behavioralMetrics.pricePreference.max / 1000)}k`, icon: Target },
                      { label: 'Depth', val: `${selectedUser.behavioralMetrics.searchDepth}/10`, icon: Focus }
                    ].map(kpi => (
                      <div key={kpi.label} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                        <kpi.icon size={20} className="text-blue-600 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase text-slate-400">{kpi.label}</p>
                        <p className="text-2xl font-black text-slate-900">{kpi.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && selectedUser.behavioralMetrics.topAreas.length > 0 && (
                  <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 flex items-center gap-2">
                      <Layers size={14} /> Top Areas
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {selectedUser.behavioralMetrics.topAreas.map(area => (
                        <div key={area} className="px-4 py-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                          <MapPin size={14} className="text-blue-600" />
                          <span className="font-bold text-xs text-slate-900">{area}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {isBulkUploading && (
          <BulkUploadModal
            isOpen={isBulkUploading}
            onClose={() => setIsBulkUploading(false)}
            onUpload={async newProperties => {
              const propertiesWithIds = newProperties.map((p, index) => ({
                ...p,
                id: `bulk-${Date.now()}-${index}`
              })) as Property[];
              await bulkAddProperties(propertiesWithIds);
              await refreshAllData();
              setIsBulkUploading(false);
            }}
          />
        )}

        {isBulkPriceUpdating && (
          <BulkPriceUpdateModal
            isOpen={isBulkPriceUpdating}
            onClose={() => setIsBulkPriceUpdating(false)}
            onUpdate={async (area, amount) => {
              await bulkUpdatePrices(area, amount);
              await refreshAllData();
            }}
          />
        )}

        {(!!editingProperty || isAdding) && (
          <PropertyFormModal
            key={editingProperty ? `edit-${editingProperty.id}` : 'admin-add-new'}
            isOpen={!!editingProperty || isAdding}
            onClose={() => {
              setEditingProperty(null);
              setIsAdding(false);
            }}
            onSubmit={async updated => {
              if (editingProperty) {
                await updateProperty(updated.id, updated);
                setAdminProperties(prev => prev.map(x => (x.id === updated.id ? { ...x, ...updated } : x)));
              } else {
                await addProperty(updated);
                setAdminProperties(prev => [...prev.filter(x => x.id !== updated.id), updated]);
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
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Delete Property?</h3>
              <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">
                This will permanently remove the property listing and its private contact record.
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
                      setAdminProperties(prev => prev.filter(p => p.id !== deletingId));
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

      <AnimatePresence>
        {isResetting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetting(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Reset Config?</h3>
              <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">
                This resets the site branding name and tagline to eRooms.in defaults.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsResetting(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateConfig({
                      siteName: 'eRooms.in',
                      tagline: 'Verified Hostels, PG & Flats in Kota'
                    });
                    setIsResetting(false);
                  }}
                  className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg"
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
