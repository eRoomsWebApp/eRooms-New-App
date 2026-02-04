
import React, { useState, useMemo, useEffect } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Property, ListingType, Gender, ApprovalStatus, UserRole, User, UserStatus, AppConfig } from '../types';
import { getAppConfig, saveAppConfig } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, X, Edit, Settings, BarChart3, 
  Building2, Clock, Plus, Trash2, Search, AlertCircle,
  Users, Activity, Globe, HardDrive, Smartphone,
  MoreVertical, ShieldAlert, UserCheck, UserPlus, Zap,
  Mail, Phone, Calendar, MapPin, ExternalLink, ArrowRight,
  Sparkles, ShieldCheck, Heart, UserX, MessageCircle,
  TrendingUp, MousePointer2, Timer, Focus, Target, Layers,
  Layout, Eye, Lock, Server, Wrench, Database, Instagram, Twitter, Linkedin
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { properties, approveProperty, deleteProperty } = useProperties();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'config' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // App Config Management
  const [config, setConfig] = useState<AppConfig>(getAppConfig());

  useEffect(() => {
    const loadUsers = () => {
      const users = JSON.parse(localStorage.getItem('erooms_registered_users') || '[]');
      setRegisteredUsers(users);
    };
    loadUsers();
  }, [activeTab]);

  const handleUpdateConfig = (updates: any) => {
    setIsSyncing(true);
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveAppConfig(newConfig);
    // Visual feedback delay
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleUpdateSocial = (platform: string, value: string) => {
    handleUpdateConfig({
      socialLinks: {
        ...config.socialLinks,
        [platform]: value
      }
    });
  };

  const stats = useMemo(() => ({
    totalListings: properties.length,
    pendingListings: properties.filter(p => p.ApprovalStatus === ApprovalStatus.Pending).length,
    totalUsers: registeredUsers.length,
    totalOwners: registeredUsers.filter(u => u.role === UserRole.Owner).length,
    totalStudents: registeredUsers.filter(u => u.role === UserRole.Student).length,
    approvalRate: properties.length > 0 ? ((properties.filter(p => p.ApprovalStatus === ApprovalStatus.Approved).length / properties.length) * 100).toFixed(0) : 0
  }), [properties, registeredUsers]);

  const filteredListings = properties.filter(p => 
    p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = registeredUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userProperties = useMemo(() => {
    if (!selectedUser) return [];
    return properties.filter(p => p.ownerId === selectedUser.id || p.OwnerEmail === selectedUser.email);
  }, [selectedUser, properties]);

  const systemLogs = [
    { id: 1, event: 'Property Approved', detail: 'Raj Residency Elite verified', time: '2 mins ago', icon: Check, color: 'text-green-500' },
    { id: 2, event: 'New Registration', detail: 'Student Rahul S. joined platform', time: '14 mins ago', icon: UserPlus, color: 'text-blue-500' },
    { id: 3, event: 'Security Alert', detail: 'Bulk upload attempt blocked', time: '1 hour ago', icon: ShieldAlert, color: 'text-red-500' },
    { id: 4, event: 'Config Change', detail: 'New Area added to registry', time: '3 hours ago', icon: Zap, color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      
      {/* Super Admin Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-8 flex flex-col sticky top-20 h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg">
            <Shield size={20} />
          </div>
          <span className="font-black text-slate-900 uppercase tracking-widest text-xs">Admin Hub</span>
        </div>

        <nav className="flex-grow space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'listings', label: 'Listings', icon: Building2 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'config', label: 'Control Center', icon: Settings },
            { id: 'logs', label: 'Audit Logs', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
            <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Network Health</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-600">Stable Node</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-grow p-6 lg:p-12 overflow-x-hidden">
        
        {/* Workspace Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1 uppercase">
              {activeTab === 'config' ? 'Control Center' : `${activeTab} Registry`}
            </h1>
            <p className="text-slate-400 font-bold text-sm italic">Authenticated as Master Super Admin</p>
          </div>

          <div className="flex items-center gap-6">
            <AnimatePresence>
               {isSyncing && (
                 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-Saving Changes...</span>
                 </motion.div>
               )}
            </AnimatePresence>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 w-64 lg:w-80 font-bold text-sm text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* OVERVIEW MODULE */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Listings', val: stats.totalListings, icon: Building2, trend: '+12%', color: 'bg-indigo-600' },
                    { label: 'Total Users', val: stats.totalUsers, icon: Users, trend: '+4 today', color: 'bg-slate-900' },
                    { label: 'Approval Rate', val: `${stats.approvalRate}%`, icon: UserCheck, trend: 'Optimal', color: 'bg-green-600' },
                    { label: 'Audit Queue', val: stats.pendingListings, icon: Clock, trend: 'Critical', color: 'bg-amber-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                       <div className={`absolute top-0 right-0 p-4 ${stat.color} text-white opacity-0 group-hover:opacity-100 transition-all rounded-bl-[32px]`}>
                          <stat.icon size={20} />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                       <p className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{stat.val}</p>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{stat.trend}</span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-900">User Distribution Matrix</h3>
                        <div className="flex gap-2">
                           <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Scholars</span>
                           <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Hosts</span>
                        </div>
                     </div>
                     <div className="flex gap-1 h-14 bg-slate-100 rounded-2xl overflow-hidden mb-8">
                        <div className="bg-blue-600 h-full flex items-center justify-center text-[10px] text-white font-black uppercase" style={{ width: `${(stats.totalStudents/stats.totalUsers)*100}%` }}>Students</div>
                        <div className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-black uppercase" style={{ width: `${(stats.totalOwners/stats.totalUsers)*100}%` }}>Owners</div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <p className="text-4xl font-black text-slate-900">{stats.totalStudents}</p>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scholar Accounts</p>
                        </div>
                        <div>
                           <p className="text-4xl font-black text-slate-900">{stats.totalOwners}</p>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Management Nodes</p>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-4 bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                     <Globe className="absolute -bottom-10 -right-10 text-white/5 w-48 h-48 rotate-12" />
                     <h3 className="text-xl font-black mb-6 relative z-10">System Status</h3>
                     <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                           <span className="text-xs font-bold text-white/60">Site Title</span>
                           <span className="text-xs font-black">{config.siteName}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                           <span className="text-xs font-bold text-white/60">Registrations</span>
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${config.allowNewRegistrations ? 'bg-green-500' : 'bg-red-500'}`}>
                             {config.allowNewRegistrations ? 'Open' : 'Locked'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* LISTINGS HUB */}
          {activeTab === 'listings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-8 py-5">Asset Narrative</th>
                      <th className="px-8 py-5">Cluster</th>
                      <th className="px-8 py-5">Audit Status</th>
                      <th className="px-8 py-5 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredListings.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={p.PhotoMain} className="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="" />
                            <div>
                              <p className="font-black text-slate-900 leading-tight">{p.ListingName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.ListingType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-bold text-slate-600">{p.Area}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                            p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.ApprovalStatus === ApprovalStatus.Approved ? <Check size={12} /> : <Clock size={12} />}
                            {p.ApprovalStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {p.ApprovalStatus === ApprovalStatus.Pending && (
                              <button onClick={() => approveProperty(p.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100">Verify</button>
                            )}
                            <button onClick={() => deleteProperty(p.id)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </motion.div>
          )}

          {/* USER DIRECTORY */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-8 py-5">Profile Node</th>
                      <th className="px-8 py-5">System Role</th>
                      <th className="px-8 py-5">Compliance</th>
                      <th className="px-8 py-5 text-right">Administrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
                               <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 leading-tight">{u.username}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             u.role === UserRole.Admin ? 'bg-slate-900 text-white' : u.role === UserRole.Owner ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <span className={`w-2.5 h-2.5 rounded-full ${u.status === UserStatus.Suspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{u.status || 'Active'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button 
                             onClick={() => setSelectedUser(u)}
                             className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                           >
                             Dossier
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </motion.div>
          )}

          {/* CONTROL CENTER */}
          {activeTab === 'config' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12 pb-24">
               
               {/* 1. System Health & Switches */}
               <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                           <Server size={24} />
                        </div>
                        <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`} onClick={() => handleUpdateConfig({ maintenanceMode: !config.maintenanceMode })}>
                           <motion.div animate={{ x: config.maintenanceMode ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 mb-1">Maintenance Mode</h4>
                        <p className="text-xs font-bold text-slate-400">Lock platform during core updates.</p>
                     </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                           <UserPlus size={24} />
                        </div>
                        <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${config.allowNewRegistrations ? 'bg-green-500' : 'bg-slate-200'}`} onClick={() => handleUpdateConfig({ allowNewRegistrations: !config.allowNewRegistrations })}>
                           <motion.div animate={{ x: config.allowNewRegistrations ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 mb-1">Registrations</h4>
                        <p className="text-xs font-bold text-slate-400">Toggle public signup capability.</p>
                     </div>
                  </div>

                  <motion.div animate={{ scale: isSyncing ? 1.02 : 1 }} className="bg-slate-900 text-white rounded-[40px] p-8 shadow-2xl flex flex-col justify-between transition-all duration-300">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isSyncing ? 'bg-indigo-600' : 'bg-white/10'}`}>
                           <Database size={24} className={isSyncing ? 'animate-bounce' : ''} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-400">Reactive Storage</span>
                     </div>
                     <div>
                        <h4 className="text-xl font-black mb-1">{isSyncing ? 'Saving Data...' : 'Sync Healthy'}</h4>
                        <p className="text-xs font-bold text-white/40 italic">State locked for current session.</p>
                     </div>
                  </motion.div>
               </section>

               {/* 2. Global Identity & Narratives */}
               <section className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                     <Sparkles className="text-amber-500" /> Branding & Narratives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">App Title</label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900"
                           value={config.siteName}
                           onChange={(e) => handleUpdateConfig({ siteName: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Global Tagline</label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900"
                           value={config.tagline}
                           onChange={(e) => handleUpdateConfig({ tagline: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Hero Description</label>
                        <textarea 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900 h-24"
                           value={config.heroDescription}
                           onChange={(e) => handleUpdateConfig({ heroDescription: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Footer Copyright Text</label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none transition-all font-bold text-slate-900"
                           value={config.footerText}
                           onChange={(e) => handleUpdateConfig({ footerText: e.target.value })}
                        />
                     </div>
                  </div>
               </section>

               {/* 3. Connectivity Hub */}
               <section className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                     <Globe className="text-indigo-500" /> Connectivity Hub
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                           <Instagram size={12} /> Instagram URL
                        </label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.socialLinks.instagram}
                           onChange={(e) => handleUpdateSocial('instagram', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                           <Twitter size={12} /> Twitter URL
                        </label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.socialLinks.twitter}
                           onChange={(e) => handleUpdateSocial('twitter', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                           <Linkedin size={12} /> LinkedIn URL
                        </label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.socialLinks.linkedin}
                           onChange={(e) => handleUpdateSocial('linkedin', e.target.value)}
                        />
                     </div>
                  </div>
               </section>

               {/* 4. Support Matrix */}
               <section className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                     <Smartphone className="text-indigo-500" /> Support Matrix
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">WhatsApp Number (Digits only)</label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.supportWhatsApp}
                           onChange={(e) => handleUpdateConfig({ supportWhatsApp: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Display Phone Number</label>
                        <input 
                           type="text" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.supportPhone}
                           onChange={(e) => handleUpdateConfig({ supportPhone: e.target.value })}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Support Email</label>
                        <input 
                           type="email" 
                           className="w-full px-6 py-4 rounded-[24px] border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900"
                           value={config.supportEmail}
                           onChange={(e) => handleUpdateConfig({ supportEmail: e.target.value })}
                        />
                     </div>
                  </div>
               </section>

               {/* 5. Content Schema */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                           <MapPin className="text-slate-400" size={20} /> Cluster Schema
                        </h3>
                        <button onClick={() => {
                           const name = prompt('New Cluster:');
                           if(name) handleUpdateConfig({ areas: [...config.areas, name] });
                        }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"><Plus size={18} /></button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {config.areas.map(a => (
                          <div key={a} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-3 group">
                             <span className="text-[11px] font-black text-slate-600">{a}</span>
                             <button onClick={() => handleUpdateConfig({ areas: config.areas.filter(x => x !== a) })} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                           <Wrench className="text-slate-400" size={20} /> Facility Schema
                        </h3>
                        <button onClick={() => {
                           const name = prompt('New Facility:');
                           if(name) handleUpdateConfig({ facilities: [...config.facilities, name] });
                        }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"><Plus size={18} /></button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {config.facilities.map(f => (
                          <div key={f} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-3 group">
                             <span className="text-[11px] font-black text-slate-600">{f}</span>
                             <button onClick={() => handleUpdateConfig({ facilities: config.facilities.filter(x => x !== f) })} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                  </div>
               </section>

               {/* Danger Zone */}
               <section className="bg-red-50 border border-red-100 rounded-[40px] p-10">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                     <div>
                        <h4 className="text-2xl font-black text-red-700 tracking-tight">Protocol Reset</h4>
                        <p className="text-red-500/60 font-bold text-sm">Force system configuration to factory state.</p>
                     </div>
                     <button 
                        onClick={() => confirm("Wipe system state?") && handleUpdateConfig({ siteName: 'erooms.in', tagline: 'Future of Housing' })}
                        className="bg-red-600 text-white px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 transition-all"
                     >
                        Initiate Hard Reset
                     </button>
                  </div>
               </section>

            </motion.div>
          )}

          {/* AUDIT LOGS */}
          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                  <div className="space-y-4">
                     {systemLogs.map(log => (
                       <div key={log.id} className="flex items-start gap-5 p-5 hover:bg-slate-50 transition-all rounded-2xl group border border-transparent hover:border-slate-100">
                          <div className={`p-3 rounded-xl bg-slate-50 ${log.color}`}>
                             <log.icon size={20} />
                          </div>
                          <div className="flex-grow">
                             <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-black text-slate-900">{log.event}</p>
                                <span className="text-[10px] font-bold text-slate-300">{log.time}</span>
                             </div>
                             <p className="text-xs font-bold text-slate-500">{log.detail}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* User Dossier Overlay */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="bg-white w-full max-w-6xl h-[92vh] overflow-hidden rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 flex flex-col lg:flex-row border border-white/20">
               
               {/* Sidebar of the Profile */}
               <div className="lg:w-96 bg-slate-50 p-12 border-r border-slate-100 flex flex-col items-center">
                  <div className="w-40 h-40 rounded-[48px] overflow-hidden border-4 border-white shadow-2xl mb-8 group relative">
                     <img src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                     <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Sparkles className="text-white" size={32} />
                     </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 text-center mb-1">{selectedUser.username}</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-10 flex items-center gap-2">
                     <ShieldCheck size={14} />
                     {selectedUser.role} Registry Node
                  </p>
                  
                  <div className="w-full space-y-4 mb-12">
                     <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Compliance Status</p>
                        <div className="flex items-center gap-3">
                           <span className={`w-3 h-3 rounded-full ${selectedUser.status === UserStatus.Suspended ? 'bg-red-500' : 'bg-green-500'}`}></span>
                           <span className="text-base font-black text-slate-900">{selectedUser.status || 'Active Protocol'}</span>
                        </div>
                     </div>
                     <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Platform Activation</p>
                        <p className="text-base font-black text-slate-900">{new Date(selectedUser.joinedAt || '').toLocaleDateString('en-IN', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                     </div>
                  </div>

                  <div className="mt-auto w-full space-y-3">
                     <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">Transmit Message</button>
                     <button className="w-full py-5 border border-red-100 text-red-500 rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Revoke Access</button>
                  </div>
               </div>

               {/* Main Profile Content */}
               <div className="flex-grow p-12 lg:p-16 overflow-y-auto bg-white custom-scrollbar">
                  <div className="flex justify-between items-start mb-16">
                     <div>
                        <h4 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">Behavioral Intelligence</h4>
                        <p className="text-slate-400 font-bold text-base">Global Identifier: <span className="font-mono text-slate-900">{selectedUser.id}</span></p>
                     </div>
                     <button onClick={() => setSelectedUser(null)} className="p-4 bg-slate-50 rounded-full hover:bg-slate-200 transition-colors shadow-sm"><X size={24} /></button>
                  </div>

                  {/* HIGH LEVEL KPIS for Student */}
                  {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                       {[
                         { label: 'Avg Session Time', val: `${selectedUser.behavioralMetrics.avgSessionTime}m`, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-50' },
                         { label: 'Total Syncs', val: selectedUser.behavioralMetrics.totalSessions, icon: MousePointer2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                         { label: 'Price Sweet Spot', val: `₹${selectedUser.behavioralMetrics.pricePreference.max / 1000}k`, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
                         { label: 'Search Depth', val: `${selectedUser.behavioralMetrics.searchDepth}/10`, icon: Focus, color: 'text-amber-600', bg: 'bg-amber-50' },
                       ].map((kpi, i) => (
                         <div key={i} className={`p-8 rounded-[40px] ${kpi.bg} border border-white shadow-sm flex flex-col items-center text-center`}>
                            <kpi.icon size={24} className={`${kpi.color} mb-4`} />
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{kpi.label}</p>
                            <p className="text-4xl font-black text-slate-900">{kpi.val}</p>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                     <div className="lg:col-span-8 space-y-16">
                        {/* Price Affinity Radar */}
                        {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && (
                           <section className="space-y-8">
                              <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 border-b border-slate-50 pb-3 flex items-center gap-3">
                                <TrendingUp size={16} /> Financial Affinity Radar
                              </h5>
                              <div className="bg-slate-900 p-10 rounded-[48px] relative overflow-hidden text-white">
                                 <div className="absolute top-0 right-0 p-10 opacity-10"><Zap size={120} /></div>
                                 <div className="relative z-10 flex items-center justify-between mb-10">
                                    <div>
                                       <p className="text-5xl font-black tracking-tighter mb-2">₹{selectedUser.behavioralMetrics.pricePreference.min} - ₹{selectedUser.behavioralMetrics.pricePreference.max}</p>
                                       <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Target Monthly Budget Bracket</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-3xl font-black text-green-400">Elite Tier</p>
                                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Value Class</p>
                                    </div>
                                 </div>
                                 <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="absolute left-1/4 right-1/4 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                                 </div>
                                 <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                                    <span>₹5,000</span>
                                    <span>₹15,000</span>
                                    <span>₹30,000+</span>
                                 </div>
                              </div>
                           </section>
                        )}

                        {/* Granular Activity Log */}
                        <section className="space-y-8">
                           <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 border-b border-slate-50 pb-3 flex items-center gap-3">
                             <Activity size={16} /> High-Fidelity Interaction Schema
                           </h5>
                           <div className="space-y-4">
                              {(selectedUser.activityLog || []).map((log, i) => (
                                <div key={log.id} className="bg-slate-50/50 p-6 rounded-[32px] flex items-center justify-between border border-transparent hover:border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                                   <div className="flex items-center gap-6">
                                      <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm ${
                                        log.importance === 'high' ? 'text-red-500' : log.importance === 'medium' ? 'text-indigo-500' : 'text-slate-400'
                                      } group-hover:scale-110 transition-transform`}>
                                         {log.action.includes('Inquiry') ? <MessageCircle size={22} /> : log.action.includes('Sync') ? <ShieldCheck size={22} /> : <Zap size={22} />}
                                      </div>
                                      <div>
                                         <p className="text-xl font-black text-slate-900">{log.action}</p>
                                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            {log.target}
                                            {log.importance === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                                         </p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                   </div>
                                </div>
                              ))}
                              {(!selectedUser.activityLog || selectedUser.activityLog.length === 0) && (
                                <div className="py-20 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-100">
                                   <p className="text-slate-400 font-bold italic">Zero interaction nodes detected for this session cycle.</p>
                                </div>
                              )}
                           </div>
                        </section>
                     </div>

                     <div className="lg:col-span-4 space-y-10">
                        {/* Explored Features / Facilites Heatmap */}
                        {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && (
                           <section className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3">
                                <Layers size={14} /> Feature Interest Heatmap
                              </h5>
                              <div className="space-y-5">
                                 {selectedUser.behavioralMetrics.topFacilities.map((f, i) => (
                                    <div key={i} className="space-y-2">
                                       <div className="flex justify-between items-center px-1">
                                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{f}</span>
                                          <span className="text-[10px] font-black text-indigo-600">{(95 - (i * 15))}% Intensity</span>
                                       </div>
                                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${95 - (i * 15)}%` }} className="h-full bg-indigo-500 rounded-full" />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </section>
                        )}

                        {/* Top Searched Areas */}
                        {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics && (
                           <section className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                              <div className="absolute -bottom-10 -right-10 opacity-5"><Globe size={150} /></div>
                              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 mb-8 relative z-10 flex items-center gap-3">
                                <MapPin size={14} /> Cluster Preference
                              </h5>
                              <div className="space-y-3 relative z-10">
                                 {selectedUser.behavioralMetrics.topAreas.map((area, i) => (
                                    <div key={i} className="bg-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/20 transition-all cursor-default">
                                       <span className="text-sm font-black tracking-tight">{area}</span>
                                       <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                 ))}
                              </div>
                           </section>
                        )}
                        
                        {/* Owner Specific Asset view remains similar but refined */}
                        {selectedUser.role === UserRole.Owner && (
                           <section className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3">
                                <Building2 size={14} /> Managed Portfolio
                              </h5>
                              <div className="space-y-4">
                                 {userProperties.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                       <img src={p.PhotoMain} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                       <div>
                                          <p className="font-black text-slate-900 text-sm leading-tight">{p.ListingName}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.Area.split(' (')[0]}</p>
                                       </div>
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
    </div>
  );
};

export default AdminDashboard;
