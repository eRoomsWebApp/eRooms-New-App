import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { EROOMS_WHATSAPP_NUMBER, EROOMS_CALL_TEL } from '../utils/tracking';

const TopBar: React.FC = () => {
  const waText = encodeURIComponent(
    'Namaste eRooms, mujhe Kota mein Hostel / PG chahiye.'
  );

  return (
    <div className="bg-slate-900 text-white py-2 px-4 overflow-hidden hidden md:block border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.14em]">
        <div className="flex items-center gap-6">
          <a
            href={`tel:${EROOMS_CALL_TEL}`}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <Phone size={12} className="text-blue-400" />
            <span>+91 93510 99947</span>
          </a>
          <a
            href={`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle size={12} className="text-emerald-400" />
            <span>WhatsApp Support</span>
          </a>
        </div>
        <div className="flex items-center gap-6 text-slate-300">
          <a href="https://www.erooms.in/" className="hover:text-blue-400 transition-colors">
            Main Site
          </a>
          <a
            href={`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
              'Namaste eRooms, mujhe apni property list karni hai.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1 rounded-full transition-all text-[10px] font-black"
          >
            List Property
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
