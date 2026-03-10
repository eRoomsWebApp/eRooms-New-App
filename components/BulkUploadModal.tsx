
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, FileSpreadsheet, Download, 
  CheckCircle2, AlertCircle, Loader2, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { normalizePhone, parseRent, parseMultiLinks, parseDistanceMatrix } from '../utils/normalization';
import { transformDriveUrl } from '../utils/urlHelper';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (properties: Omit<Property, 'id'>[]) => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        setData(rawData);
        setIsProcessing(false);
      } catch {
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

  const getValue = (row: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return undefined;
  };

  const processAndSubmit = () => {
    const properties: Omit<Property, 'id'>[] = data.map(row => {
      const listingName = getValue(row, ['Listing Name', 'ListingName']);
      const listingType = getValue(row, ['Listing Type', 'ListingType']);
      const gender = getValue(row, ['Category Type', 'Gender']);
      const ownerName = getValue(row, ['Owner Name', 'OwnerName']);
      const ownerPhone = getValue(row, ['Owner Contact Number', 'OwnerWhatsApp']);
      const wardenName = getValue(row, ['Warden Name', 'WardenName']);
      const wardenPhone = getValue(row, ['Office Contact Number', 'EmergencyContact']);
      const email = getValue(row, ['Email ID', 'OwnerEmail']);
      const area = getValue(row, ['Area']);
      const address = getValue(row, ['Property Full Address', 'FullAddress']);
      const location = getValue(row, ['Property Location', 'GoogleMapsPlusCode']);
      const rentSingle = getValue(row, ['What is the monthly rent? (Single Room Actual Price)', 'Single Room', 'RentSingle']);
      const rentDouble = getValue(row, ['What is the monthly rent? (Double Room Actual Price)', 'Double Room', 'RentDouble']);
      const electricity = getValue(row, ['Electricity Unit Charge', 'ElectricityCharges']);
      const maintenance = getValue(row, ['Maintenance']);
      const parentsCharge = getValue(row, ['Parents Stay Charge']);
      const facilitiesRaw = getValue(row, ['INCLUDING RENT', 'Facilities']);
      
      const photoMainRaw = getValue(row, ['Hostel Front Photo', 'PhotoMain']);
      const photoRoomRaw = getValue(row, ['Property Rooms Photos (Single)', 'PhotoRoom']);
      const photoWashroomRaw = getValue(row, ['Bathroom Photos', 'PhotoWashroom']);
      
      const extraPhotosRaw = getValue(row, ['Extra Photos', 'Office Photos', 'Hostel Reception Photo', 'Dining Area']);
      
      const distancesUnder750 = getValue(row, ['Institute Nearby Property (Under 750m)']);
      const distancesAbove750 = getValue(row, ['Institute Nearby Property (Above 750m)']);
      const mandirMasjid = getValue(row, ['Mandir / Majid / Gurudwara / Church Near by']);
      const hospital = getValue(row, ['Hospital Name / Km from Hostel']);

      // Combine distances
      const combinedDistances = [
        ...(distancesUnder750 ? parseDistanceMatrix(String(distancesUnder750)) : []),
        ...(distancesAbove750 ? parseDistanceMatrix(String(distancesAbove750)) : []),
        ...(mandirMasjid ? parseDistanceMatrix(String(mandirMasjid)) : []),
        ...(hospital ? parseDistanceMatrix(String(hospital)) : [])
      ];

      // Parse Gallery
      const gallery = parseMultiLinks(String(extraPhotosRaw || '')).map(url => transformDriveUrl(url)).filter(Boolean) as string[];

      return {
        ownerId: 'admin-bulk',
        ListingName: String(listingName || 'Unlabeled Asset'),
        ListingType: (listingType as ListingType) || ListingType.Hostel,
        Gender: (gender as Gender) || Gender.Boys,
        OwnerName: String(ownerName || 'Unknown Host'),
        OwnerWhatsApp: normalizePhone(String(ownerPhone || '')),
        WardenName: String(wardenName || 'On-Call Security'),
        EmergencyContact: normalizePhone(String(wardenPhone || '')),
        OwnerEmail: String(email || 'contact@erooms.in'),
        Area: String(area || ''),
        FullAddress: String(address || ''),
        GoogleMapsPlusCode: String(location || ''),
        InstituteDistanceMatrix: combinedDistances,
        RentSingle: parseRent(rentSingle),
        RentDouble: parseRent(rentDouble),
        SecurityTerms: '1 Month Security Deposit',
        ElectricityCharges: Number(electricity || 0),
        Maintenance: Number(maintenance || 0),
        ParentsStayCharge: Number(parentsCharge || 0),
        Facilities: parseMultiLinks(String(facilitiesRaw || '')),
        PhotoMain: transformDriveUrl(String(photoMainRaw || '')) || '',
        PhotoRoom: transformDriveUrl(String(photoRoomRaw || '')) || '',
        PhotoWashroom: transformDriveUrl(String(photoWashroomRaw || '')) || '',
        PhotosGallery: gallery,
        SecurityDeposit: '1 Month Advance',
        ApprovalStatus: ApprovalStatus.Approved,
        views: 0,
        leadsCount: 0,
        rating: 5
      };
    });

    onUpload(properties);
    setData([]);
    onClose();
  };

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
            className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Bulk Node Registration</h2>
                <p className="text-sm font-bold text-slate-400">Upload multiple properties via Excel spreadsheet.</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {data.length === 0 ? (
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
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase">{data.length} Properties Detected</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review the data before final registration.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setData([])}
                      className="text-red-500 hover:text-red-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 size={16} /> Clear & Restart
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-[32px] overflow-hidden flex flex-col max-h-[400px]">
                    <div className="overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="px-6 py-4 bg-slate-50">#</th>
                            <th className="px-6 py-4 bg-slate-50">Property Name</th>
                            <th className="px-6 py-4 bg-slate-50">Type</th>
                            <th className="px-6 py-4 bg-slate-50">Area</th>
                            <th className="px-6 py-4 bg-slate-50">Rent (S/D)</th>
                            <th className="px-6 py-4 bg-slate-50">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.map((row, idx) => (
                            <tr key={idx} className="text-xs font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-slate-300 font-mono">{idx + 1}</td>
                              <td className="px-6 py-4 text-slate-900">{String(row.ListingName || 'N/A')}</td>
                              <td className="px-6 py-4 uppercase tracking-tighter">{String(row.ListingType || 'N/A')}</td>
                              <td className="px-6 py-4">{String(row.Area || 'N/A')}</td>
                              <td className="px-6 py-4">₹{String(row.RentSingle || 0)} / ₹{String(row.RentDouble || 0)}</td>
                              <td className="px-6 py-4">{String(row.OwnerName || 'N/A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={data.length === 0 || isProcessing}
                onClick={processAndSubmit}
                className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Initialize Bulk Audit
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulkUploadModal;
