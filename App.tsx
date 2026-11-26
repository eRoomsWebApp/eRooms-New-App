import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { PropertyProvider } from './context/PropertyContext';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { DEFAULT_CONFIG } from './db';
import { LeadCaptureProvider } from './components/LeadCaptureSheet';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import TopBar from './components/TopBar';
import { useLeadKnown } from './utils/useLeadKnown';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import FriendlyErrorBoundary from './components/FriendlyErrorBoundary';
import { UserRole } from './types';
import { Instagram, Youtube, Phone, MessageCircle } from 'lucide-react';
import { SAMPLE_PREVIEW_PROPERTY } from './data/sampleProperty';
import { getPropertyPath } from './utils/slug';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const PropertyProfile = React.lazy(() => import('./pages/PropertyProfile'));
const LegacyPropertyRedirect = React.lazy(() =>
  import('./pages/PropertyProfile').then(m => ({ default: m.LegacyPropertyRedirect }))
);
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const OwnerDashboard = React.lazy(() => import('./pages/OwnerDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'));
const Login = React.lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const samplePreviewPath = getPropertyPath(SAMPLE_PREVIEW_PROPERTY);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/area/:areaSlug" element={<LandingPage mode="area" />} />
            <Route path="/near/:instituteSlug" element={<LandingPage mode="institute" />} />
            <Route path="/preview" element={<Navigate to={samplePreviewPath} replace />} />
            <Route path="/property/:id" element={<LegacyPropertyRedirect />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole={UserRole.Admin}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute requiredRole={UserRole.Owner}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requiredRole={UserRole.Student}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/:areaSlug/:propertySlugAndId" element={<PropertyProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const leadKnown = useLeadKnown();
  const { config: liveConfig } = useConfig();
  const config = liveConfig || DEFAULT_CONFIG;

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <TopBar />
      <Navbar />
      <main className="flex-grow">
        <AnimatedRoutes />
      </main>
      <MobileNav />

      <footer className="bg-white border-t border-slate-100 py-16 mt-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <p className="font-black text-slate-900 text-2xl mb-3 tracking-tighter">
              eRooms<span className="text-blue-600">.in</span>
            </p>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-xs mx-auto md:mx-0">
              {config.footerText}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-2">Student Support</p>
            <a
              href="tel:+919351099947"
              className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center justify-center md:justify-start gap-2"
            >
              <Phone size={15} /> {leadKnown ? '+91 93510 99947' : 'Call eRooms'}
            </a>
            <a
              href="https://wa.me/919351099947"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center justify-center md:justify-start gap-2"
            >
              <MessageCircle size={15} /> WhatsApp Desk
            </a>
            <Link
              to="/login"
              className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors mt-1"
            >
              Partner Login
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest mb-2">Connect</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href={config.socialLinks?.instagram || 'https://www.instagram.com/erooms.in/'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="eRooms Instagram"
                className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-all"
              >
                <Instagram size={20} />
              </a>
              <a
                href={config.socialLinks?.youtube || 'https://www.youtube.com/@eroomsin'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="eRooms YouTube"
                className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router basename="/hostels">
        <FriendlyErrorBoundary>
          <ConfigProvider>
            <AuthProvider>
              <PropertyProvider>
                <LeadCaptureProvider>
                  <AppContent />
                </LeadCaptureProvider>
              </PropertyProvider>
            </AuthProvider>
          </ConfigProvider>
        </FriendlyErrorBoundary>
      </Router>
    </HelmetProvider>
  );
};

export default App;
