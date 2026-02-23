import React, { useState, useMemo, useEffect } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Property, ListingType, Gender, ApprovalStatus, UserRole, User, UserStatus, AppConfig } from '../types';
import { getAppConfig, saveAppConfig, getMockUsers } from '../db';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, X, Edit, Settings, BarChart3, 
  Building2, Clock, Plus, Trash2, Search, AlertCircle,
  Users, Activity, Globe, HardDrive, Smartphone,
  MoreVertical, ShieldAlert, UserCheck, UserPlus, Zap,
  Mail, Phone, Calendar, MapPin, ExternalLink, ArrowRight,
  Sparkles, ShieldCheck, Heart, UserX, MessageCircle,
  TrendingUp, MousePointer2, Timer, Focus, Target, Layers,
  Layout, Eye, Lock, Server, Wrench, Database, Instagram, Twitter, Linkedin,
  Cpu, Terminal, Command, LayoutGrid
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { properties, approveProperty, deleteProperty } = useProperties();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'config' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  
  // Global Kernel State
  const [config, setConfig] = useState<AppConfig>(getAppConfig());

  useEffect(() => {
    const loadUsers = () => {
      const users = JSON.parse(localStorage.getItem('erooms_registered_users') || '[]');
      const mocks = getMockUsers();
      const uniqueUsers = [...users];
      mocks.forEach(m => {
        if (!uniqueUsers.find(u => u.email === m.email)) uniqueUsers.push(m);
      });
      setRegisteredUsers(uniqueUsers);
    };
    loadUsers();
  }, [activeTab]);

  const handleUpdateConfig = (updates: any) => {
    setIsSyncing(true);
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveAppConfig(newConfig);
    
    // Simulate node synchronization delay
    setTimeout(() => {
      setIsSyncing(false);
      setLastSaved(new Date().toLocaleTimeString());
    }, 800);
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

  const filteredListings = properties.filter(p => 
    p.ListingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = registeredUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const systemLogs = [
    { id: 1, event: 'Node Synchronization', detail: 'Global kernel pushed to all clusters.', time: 'Just now', icon: Zap, color: 'text-amber-500' },
    { id: 2, event: 'Asset Verified', detail: 'Elite narrative "Royal Heights" confirmed.', time: '12m ago', icon: ShieldCheck, color: 'text-green-500' },
    { id: 3, event: 'User Onboarded', detail: 'New host registration: Vikram Singh.', time: '1h ago', icon: UserPlus, color: 'text-blue-500' },
    { id: 4, event: 'Dossier Audit', detail: 'Behavioral metrics updated for scholar ID: aarav-1.', time: '3h ago', icon: Cpu, color: 'text-indigo-500' },
  ];

  const navItems = [
    { id: 'overview', label: 'Command Hub', icon: Command },
    { id: 'listings', label: 'Asset Registry', icon: Building2 },
    { id: 'users', label: 'Node Directory', icon: Users },
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
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Super Admin v2.1</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-12">
               {/* High-Level Pulse */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Asset Nodes', val: stats.totalListings, trend: '+12%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Active Directory', val: stats.totalUsers, trend: '+4 today', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Kernel Health', val: '100%', trend: 'OPTIMAL', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Audit Queue', val: stats.pendingListings, trend: 'ACTION REQ', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <th className="px-12 py-8">Asset Narrative</th>
                      <th className="px-12 py-8">Cluster</th>
                      <th className="px-12 py-8">Monthly Value</th>
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
                              <img src={p.PhotoMain} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-900 tracking-tight">{p.ListingName}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.ListingType} • {p.Gender}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-10 text-sm font-bold text-slate-600">{p.Area}</td>
                        <td className="px-12 py-10">
                          <p className="text-lg font-black text-slate-900">₹{p.RentDouble.toLocaleString()}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase mt-1">Base Rental</p>
                        </td>
                        <td className="px-12 py-10">
                          <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3 ${
                            p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${p.ApprovalStatus === ApprovalStatus.Approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                            {p.ApprovalStatus}
                          </span>
                        </td>
                        <td className="px-12 py-10 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.ApprovalStatus === ApprovalStatus.Pending && (
                              <button onClick={() => approveProperty(p.id)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">Verify</button>
                            )}
                            <button onClick={() => deleteProperty(p.id)} className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </motion.div>
          )}

          {/* NODE DIRECTORY (Users) */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden">
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
                    {filteredUsers.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-12 py-10">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-[24px] overflow-hidden border border-slate-100 flex-shrink-0">
                               <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-900 leading-tight">{u.username}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-10">
                           <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                             u.role === UserRole.Admin ? 'bg-slate-900 text-white' : u.role === UserRole.Owner ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
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
            </motion.div>
          )}

          {/* KERNEL CONTROL (Global Config) */}
          {activeTab === 'config' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-32">
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
               </section>

               {/* Danger Protocol */}
               <section className="bg-red-50 border border-red-100 rounded-[48px] p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                     <h4 className="text-3xl font-black text-red-900 tracking-tighter uppercase mb-2">Factory Reset</h4>
                     <p className="text-red-600/60 font-bold">Wipe platform state and restore initial kernel defaults. <span className="text-red-600 font-black">THIS IS IRREVERSIBLE.</span></p>
                  </div>
                  <button 
                     onClick={() => confirm("Execute Factory Reset?") && handleUpdateConfig({ siteName: 'erooms.in', tagline: 'Future of Student Living' })}
                     className="bg-red-600 text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all"
                  >
                     Initiate Reset
                  </button>
               </section>
            </motion.div>
          )}

          {/* AUDIT TRAIL (Logs) */}
          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="bg-slate-900 border border-white/5 rounded-[48px] p-12 shadow-2xl font-mono">
                  <div className="flex items-center gap-3 mb-10 text-emerald-400">
                     <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                     <span className="text-[11px] font-black uppercase tracking-widest">Real-time Stream Terminal</span>
                  </div>
                  <div className="space-y-6">
                     {systemLogs.map(log => (
                       <div key={log.id} className="flex gap-6 p-6 hover:bg-white/5 transition-all rounded-3xl border border-transparent hover:border-white/5">
                          <div className={`mt-1 ${log.color}`}><log.icon size={20} /></div>
                          <div>
                             <div className="flex items-center gap-4 mb-2">
                                <p className="text-white font-black text-sm uppercase tracking-widest">{log.event}</p>
                                <span className="text-[10px] font-black text-white/20">{log.time}</span>
                             </div>
                             <p className="text-xs text-white/40 leading-relaxed font-bold">{log.detail}</p>
                          </div>
                       </div>
                     ))}
                  </div>
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
                     <img src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} className="w-full h-full object-cover" alt="" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 text-center mb-1 leading-tight">{selectedUser.username}</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-12 flex items-center gap-2">
                     <ShieldCheck size={14} /> Registered Node
                  </p>
                  
                  <div className="w-full space-y-4 mb-16">
                     <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-300 mb-2">Node Compliance</p>
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
                     <button className="w-full py-6 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Transmit Signal</button>
                     <button className="w-full py-6 border border-red-100 text-red-500 rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Revoke Access</button>
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

                  {selectedUser.role === UserRole.Student && selectedUser.behavioralMetrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                       {[
                         { label: 'Avg Pulse Time', val: `${selectedUser.behavioralMetrics.avgSessionTime}m`, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-50' },
                         { label: 'Total Cycles', val: selectedUser.behavioralMetrics.totalSessions, icon: MousePointer2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                         { label: 'Price Affinity', val: `₹${selectedUser.behavioralMetrics.pricePreference.max / 1000}k`, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                         { label: 'Search Depth', val: `${selectedUser.behavioralMetrics.searchDepth}/10`, icon: Focus, color: 'text-amber-600', bg: 'bg-amber-50' },
                       ].map((kpi, i) => (
                         <div key={i} className={`p-10 rounded-[48px] ${kpi.bg} border border-white shadow-sm flex flex-col items-center text-center`}>
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
                                {selectedUser.behavioralMetrics.topAreas.map((area, i) => (
                                   <div key={i} className="px-8 py-5 bg-white rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-indigo-500 transition-colors">
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
                                {selectedUser.activityLog.map((log, i) => (
                                   <div key={i} className="relative pl-12">
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
    </div>
  );
};

export default AdminDashboard;
