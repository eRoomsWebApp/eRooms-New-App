
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, FileSpreadsheet, Download, 
  CheckCircle2, AlertCircle, Loader2, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import { normalizePhone, parseRent, parseMultiLinks } from '../utils/normalization';
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
        ListingName: "Sample PG Name",
        ListingType: "PG",
        Gender: "Boys",
        OwnerName: "John Doe",
        OwnerWhatsApp: "919876543210",
        WardenName: "Jane Smith",
        EmergencyContact: "919876543211",
        OwnerEmail: "owner@example.com",
        Area: "Landmark City",
        FullAddress: "Plot 123, Landmark City, Kunhari, Kota",
        GoogleMapsPlusCode: "5V2X+XF Kota, Rajasthan",
        RentSingle: 12000,
        RentDouble: 8000,
        SecurityTerms: "1 Month Security Deposit",
        ElectricityCharges: 10,
        Maintenance: 500,
        ParentsStayCharge: 200,
        Facilities: "AC, WiFi, Laundry, Mess",
        PhotoMain: "https://example.com/photo1.jpg",
        PhotoRoom: "https://example.com/photo2.jpg",
        PhotoWashroom: "https://example.com/photo3.jpg"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Property_Bulk_Upload_Template.xlsx");
  };

  const processAndSubmit = () => {
    const properties: Omit<Property, 'id'>[] = data.map(row => {
      // Handle multi-link photos if provided in a single column or separate columns
      const mainPhotos = parseMultiLinks(String(row.PhotoMain || ''));
      const roomPhotos = parseMultiLinks(String(row.PhotoRoom || ''));
      const washroomPhotos = parseMultiLinks(String(row.PhotoWashroom || ''));

      return {
        ownerId: 'admin-bulk', // Default for bulk upload if not specified
        ListingName: String(row.ListingName || ''),
        ListingType: (row.ListingType as ListingType) || ListingType.PG,
        Gender: (row.Gender as Gender) || Gender.Unisex,
        OwnerName: String(row.OwnerName || ''),
        OwnerWhatsApp: normalizePhone(String(row.OwnerWhatsApp || '')),
        WardenName: String(row.WardenName || ''),
        EmergencyContact: normalizePhone(String(row.EmergencyContact || '')),
        OwnerEmail: String(row.OwnerEmail || ''),
        Area: String(row.Area || ''),
        FullAddress: String(row.FullAddress || ''),
        GoogleMapsPlusCode: String(row.GoogleMapsPlusCode || ''),
        InstituteDistanceMatrix: [], // Empty for bulk upload
        RentSingle: parseRent(row.RentSingle),
        RentDouble: parseRent(row.RentDouble),
        SecurityTerms: String(row.SecurityTerms || ''),
        ElectricityCharges: Number(row.ElectricityCharges || 0),
        Maintenance: Number(row.Maintenance || 0),
        ParentsStayCharge: Number(row.ParentsStayCharge || 0),
        Facilities: parseMultiLinks(String(row.Facilities || '')),
        PhotoMain: transformDriveUrl(mainPhotos[0] || ''),
        PhotoRoom: transformDriveUrl(roomPhotos[0] || ''),
        PhotoWashroom: transformDriveUrl(washroomPhotos[0] || ''),
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
