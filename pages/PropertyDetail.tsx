
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProperties } from '../context/PropertyContext';
import { Gender } from '../types';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { properties, loading } = useProperties();
  const property = properties.find(p => p.id === id);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
     </div>
  );
  if (!property) return <div className="p-20 text-center">Property not found. <Link to="/" className="text-indigo-600">Go Home</Link></div>;

  const sortedMatrix = [...property.InstituteDistanceMatrix].sort((a, b) => a.distance - b.distance);

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4">
      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6"
      >
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
              property.Gender === Gender.Boys ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'
            }`}>
              {property.Gender} Exclusive
            </span>
            <span className="text-slate-400 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-full">Plus Code: {property.GoogleMapsPlusCode}</span>
            <span className="bg-green-100 text-green-700 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Verified
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-2 tracking-tighter">{property.ListingName}</h1>
          <p className="text-slate-500 font-bold text-lg md:text-xl max-w-3xl flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {property.FullAddress}
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <a 
            href={`https://wa.me/${property.OwnerWhatsApp}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-green-500 text-white px-8 py-5 rounded-[24px] font-black text-lg hover:bg-green-600 transition-all shadow-xl shadow-green-200 hover:-translate-y-1 active:scale-95"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.185-.573c.948.517 2.094.887 3.144.887 3.181 0 5.767-2.586 5.767-5.766 0-3.181-2.586-5.767-5.767-5.767zm3.39 8.017c-.147.414-.714.757-1.168.803-.454.047-.954.02-1.574-.18-.621-.2-1.056-.411-1.782-.729-1.427-.624-2.331-2.071-2.402-2.166-.07-.094-.572-.76-.572-1.45s.364-1.03.493-1.166c.129-.135.281-.17.375-.17s.188 0 .269.005c.081.005.188-.031.294.223.106.254.364.888.399.957.035.069.059.15.012.245-.047.095-.07.153-.141.236-.07.082-.148.183-.211.246-.07.069-.143.144-.062.285.082.141.364.602.781 1.012.538.53 1.002.695 1.154.761.152.066.241.054.331-.047.091-.101.391-.453.496-.607.106-.154.212-.129.358-.076.147.054.928.438 1.087.517.16.079.266.118.305.184.039.066.039.382-.108.796z"/></svg>
            Contact Owner
          </a>
        </div>
      </motion.div>

      {/* Bento Grid Photo Gallery */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[600px] mb-16"
      >
        <div className="md:col-span-2 md:row-span-2 rounded-[32px] overflow-hidden group relative border border-slate-100">
          <img src={property.PhotoMain} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="Main View" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
             <p className="text-white font-black text-xl">Property Exterior</p>
          </div>
        </div>
        <div className="md:col-span-2 md:row-span-1 rounded-[32px] overflow-hidden group relative border border-slate-100">
          <img src={property.PhotoRoom} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="Living Space" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
             <p className="text-white font-black text-xl">Private Room</p>
          </div>
        </div>
        <div className="md:col-span-1 md:row-span-1 rounded-[32px] overflow-hidden group relative border border-slate-100">
          <img src={property.PhotoWashroom} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="Bathroom" />
        </div>
        <div className="md:col-span-1 md:row-span-1 rounded-[32px] overflow-hidden bg-slate-900 border border-slate-900 flex flex-col items-center justify-center text-white text-center p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/><circle cx="12" cy="9" r="2.5"/></svg></div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 mb-3 relative z-10">Area Focus</p>
          <p className="text-2xl font-black tracking-tight relative z-10">{property.Area}</p>
          <p className="text-xs font-medium text-white/50 mt-4 relative z-10">Premium Location</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Content (8 Cols) */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Financials Card */}
          <section>
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Financial Transparency</h2>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Single Occupancy', val: `₹${property.RentSingle.toLocaleString()}`, sub: 'per month' },
                 { label: 'Double Occupancy', val: `₹${property.RentDouble.toLocaleString()}`, sub: 'per month', highlight: true },
                 { label: 'Electricity', val: `₹${property.ElectricityCharges}`, sub: 'per unit consumed' },
                 { label: 'Maintenance', val: `₹${property.Maintenance.toLocaleString()}`, sub: 'one-time fix' }
               ].map((item, idx) => (
                 <div key={idx} className={`rounded-[24px] p-6 border transition-all ${item.highlight ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-900'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${item.highlight ? 'text-white/60' : 'text-slate-400'}`}>{item.label}</p>
                    <p className="text-3xl font-black mb-1">{item.val}</p>
                    <p className={`text-xs font-bold ${item.highlight ? 'text-white/40' : 'text-slate-300'}`}>{item.sub}</p>
                 </div>
               ))}
             </div>
             
             <div className="mt-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[24px] p-6">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security Deposit Terms</p>
                   <p className="font-bold text-slate-900 leading-relaxed">{property.SecurityTerms}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-6 flex items-center justify-between min-w-[300px]">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Parents Stay</p>
                     <p className="font-black text-2xl text-amber-900">₹{property.ParentsStayCharge} <span className="text-xs font-bold opacity-60">/ day</span></p>
                   </div>
                   <div className="bg-amber-200/50 p-3 rounded-2xl text-amber-900">
                      🏠
                   </div>
                </div>
             </div>
          </section>

          {/* Proximity Matrix */}
          <section>
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.447-1.894L9 7m6 13l5.447-2.724A2 2 0 0021 15.382V5.618a2 2 0 00-1.447-1.894L15 7m-6 13V7m6 13V7m-6 0l6 0"/></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institute Proximity Matrix</h2>
             </div>
             
             <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 divide-y divide-slate-50">
                  {sortedMatrix.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                             {idx + 1}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{item.name}</p>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Coaching Center</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">{item.distance} <span className="text-xs">KM</span></p>
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">~{Math.ceil(item.distance * 12)} MINS WALK</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </section>

          {/* Facilities */}
          <section>
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Premium Amenities</h2>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.Facilities.map(f => (
                  <div key={f} className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm hover:border-indigo-200 transition-colors">
                     <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-lg">✨</div>
                     <span className="font-bold text-slate-700">{f}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Sidebar Management (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="sticky top-28 space-y-6">
              
              {/* Owner Card */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-200/50">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Property Ownership</p>
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl font-black text-indigo-600">
                       {property.OwnerName[0]}
                    </div>
                    <div>
                       <p className="text-xl font-black text-slate-900">{property.OwnerName}</p>
                       <p className="text-sm font-bold text-slate-400">Direct Owner</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Registered Email</p>
                       <p className="font-bold text-slate-700 text-sm truncate">{property.OwnerEmail}</p>
                    </div>
                    <a 
                      href={`tel:${property.OwnerWhatsApp}`}
                      className="w-full flex items-center justify-center gap-2 py-5 bg-slate-900 text-white rounded-[24px] font-black hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Instant Callback
                    </a>
                 </div>
              </div>

              {/* Warden Card */}
              <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500 rounded-full blur-[60px] opacity-20"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-6">Emergency Management</p>
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <p className="text-xl font-black mb-1">{property.WardenName}</p>
                       <p className="text-xs font-bold text-white/50 uppercase tracking-widest">On-Site Warden</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">👮</div>
                 </div>
                 <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mb-2">
                    <p className="text-[10px] font-black uppercase text-red-400 mb-2">24/7 Security Hotline</p>
                    <p className="text-2xl font-black tracking-widest font-mono text-red-50">{property.EmergencyContact}</p>
                 </div>
                 <p className="text-[10px] text-white/30 text-center font-bold">Warden availability is mandatory for all students</p>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
