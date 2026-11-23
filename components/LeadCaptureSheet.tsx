import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Phone, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { Property } from '../types';
import {
  LeadActionType,
  getKnownLeadInfo,
  saveKnownLeadInfo,
  normalizeIndianPhone,
  isValidIndianPhone,
  sendCompletedLead,
  executeLeadChannelAction
} from '../utils/tracking';

interface PendingLeadRequest {
  action: LeadActionType;
  property: Property;
  instituteFilter?: string;
}

interface LeadCaptureContextType {
  triggerLeadAction: (
    action: LeadActionType,
    property: Property,
    instituteFilter?: string
  ) => void;
}

const LeadCaptureContext = createContext<LeadCaptureContextType | undefined>(undefined);

export const LeadCaptureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingRequest, setPendingRequest] = useState<PendingLeadRequest | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [visitBannerMessage, setVisitBannerMessage] = useState<string | null>(null);

  const finalizeLead = useCallback(
    (req: PendingLeadRequest, name: string, phone: string) => {
      saveKnownLeadInfo(name, phone);
      sendCompletedLead({
        action: req.action,
        property: req.property,
        name,
        whatsapp: phone,
        instituteFilter: req.instituteFilter
      });

      if (req.action === 'Book Free Visit') {
        setVisitBannerMessage('Our team will call you within 30 minutes');
        setTimeout(() => setVisitBannerMessage(null), 6000);
      }

      executeLeadChannelAction(req.action, req.property);
    },
    []
  );

  const triggerLeadAction = useCallback(
    (action: LeadActionType, property: Property, instituteFilter?: string) => {
      const known = getKnownLeadInfo();
      const req: PendingLeadRequest = { action, property, instituteFilter };
      if (known.isComplete) {
        finalizeLead(req, known.name, known.phone);
        return;
      }
      setNameInput(known.name);
      setPhoneInput(known.phone);
      setFormError(null);
      setPendingRequest(req);
    },
    [finalizeLead]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRequest) return;

    const trimmedName = nameInput.trim();
    const normalizedPhone = normalizeIndianPhone(phoneInput);

    if (trimmedName.length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(normalizedPhone)) {
      setFormError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const req = pendingRequest;
    setPendingRequest(null);
    finalizeLead(req, trimmedName, normalizedPhone);
  };

  return (
    <LeadCaptureContext.Provider value={{ triggerLeadAction }}>
      {children}

      {/* Confirmation Toast for Book Free Visit */}
      <AnimatePresence>
        {visitBannerMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[150] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md w-[92%] border border-emerald-400"
          >
            <CheckCircle2 size={20} className="flex-shrink-0" />
            <p className="text-sm font-black tracking-tight">{visitBannerMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Lead Form */}
      <AnimatePresence>
        {pendingRequest && (
          <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingRequest(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border border-slate-100 z-10"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {pendingRequest.action === 'Get Details on WhatsApp' && <MessageCircle size={22} />}
                    {pendingRequest.action === 'Call eRooms' && <Phone size={22} />}
                    {pendingRequest.action === 'Book Free Visit' && <Calendar size={22} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {pendingRequest.action}
                    </p>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight line-clamp-1">
                      {pendingRequest.property.ListingName}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRequest(null)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                    Student / Parent Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter your name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none font-bold text-slate-900 text-sm"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-600 px-1">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Continue to {pendingRequest.action}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LeadCaptureContext.Provider>
  );
};

export const useLeadCapture = () => {
  const ctx = useContext(LeadCaptureContext);
  if (!ctx) throw new Error('useLeadCapture must be used within a LeadCaptureProvider');
  return ctx;
};
