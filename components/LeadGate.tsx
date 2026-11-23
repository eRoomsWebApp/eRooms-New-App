import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import {
  getKnownLeadInfo,
  saveKnownLeadInfo,
  normalizeIndianPhone,
  isValidIndianPhone,
  sendGateLead
} from '../utils/tracking';

// Partner / admin pages are never gated.
const UNGATED_PREFIXES = ['/login', '/admin', '/owner', '/student'];

/**
 * Lead-first rule: a visitor must give name + mobile once before seeing hostels.
 * Details are kept in this browser (same keys as the erooms.in enquiry form),
 * so students who already enquired on erooms.in are not asked again.
 * Page content stays in the DOM under the overlay (same for every visitor).
 */
const LeadGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(() => getKnownLeadInfo().isComplete);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isUngated = UNGATED_PREFIXES.some((p) => location.pathname.startsWith(p));
  const showGate = !unlocked && !isUngated;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const normalized = normalizeIndianPhone(phone);
    if (trimmed.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(normalized)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    saveKnownLeadInfo(trimmed, normalized);
    sendGateLead({ name: trimmed, whatsapp: normalized, page: location.pathname });
    setUnlocked(true);
  };

  return (
    <>
      <div aria-hidden={showGate} className={showGate ? 'pointer-events-none select-none blur-sm' : undefined}>
        {children}
      </div>
      {showGate && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                  Verified Kota Hostels
                </p>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Enter your details to view hostels
                </h2>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-semibold mb-5">
              Photos, rent and location of verified hostels and PGs. Our team will help you shortlist and book a free visit.
            </p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full mb-4 px-4 py-3 rounded-2xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="Your name"
            />
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Mobile / WhatsApp Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel"
              className="w-full mb-3 px-4 py-3 rounded-2xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="10-digit mobile number"
            />
            {error && <p className="text-sm font-bold text-red-600 mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              View Hostels
            </button>
            <p className="text-[11px] text-slate-400 font-semibold mt-3 text-center">
              Zero brokerage • Free visit with the eRooms team
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default LeadGate;
