
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, IndianRupee, MapPin, 
  Camera, Check, Plus, User, ShieldAlert,
  Sparkles, Loader2
} from 'lucide-react';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { useConfig } from '../context/ConfigContext';
import { transformDriveUrl } from '../utils/urlHelper';
import { normalizePhone, parseRent } from '../utils/normalization';
import { savePropertyDraft, getPropertyDraft, clearPropertyDraft } from '../db';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (property: Property) => void;
  initialData?: Property;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
}

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, 
  ownerId, ownerName, ownerEmail, ownerPhone 
}) => {
  const { config } = useConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const areas = config?.areas || [];
  const institutes = config?.institutes || [];
  const facilityOptions = config?.facilities || [];

  const [formData, setFormData] = useState<Partial<Property>>({
    ListingName: initialData?.ListingName || '',
    ListingType: initialData?.ListingType || ListingType.Hostel,
    Gender: initialData?.Gender || Gender.Boys,
    Area: initialData?.Area || areas[0] || '',
    FullAddress: initialData?.FullAddress || '',
    GoogleMapsPlusCode: initialData?.GoogleMapsPlusCode || '',
    RentSingle: Array.isArray(initialData?.RentSingle) ? initialData.RentSingle : [12000],
    RentDouble: Array.isArray(initialData?.RentDouble) ? initialData.RentDouble : [10500],
    SecurityTerms: initialData?.SecurityTerms || '1 Month Security Deposit',
    ElectricityCharges: initialData?.ElectricityCharges || 10,
    Maintenance: initialData?.Maintenance || 1000,
    ParentsStayCharge: initialData?.ParentsStayCharge || 500,
    Facilities: initialData?.Facilities || [],
    PhotoMain: initialData?.PhotoMain || '',
    PhotoRoom: initialData?.PhotoRoom || '',
    PhotoWashroom: initialData?.PhotoWashroom || '',
    InstituteDistanceMatrix: initialData?.InstituteDistanceMatrix || institutes.map(name => ({ name, distance: 1.0 })),
    WardenName: initialData?.WardenName || '',
    EmergencyContact: initialData?.EmergencyContact || '',
    OwnerWhatsApp: initialData?.OwnerWhatsApp || ownerPhone || '',
    OwnerEmail: initialData?.OwnerEmail || ownerEmail || '',
    OwnerName: initialData?.OwnerName || ownerName || '',
    ApprovalStatus: initialData?.ApprovalStatus || ApprovalStatus.Approved, // Default to Approved for immediate feedback
    views: initialData?.views || 0,
    leadsCount: initialData?.leadsCount || 0
  });

  // Update default Area if config loads and no initialData
  useEffect(() => {
    if (!initialData && areas.length > 0 && !formData.Area) {
      setFormData(prev => ({ ...prev, Area: areas[0] }));
    }
  }, [areas, initialData]);

  // Update default InstituteDistanceMatrix if config loads and no initialData
  useEffect(() => {
    if (!initialData && institutes.length > 0 && (!formData.InstituteDistanceMatrix || formData.InstituteDistanceMatrix.length === 0)) {
      setFormData(prev => ({ ...prev, InstituteDistanceMatrix: institutes.map(name => ({ name, distance: 1.0 })) }));
    }
  }, [institutes, initialData]);

  // Load draft on mount if creating new
  React.useEffect(() => {
    if (!initialData && isOpen) {
      const draft = getPropertyDraft();
      if (draft) {
        setFormData(prev => ({ ...prev, ...draft }));
      }
    }
  }, [initialData, isOpen]);

  // Save draft on change
  React.useEffect(() => {
    if (!initialData && isOpen && !isSuccess) {
      savePropertyDraft(formData);
    }
  }, [formData, initialData, isOpen, isSuccess]);

  const handleClose = () => {
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleFacilityToggle = (facility: string) => {
    const current = formData.Facilities || [];
    if (current.includes(facility)) {
      setFormData({ ...formData, Facilities: current.filter(f => f !== facility) });
    } else {
      setFormData({ ...formData, Facilities: [...current, facility] });
    }
  };

  const handleDistanceChange = (name: string, distance: number) => {
    const matrix = [...(formData.InstituteDistanceMatrix || [])];
    const index = matrix.findIndex(i => i.name === name);
    if (index >= 0) {
      matrix[index] = { ...matrix[index], distance };
    } else {
      matrix.push({ name, distance, unit: 'km' });
    }
    setFormData({ ...formData, InstituteDistanceMatrix: matrix });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate processing
    await new Promise(r => setTimeout(r, 1500));

    const property: Property = {
      ...formData as Property,
      id: initialData?.id || `prop-${Date.now()}`,
      ownerId: ownerId,
      OwnerWhatsApp: normalizePhone(formData.OwnerWhatsApp || ''),
      EmergencyContact: normalizePhone(formData.EmergencyContact || ''),
      RentSingle: parseRent(formData.RentSingle),
      RentDouble: parseRent(formData.RentDouble),
      PhotoMain: transformDriveUrl(formData.PhotoMain || ''),
      PhotoRoom: transformDriveUrl(formData.PhotoRoom || ''),
      PhotoWashroom: transformDriveUrl(formData.PhotoWashroom || ''),
      ApprovalStatus: initialData?.ApprovalStatus || ApprovalStatus.Approved, // Auto-approve for now
      views: initialData?.views || 0,
      leadsCount: initialData?.leadsCount || 0,
      isFeatured: initialData?.isFeatured || false,
      priorityScore: initialData?.priorityScore || 0
    };
    
    onSubmit(property);
    setIsSubmitting(false);
    setIsSuccess(true);
    clearPropertyDraft();
    
    // Close after a short delay to show success
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[64px] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                  {initialData ? 'Edit Asset Node' : 'Asset Registration'}
                </h2>
                <p className="text-sm font-bold text-slate-400 mt-1">
                  {initialData ? 'Update your property specifications.' : 'Onboard a new property to the Kota network.'}
                </p>
              </div>
              <button onClick={handleClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 relative">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[48px] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100">
                    <Sparkles size={64} />
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Asset Registered!</h2>
                  <p className="text-slate-400 font-bold max-w-md leading-relaxed">
                    Your property node has been successfully integrated into the Kota cluster. It is now live and discoverable by scholars.
                  </p>
                  <div className="mt-12 flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                    <Check size={16} /> Redirecting to Dashboard...
                  </div>
                </motion.div>
              ) : null}

              <form id="property-form" onSubmit={handleSubmit} className={`space-y-16 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                
                  {/* Validation Alerts */}
                  {initialData?.ValidationIssues && initialData.ValidationIssues.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 p-10 rounded-[48px] mb-12">
                      <div className="flex items-center gap-4 mb-6 text-rose-600">
                        <ShieldAlert size={28} />
                        <h4 className="text-xl font-black uppercase tracking-tight">Audit Flags Detected</h4>
                      </div>
                      <ul className="space-y-3">
                        {initialData.ValidationIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-rose-900/70 font-bold text-sm">
                            <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-rose-400">
                        Please rectify the flagged fields before final verification.
                      </p>
                    </div>
                  )}

                {/* Section 1: Basic Identity */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Building2 size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Basic Identity</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex justify-between items-center">
                        Listing Name
                        {initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('name')) && (
                          <span className="text-rose-500 flex items-center gap-1"><ShieldAlert size={10} /> Required</span>
                        )}
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Elite Heights"
                        className={`w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all ${
                          initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('name')) ? 'ring-2 ring-rose-200 bg-rose-50/30' : ''
                        }`}
                        value={formData.ListingName}
                        onChange={e => setFormData({...formData, ListingName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none"
                          value={formData.ListingType}
                          onChange={e => setFormData({...formData, ListingType: e.target.value as ListingType})}
                        >
                          {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Gender</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none"
                          value={formData.Gender}
                          onChange={e => setFormData({...formData, Gender: e.target.value as Gender})}
                        >
                          {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Area / Cluster</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none"
                        value={formData.Area}
                        onChange={e => setFormData({...formData, Area: e.target.value})}
                      >
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Google Maps Plus Code</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 5P98+W2 Kota"
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={formData.GoogleMapsPlusCode}
                        onChange={e => setFormData({...formData, GoogleMapsPlusCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Address</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Enter complete physical address..."
                      className="w-full bg-slate-50 border-none rounded-[32px] py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                      value={formData.FullAddress}
                      onChange={e => setFormData({...formData, FullAddress: e.target.value})}
                    />
                  </div>
                </section>

                {/* Section 2: Pricing & Terms */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><IndianRupee size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pricing & Terms</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rent (Single)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={Array.isArray(formData.RentSingle) ? (isNaN(formData.RentSingle[0]) ? '' : formData.RentSingle[0]) : (isNaN(Number(formData.RentSingle)) ? '' : formData.RentSingle)}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, RentSingle: isNaN(val) ? [] : [val]});
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rent (Double)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={Array.isArray(formData.RentDouble) ? (isNaN(formData.RentDouble[0]) ? '' : formData.RentDouble[0]) : (isNaN(Number(formData.RentDouble)) ? '' : formData.RentDouble)}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, RentDouble: isNaN(val) ? [] : [val]});
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Elec. (Unit)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={isNaN(Number(formData.ElectricityCharges)) ? '' : formData.ElectricityCharges}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, ElectricityCharges: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Maintenance</label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={isNaN(Number(formData.Maintenance)) ? '' : formData.Maintenance}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, Maintenance: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Parents Stay Charge (Per Day)</label>
                      <input 
                        required
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={isNaN(Number(formData.ParentsStayCharge)) ? '' : formData.ParentsStayCharge}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, ParentsStayCharge: isNaN(val) ? 0 : val});
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Security Deposit Terms</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={formData.SecurityTerms}
                        onChange={e => setFormData({...formData, SecurityTerms: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                {/* Section 3: Visual Assets */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Camera size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visual Assets</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex justify-between items-center">
                        Main Cover Image URL
                        {initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('photo')) && (
                          <span className="text-rose-500 flex items-center gap-1"><ShieldAlert size={10} /> Required</span>
                        )}
                      </label>
                      <div className="flex gap-4">
                        <div className={`w-24 h-24 rounded-3xl bg-slate-100 overflow-hidden flex-shrink-0 border transition-all ${
                          initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('photo')) ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-slate-200'
                        }`}>
                          {formData.PhotoMain ? (
                            <img src={transformDriveUrl(formData.PhotoMain)} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={24} /></div>
                          )}
                        </div>
                        <input 
                          required
                          type="url" 
                          placeholder="https://images.unsplash.com/..."
                          className={`flex-grow bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all ${
                            initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('photo')) ? 'ring-2 ring-rose-200 bg-rose-50/30' : ''
                          }`}
                          value={formData.PhotoMain}
                          onChange={e => setFormData({...formData, PhotoMain: transformDriveUrl(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Room View URL</label>
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {formData.PhotoRoom ? (
                              <img src={transformDriveUrl(formData.PhotoRoom)} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={20} /></div>
                            )}
                          </div>
                          <input 
                            required
                            type="url" 
                            placeholder="https://..."
                            className="flex-grow bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                            value={formData.PhotoRoom}
                            onChange={e => setFormData({...formData, PhotoRoom: transformDriveUrl(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Washroom View URL</label>
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {formData.PhotoWashroom ? (
                              <img src={transformDriveUrl(formData.PhotoWashroom)} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={20} /></div>
                            )}
                          </div>
                          <input 
                            required
                            type="url" 
                            placeholder="https://..."
                            className="flex-grow bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                            value={formData.PhotoWashroom}
                            onChange={e => setFormData({...formData, PhotoWashroom: transformDriveUrl(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Facilities */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Check size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Facilities & Amenities</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {facilityOptions.map(facility => (
                      <button
                        key={facility}
                        type="button"
                        onClick={() => handleFacilityToggle(facility)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                          formData.Facilities?.includes(facility)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                          formData.Facilities?.includes(facility) ? 'bg-white/20' : 'bg-slate-50'
                        }`}>
                          {formData.Facilities?.includes(facility) && <Check size={12} />}
                        </div>
                        <span className="text-xs font-bold">{facility}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Section 5: Proximity Matrix */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><MapPin size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Proximity Matrix (KM)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {institutes.map((name, index) => {
                      const item = formData.InstituteDistanceMatrix?.find(i => i.name === name) || { name, distance: 1.0 };
                      return (
                        <div key={name} className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{name}</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.1"
                              className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                              value={isNaN(Number(item.distance)) ? '' : item.distance}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                handleDistanceChange(name, isNaN(val) ? 0 : val);
                              }}
                            />
                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">KM</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Section 6: Operations & Contact */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><User size={20} /></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Operations & Contact</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Warden / Manager Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={formData.WardenName}
                        onChange={e => setFormData({...formData, WardenName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Emergency Contact</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={formData.EmergencyContact}
                        onChange={e => setFormData({...formData, EmergencyContact: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex justify-between items-center">
                        Owner WhatsApp
                        {initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('phone')) && (
                          <span className="text-rose-500 flex items-center gap-1"><ShieldAlert size={10} /> Required</span>
                        )}
                      </label>
                      <input 
                        required
                        type="text" 
                        className={`w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all ${
                          initialData?.ValidationIssues?.some(i => i.toLowerCase().includes('phone')) ? 'ring-2 ring-rose-200 bg-rose-50/30' : ''
                        }`}
                        value={formData.OwnerWhatsApp}
                        onChange={e => setFormData({...formData, OwnerWhatsApp: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Owner Email</label>
                      <input 
                        required
                        type="email" 
                        className="w-full bg-slate-50 border-none rounded-3xl py-5 px-8 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 transition-all"
                        value={formData.OwnerEmail}
                        onChange={e => setFormData({...formData, OwnerEmail: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                <div className="bg-indigo-50 p-10 rounded-[48px] flex items-start gap-6 border border-indigo-100">
                  <ShieldAlert className="text-indigo-600 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2">Host Compliance Protocol</h4>
                    <p className="text-xs font-bold text-indigo-900/60 leading-relaxed">
                      By submitting these specifications, you certify that all visual assets and proximity data are accurate as of today. Misrepresentation of facilities or distances may lead to permanent node suspension from the Kota cluster.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-12 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button 
                type="button"
                onClick={handleClose}
                className="flex-1 bg-white border border-slate-200 text-slate-500 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                form="property-form"
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="flex-[2] bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  initialData ? <Check size={18} /> : <Plus size={18} />
                )}
                {isSubmitting ? 'Processing Node...' : (initialData ? 'Update Specifications' : 'Initialize Audit & Register')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PropertyFormModal;
