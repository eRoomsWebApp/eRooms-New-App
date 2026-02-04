
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PropertyProvider } from './context/PropertyContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import PropertyProfile from './pages/PropertyProfile';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import { getAppConfig, CONFIG_UPDATED_EVENT } from './db';
import { Instagram, Twitter, Linkedin } from 'lucide-react';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyProfile />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole={UserRole.Admin}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Owner Routes */}
        <Route 
          path="/owner/dashboard" 
          element={
            <ProtectedRoute requiredRole={UserRole.Owner}>
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState(getAppConfig());

  useEffect(() => {
    const handleSync = (e: any) => {
      setConfig(e.detail);
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
  }, []);

  return (
    <AuthProvider>
      <PropertyProvider>
        <Router>
          <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
            <TopBar />
            <Navbar />
            <main className="flex-grow">
              <AnimatedRoutes />
            </main>
            
            <footer className="bg-white border-t border-slate-100 py-20 mt-20 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                <div>
                  <p className="font-black text-slate-900 text-3xl mb-4 tracking-tighter">{config.siteName}</p>
                  <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-xs mx-auto md:mx-0">
                    {config.footerText}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-4">Company</p>
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Our Story</a>
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Safety Standards</a>
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Local Areas</a>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-4">Support</p>
                  <a href={`mailto:${config.supportEmail}`} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Official Email</a>
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Student Help</a>
                  <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Cloud Policy</a>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">© 2025 {config.siteName} Kota. All Rights Reserved.</p>
                <div className="flex gap-6">
                   <a href={config.socialLinks.instagram} target="_blank" className="text-slate-400 hover:text-pink-600 transition-all"><Instagram size={20} /></a>
                   <a href={config.socialLinks.twitter} target="_blank" className="text-slate-400 hover:text-blue-400 transition-all"><Twitter size={20} /></a>
                   <a href={config.socialLinks.linkedin} target="_blank" className="text-slate-400 hover:text-blue-700 transition-all"><Linkedin size={20} /></a>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </PropertyProvider>
    </AuthProvider>
  );
};

export default App;
