
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, FileSpreadsheet, Download, 
  CheckCircle2, AlertCircle, Loader2, Trash2,
  Edit3, Save, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { 
  normalizePhone, 
  parseRent, 
  parseDistanceMatrix, 
  parseMultiLinks, 
  geocodePlusCode,
  standardizeArea
} from '../utils/normalization';
import { transformDriveUrl } from '../utils/urlHelper';
import { getAppConfig } from '../db';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (properties: Omit<Property, 'id'>[]) => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const config = getAppConfig();
  const [stagingData, setStagingData] = useState<Omit<Property, 'id'>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateProperty = (p: Omit<Property, 'id'>) => {
    const errors: string[] = [];
    if (!p.ListingName || p.ListingName === 'Unlabeled Asset') errors.push('Missing Name');
    if (!p.PhotoMain) errors.push('Missing Main Photo');
    if (p.OwnerWhatsApp.length < 10) errors.push('Invalid Phone');
    if (!p.Area) errors.push('Missing Area');
    if (p.RentSingle.length === 0 && p.RentDouble.length === 0) errors.push('Missing Rent');
    return errors;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        
        if (rawData.length === 0) {
          setError("The uploaded file is empty.");
          setIsProcessing(false);
          return;
        }

        const processed = rawData.map(row => {
          const getAllValues = (patterns: string[]): string[] => {
            const values: string[] = [];
            const rowKeys = Object.keys(row);
            for (const pattern of patterns) {
              for (const key of rowKeys) {
                if (key === pattern || key.startsWith(`${pattern}_`)) {
                  const val = row[key];
                  if (val) values.push(...parseMultiLinks(String(val)));
                }
              }
            }
            return values;
          };

          const getValue = (keys: string[]): unknown => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
            }
            return undefined;
          };

          const rentSingleRaw = getValue(['What is the monthly rent? (Single Room Actual Price)', 'Single Room', 'RentSingle']);
          const rentDoubleRaw = getValue(['What is the monthly rent? (Double Room Actual Price)', 'Double Room', 'RentDouble']);
          const extraPhotos = getAllValues(['Extra Photos', 'Office Photos', 'Hostel Reception Photo', 'Dining Area']);
          
          const distancesUnder750 = getValue(['Institute Nearby Property (Under 750m)']);
          const distancesAbove750 = getValue(['Institute Nearby Property (Above 750m)']);
          const mandirMasjid = getValue(['Mandir / Majid / Gurudwara / Church Near by']);
          const hospital = getValue(['Hospital Name / Km from Hostel']);

          const combinedDistances = [
            ...(distancesUnder750 ? parseDistanceMatrix(String(distancesUnder750)) : []),
            ...(distancesAbove750 ? parseDistanceMatrix(String(distancesAbove750)) : []),
            ...(mandirMasjid ? parseDistanceMatrix(String(mandirMasjid)) : []),
            ...(hospital ? parseDistanceMatrix(String(hospital)) : [])
          ];

          return {
            ownerId: 'admin-bulk',
            ListingName: String(getValue(['Listing Name', 'ListingName']) || 'Unlabeled Asset'),
            ListingType: (getValue(['Listing Type', 'ListingType']) as ListingType) || ListingType.Hostel,
            Gender: (getValue(['Category Type', 'Gender']) as Gender) || Gender.Boys,
            OwnerName: String(getValue(['Owner Name', 'OwnerName']) || 'Unknown Host'),
            OwnerWhatsApp: normalizePhone(String(getValue(['Owner Contact Number', 'OwnerWhatsApp']) || '')),
            WardenName: String(getValue(['Warden Name', 'WardenName']) || 'On-Call Security'),
            EmergencyContact: normalizePhone(String(getValue(['Office Contact Number', 'EmergencyContact']) || '')),
            OwnerEmail: String(getValue(['Email ID', 'OwnerEmail']) || 'contact@erooms.in'),
            Area: standardizeArea(String(getValue(['Area']) || ''), config.areas),
            FullAddress: String(getValue(['Property Full Address', 'FullAddress']) || ''),
            GoogleMapsPlusCode: String(getValue(['Property Location', 'GoogleMapsPlusCode']) || ''),
            InstituteDistanceMatrix: combinedDistances,
            RentSingle: parseRent(rentSingleRaw),
            RentDouble: parseRent(rentDoubleRaw),
            RentSingleDetails: String(rentSingleRaw || ''),
            RentDoubleDetails: String(rentDoubleRaw || ''),
            SecurityTerms: '1 Month Security Deposit',
            ElectricityCharges: Number(getValue(['Electricity Unit Charge', 'ElectricityCharges']) || 0),
            Maintenance: Number(getValue(['Maintenance']) || 0),
            ParentsStayCharge: Number(getValue(['Parents Stay Charge']) || 0),
            Facilities: parseMultiLinks(String(getValue(['INCLUDING RENT', 'Facilities']) || '')),
            PhotoMain: transformDriveUrl(String(getValue(['Hostel Front Photo', 'PhotoMain']) || '')) || '',
            PhotoRoom: transformDriveUrl(String(getValue(['Property Rooms Photos (Single)', 'PhotoRoom']) || '')) || '',
            PhotoWashroom: transformDriveUrl(String(getValue(['Bathroom Photos', 'PhotoWashroom']) || '')) || '',
            PhotosGallery: extraPhotos.map(url => transformDriveUrl(url)).filter(Boolean) as string[],
            SecurityDeposit: '1 Month Advance',
            ApprovalStatus: ApprovalStatus.Approved,
            views: 0,
            leadsCount: 0,
            rating: 5
          };
        });

        setStagingData(processed);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setError("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpdateStaging = (index: number, updates: Partial<Omit<Property, 'id'>>) => {
    const newData = [...stagingData];
    newData[index] = { ...newData[index], ...updates };
    setStagingData(newData);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Listing Name": "Sample PG Name",
        "Listing Type": "PG",
        "Category Type": "Boys",
        "Owner Name": "John Doe",
        "Owner Contact Number": "919876543210",
        "Warden Name": "Jane Smith",
        "Office Contact Number": "919876543211",
        "Email ID": "owner@example.com",
        "Area": "Landmark City",
        "Property Full Address": "Plot 123, Landmark City, Kunhari, Kota",
        "Property Location": "5V2X+XF Kota, Rajasthan",
        "What is the monthly rent? (Single Room Actual Price)": "12,000/-",
        "What is the monthly rent? (Double Room Actual Price)": "8,000/-",
        "Electricity Unit Charge": 10,
        "Maintenance": 500,
        "Parents Stay Charge": 200,
        "INCLUDING RENT": "AC, WiFi, Laundry, Mess",
        "Institute Nearby Property (Under 750m)": "ALLEN SUPATH-450M",
        "Hostel Front Photo": "https://drive.google.com/open?id=...",
        "Property Rooms Photos (Single)": "https://drive.google.com/open?id=...",
        "Bathroom Photos": "https://drive.google.com/open?id=...",
        "Extra Photos": "https://drive.google.com/open?id=..., https://drive.google.com/open?id=..."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Property_Bulk_Upload_Template.xlsx");
  };

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    setGeocodingProgress(0);

    const total = stagingData.length;
    
    // Geocode each property in the background and attach validation issues
    const processedProperties = [];
    for (let i = 0; i < total; i++) {
      const p = stagingData[i];
      const issues = validateProperty(p);
      const coords = await geocodePlusCode(p.GoogleMapsPlusCode || '');
      
      processedProperties.push({
        ...p,
        lat: coords?.lat,
        lng: coords?.lng,
        ValidationIssues: issues.length > 0 ? issues : undefined
      });
      setGeocodingProgress(Math.round(((i + 1) / total) * 100));
    }

    onUpload(processedProperties);
    setIsUploading(false);
    setGeocodingProgress(0);
    setStagingData([]);
    onClose();
  };

  const stats = useMemo(() => {
    const total = stagingData.length;
    const withErrors = stagingData.filter(p => validateProperty(p).length > 0).length;
    return { total, withErrors, valid: total - withErrors };
  }, [stagingData]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-7xl max-h-[95vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bulk Node Registration</h2>
                <p className="text-sm font-bold text-slate-400">Upload, Review, and Confirm properties.</p>
              </div>
              <div className="flex items-center gap-4">
                {stagingData.length > 0 && (
                  <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase">Total</p>
                      <p className="text-lg font-black text-slate-900 leading-none">{stats.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-emerald-400 uppercase">Valid</p>
                      <p className="text-lg font-black text-emerald-600 leading-none">{stats.valid}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-rose-400 uppercase">Issues</p>
                      <p className="text-lg font-black text-rose-600 leading-none">{stats.withErrors}</p>
                    </div>
                  </div>
                )}
                <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-8 flex flex-col">
              {stagingData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 py-12">
                  <div className="w-32 h-32 bg-indigo-50 rounded-[40px] flex items-center justify-center text-indigo-600">
                    <FileSpreadsheet size={64} />
                  </div>
                  
                  <div className="text-center max-w-md">
                    <h3 className="text-xl font-black text-slate-900 uppercase">No Data Loaded</h3>
                    <p className="text-slate-400 font-bold mt-2">Download our template, fill it with your property details, and upload it here.</p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={downloadTemplate}
                      className="flex items-center gap-3 bg-white border-2 border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      <Download size={18} /> Download Template
                    </button>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
                    >
                      <Upload size={18} /> Upload Excel
                    </button>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                  />

                  {error && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100">
                      <AlertCircle size={18} />
                      <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase">Staging Area</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit rows directly. Red cells indicate critical issues.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStagingData([])}
                      className="text-red-500 hover:text-red-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 size={16} /> Clear & Restart
                    </button>
                  </div>

                  <div className="flex-1 border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-inner bg-slate-50/30">
                    <div className="overflow-auto custom-scrollbar h-full">
                      <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
                          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="px-6 py-5 sticky left-0 bg-slate-900 z-30">#</th>
                            <th className="px-6 py-5">Property Name</th>
                            <th className="px-6 py-5">Type</th>
                            <th className="px-6 py-5">Area</th>
                            <th className="px-6 py-5">Rent (S/D)</th>
                            <th className="px-6 py-5">Phone</th>
                            <th className="px-6 py-5">Photos</th>
                            <th className="px-6 py-5">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {stagingData.map((row, idx) => {
                            const errors = validateProperty(row);
                            const isEditing = editingIndex === idx;

                            return (
                              <tr key={idx} className={`text-xs font-bold transition-colors ${errors.length > 0 ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                                <td className="px-6 py-4 text-slate-300 font-mono sticky left-0 bg-white z-10 border-r border-slate-50">{idx + 1}</td>
                                
                                <td className={`px-6 py-4 ${!row.ListingName || row.ListingName === 'Unlabeled Asset' ? 'text-rose-500 bg-rose-50/50' : 'text-slate-900'}`}>
                                  {isEditing ? (
                                    <input 
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                                      value={row.ListingName}
                                      onChange={(e) => handleUpdateStaging(idx, { ListingName: e.target.value })}
                                    />
                                  ) : row.ListingName}
                                </td>

                                <td className="px-6 py-4">
                                  {isEditing ? (
                                    <select 
                                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                      value={row.ListingType}
                                      onChange={(e) => handleUpdateStaging(idx, { ListingType: e.target.value as ListingType })}
                                    >
                                      {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  ) : <span className="uppercase tracking-tighter">{row.ListingType}</span>}
                                </td>

                                <td className={`px-6 py-4 ${!row.Area ? 'text-rose-500 bg-rose-50/50' : ''}`}>
                                  {isEditing ? (
                                    <input 
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                      value={row.Area}
                                      onChange={(e) => handleUpdateStaging(idx, { Area: e.target.value })}
                                    />
                                  ) : row.Area}
                                </td>

                                <td className={`px-6 py-4 ${row.RentSingle.length === 0 && row.RentDouble.length === 0 ? 'text-rose-500 bg-rose-50/50' : ''}`}>
                                  {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                      <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                        value={row.RentSingle.join(', ')}
                                        onChange={(e) => handleUpdateStaging(idx, { RentSingle: parseRent(e.target.value) })}
                                        placeholder="Single Rent (e.g. 12000, 14000)"
                                      />
                                      <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                        value={row.RentDouble.join(', ')}
                                        onChange={(e) => handleUpdateStaging(idx, { RentDouble: parseRent(e.target.value) })}
                                        placeholder="Double Rent (e.g. 8000, 10000)"
                                      />
                                    </div>
                                  ) : `₹${row.RentSingle.join('/')} / ₹${row.RentDouble.join('/')}`}
                                </td>

                                <td className={`px-6 py-4 ${row.OwnerWhatsApp.length < 10 ? 'text-rose-500 bg-rose-50/50' : ''}`}>
                                  {isEditing ? (
                                    <input 
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                      value={row.OwnerWhatsApp}
                                      onChange={(e) => handleUpdateStaging(idx, { OwnerWhatsApp: e.target.value })}
                                    />
                                  ) : row.OwnerWhatsApp}
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex gap-1">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${row.PhotoMain ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                      <ImageIcon size={12} />
                                    </div>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${row.PhotoRoom ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                      <ImageIcon size={12} />
                                    </div>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${row.PhotoWashroom ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                      <ImageIcon size={12} />
                                    </div>
                                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[8px]">
                                      +{row.PhotosGallery?.length || 0}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setEditingIndex(isEditing ? null : idx)}
                                      className={`p-2 rounded-lg transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'hover:bg-slate-100 text-slate-400'}`}
                                    >
                                      {isEditing ? <Save size={14} /> : <Edit3 size={14} />}
                                    </button>
                                    <button 
                                      onClick={() => setStagingData(prev => prev.filter((_, i) => i !== idx))}
                                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {stats.withErrors > 0 && (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                    <AlertTriangle size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">{stats.withErrors} Rows require attention</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={stagingData.length === 0 || isProcessing || isUploading}
                  onClick={handleConfirmUpload}
                  className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Geocoding {geocodingProgress}%
                    </>
                  ) : isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Confirm & Upload {stagingData.length} Nodes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulkUploadModal;
