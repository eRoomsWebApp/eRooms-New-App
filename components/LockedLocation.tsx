import React, { useEffect, useState } from 'react';
import { Lock, MapPin, Phone, MessageCircle, Navigation, ExternalLink } from 'lucide-react';
import { Property } from '../types';
import { useLeadCapture } from './LeadCaptureSheet';
import {
  getKnownLeadInfo,
  LEAD_KNOWN_EVENT,
  EROOMS_CALL_TEL,
  EROOMS_WHATSAPP_NUMBER
} from '../utils/tracking';

interface ExactLocation {
  Address: string;
  GoogleMapsPlusCode: string;
}

/**
 * Hostel name, area, rent and facilities are public (good for Google).
 * Exact street address, map pin and phone number are shown only after the
 * visitor gives name + mobile. The address file is loaded on demand, so it is
 * not part of the page that search engines index.
 */
const LockedLocation: React.FC<{ property: Property }> = ({ property }) => {
  const { triggerLeadAction } = useLeadCapture();
  const [unlocked, setUnlocked] = useState(() => getKnownLeadInfo().isComplete);
  const [loc, setLoc] = useState<ExactLocation | null>(null);

  useEffect(() => {
    const onKnown = () => setUnlocked(getKnownLeadInfo().isComplete);
    window.addEventListener(LEAD_KNOWN_EVENT, onKnown);
    return () => window.removeEventListener(LEAD_KNOWN_EVENT, onKnown);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    let alive = true;
    import('../data/hostelsLocation.json')
      .then((m) => {
        const all = (m.default || m) as Record<string, ExactLocation>;
        const hit = all[property.id];
        const fallback: ExactLocation = {
          Address: property.FullAddress || '',
          GoogleMapsPlusCode: property.GoogleMapsPlusCode || ''
        };
        if (alive) setLoc(hit && (hit.Address || hit.GoogleMapsPlusCode) ? hit : fallback);
      })
      .catch(() => alive && setLoc({ Address: property.FullAddress || '', GoogleMapsPlusCode: property.GoogleMapsPlusCode || '' }));
    return () => {
      alive = false;
    };
  }, [unlocked, property.id, property.FullAddress, property.GoogleMapsPlusCode]);

  const phoneDisplay = `+91 ${EROOMS_WHATSAPP_NUMBER.slice(2, 7)} ${EROOMS_WHATSAPP_NUMBER.slice(7)}`;

  if (!unlocked) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-[28px] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exact address & phone</p>
            <p className="text-sm font-black text-slate-900">{property.Area}, Kota, Rajasthan</p>
          </div>
        </div>
        <div className="space-y-2 select-none" aria-hidden="true">
          <div className="h-3 rounded-full bg-slate-200 w-11/12" />
          <div className="h-3 rounded-full bg-slate-200 w-2/3" />
        </div>
        <button
          type="button"
          onClick={() => triggerLeadAction('Unlock Address', property)}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <MapPin size={15} /> Show full address & phone (free)
        </button>
        <p className="text-[10px] font-bold text-slate-400 text-center">Takes 10 seconds · Zero brokerage</p>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(
    loc?.GoogleMapsPlusCode || `${property.ListingName}, ${property.Area}, Kota, Rajasthan`
  );

  return (
    <div className="p-6 bg-white border border-emerald-200 rounded-[28px] space-y-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <MapPin size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Exact address</p>
          <p className="text-sm font-black text-slate-900 leading-snug">
            {loc ? loc.Address || `${property.Area}, Kota, Rajasthan` : 'Loading…'}
          </p>
        </div>
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between hover:bg-blue-600 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
          <Navigation size={16} className="text-blue-400" /> Open location on Google Maps
        </span>
        <ExternalLink size={14} className="opacity-60" />
      </a>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${EROOMS_CALL_TEL}`}
          className="py-3 rounded-2xl bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5"
        >
          <Phone size={14} /> {phoneDisplay}
        </a>
        <a
          href={`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Namaste eRooms, mujhe ${property.ListingName} (${property.Area}) visit karna hai.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      </div>
      <p className="text-[10px] font-bold text-slate-400 text-center">
        Visits are arranged by the eRooms Kota team — please do not pay the hostel any brokerage.
      </p>
    </div>
  );
};

export default LockedLocation;
