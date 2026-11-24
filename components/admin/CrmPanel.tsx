import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Phone, MessageCircle, Plus, Upload, Download, RefreshCw, Search, X, CalendarClock, Trash2 } from 'lucide-react';
import { Lead } from '../../types';
import {
  CrmLead,
  LEAD_STATUSES,
  LeadStatus,
  fetchCrmLeads,
  saveCrmLead,
  patchCrmLead,
  deleteCrmLead,
  importLeadsFromRows,
  parseCsv,
  toCsv,
  downloadText,
  normalizePhone,
  todayYmd
} from '../../utils/crm';

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  'Visit Scheduled': 'bg-violet-50 text-violet-700 border-violet-200',
  Visited: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Booked: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Lost: 'bg-slate-100 text-slate-500 border-slate-200'
};

const WA_TEXT = (name: string) =>
  encodeURIComponent(
    `Hi ${name || ''}, this is eRooms Kota. You checked hostels on erooms.in — tell us your budget, area and coaching, and we will share the best verified options and arrange a free visit.`
  );

interface Props {
  inquiryLeads?: Lead[];
  onCreateBooking?: (lead: CrmLead) => void;
}

const CrmPanel: React.FC<Props> = ({ inquiryLeads = [], onCreateBooking }) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'All' | 'Due' | LeadStatus>('All');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', area: '', budget: '', requirement: '' });
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setLeads(await fetchCrmLeads());
    } catch (e) {
      setError(
        (e as { code?: string })?.code === 'permission-denied'
          ? 'Permission denied — publish the new Firestore rules (crm_leads) in Firebase console.'
          : 'Could not load leads. Check internet and try Refresh.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = todayYmd();
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: leads.length, Due: 0 };
    LEAD_STATUSES.forEach((s) => (c[s] = 0));
    leads.forEach((l) => {
      c[l.status] = (c[l.status] || 0) + 1;
      if (l.followUpAt && l.followUpAt <= today && l.status !== 'Booked' && l.status !== 'Lost') c.Due++;
    });
    return c;
  }, [leads, today]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter === 'Due') {
        if (!(l.followUpAt && l.followUpAt <= today && l.status !== 'Booked' && l.status !== 'Lost')) return false;
      } else if (filter !== 'All' && l.status !== filter) return false;
      if (!term) return true;
      return [l.name, l.phone, l.area, l.propertyInterest, l.source].some((v) => (v || '').toLowerCase().includes(term));
    });
  }, [leads, filter, q, today]);

  const conversion = leads.length ? Math.round(((counts.Booked || 0) / leads.length) * 100) : 0;

  const update = async (id: string, updates: Partial<CrmLead>) => {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    try {
      await patchCrmLead(id, updates);
    } catch {
      setLeads(prev);
      setMsg('Save failed — please try again.');
    }
  };

  const addNote = async (lead: CrmLead) => {
    const text = noteText.trim();
    if (!text) return;
    const notes = [...(lead.notes || []), { at: new Date().toISOString(), text: text.slice(0, 500) }];
    setNoteText('');
    await update(lead.id, { notes });
  };

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizePhone(form.phone);
    if (!phone || form.name.trim().length < 2) {
      setMsg('Enter a name and a valid 10-digit mobile number.');
      return;
    }
    if (leads.some((l) => l.id === phone)) {
      setMsg('This number is already in the CRM.');
      setQ(phone);
      return;
    }
    const ts = new Date().toISOString();
    const lead = await saveCrmLead({
      id: phone,
      phone,
      name: form.name.trim(),
      source: 'manual',
      status: 'New',
      area: form.area || undefined,
      budget: form.budget || undefined,
      requirement: form.requirement || undefined,
      createdAt: ts,
      updatedAt: ts
    });
    setLeads((ls) => [lead, ...ls]);
    setForm({ name: '', phone: '', area: '', budget: '', requirement: '' });
    setShowAdd(false);
    setMsg('Lead added.');
  };

  const onImport = async (file: File) => {
    setMsg('Importing…');
    try {
      const rows = parseCsv(await file.text());
      const res = await importLeadsFromRows(rows, new Set(leads.map((l) => l.id)));
      setMsg(`Import done: ${res.added} new, ${res.skipped} already present, ${res.invalid} without a valid number.`);
      await load();
    } catch {
      setMsg('Import failed. Use Google Sheet → File → Download → CSV.');
    }
  };

  const importInquiries = async () => {
    const rows = inquiryLeads.map((l) => ({
      name: l.studentName,
      phone: l.studentPhone,
      source: `inquiry-${l.type}`,
      requirement: l.propertyName
    }));
    const res = await importLeadsFromRows(rows, new Set(leads.map((l) => l.id)));
    setMsg(`Inquiry Stream: ${res.added} new leads added, ${res.skipped} already present.`);
    await load();
  };

  const exportCsv = () => {
    const rows = visible.map((l) => ({
      Name: l.name,
      Phone: l.phone,
      Status: l.status,
      FollowUp: l.followUpAt || '',
      Area: l.area || '',
      Budget: l.budget || '',
      Requirement: l.requirement || '',
      Interest: l.propertyInterest || '',
      AssignedTo: l.assignedTo || '',
      Source: l.source,
      Created: l.createdAt.slice(0, 10),
      LastNote: l.notes?.length ? l.notes[l.notes.length - 1].text : ''
    }));
    downloadText(`erooms_crm_${today}.csv`, toCsv(rows));
  };

  const remove = async (lead: CrmLead) => {
    if (prompt(`Type DELETE to remove ${lead.name} (${lead.phone}) permanently`) !== 'DELETE') return;
    await deleteCrmLead(lead.id);
    setLeads((ls) => ls.filter((l) => l.id !== lead.id));
    setOpenId(null);
  };

  const chips: ('All' | 'Due' | LeadStatus)[] = ['All', 'Due', ...LEAD_STATUSES];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total leads', value: leads.length },
          { label: 'Follow-ups due', value: counts.Due, warn: counts.Due > 0 },
          { label: 'Visits scheduled', value: counts['Visit Scheduled'] || 0 },
          { label: 'Booked (conversion)', value: `${counts.Booked || 0} (${conversion}%)` }
        ].map((k) => (
          <div key={k.label} className={`rounded-3xl border p-5 bg-white ${k.warn ? 'border-rose-200' : 'border-slate-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.warn ? 'text-rose-600' : 'text-slate-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, number, area…"
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5">
          <Plus size={14} /> Add lead
        </button>
        <button onClick={() => fileRef.current?.click()} className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
          <Upload size={14} /> Import CSV
        </button>
        {inquiryLeads.length > 0 && (
          <button onClick={importInquiries} className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold">
            Pull Inquiry Stream ({inquiryLeads.length})
          </button>
        )}
        <button onClick={exportCsv} className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
          <Download size={14} /> Export
        </button>
        <button onClick={load} title="Refresh" className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
      </div>

      {showAdd && (
        <form onSubmit={addManual} className="bg-white rounded-3xl border border-blue-100 p-4 grid grid-cols-2 md:grid-cols-6 gap-2">
          {(['name', 'phone', 'area', 'budget', 'requirement'] as const).map((f) => (
            <input
              key={f}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              placeholder={f === 'phone' ? 'Mobile *' : f === 'name' ? 'Name *' : f[0].toUpperCase() + f.slice(1)}
              className="px-3 py-2.5 rounded-2xl bg-slate-50 text-sm outline-none"
            />
          ))}
          <button className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold">Save</button>
        </form>
      )}

      {(msg || error) && (
        <div className={`rounded-2xl px-4 py-3 text-sm flex justify-between ${error ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
          <span>{error || msg}</span>
          {!error && (
            <button onClick={() => setMsg('')}>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${
              filter === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {c === 'Due' ? 'Follow-up due' : c} ({counts[c] || 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50">
        {loading && <p className="p-6 text-sm text-slate-400">Loading…</p>}
        {!loading && visible.length === 0 && <p className="p-6 text-sm text-slate-400">No leads here.</p>}
        {visible.map((l) => {
          const due = l.followUpAt && l.followUpAt <= today && l.status !== 'Booked' && l.status !== 'Lost';
          const open = openId === l.id;
          return (
            <div key={l.id} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => { setOpenId(open ? null : l.id); setNoteText(''); }} className="flex-1 min-w-[160px] text-left">
                  <p className="font-bold text-slate-900 text-sm">{l.name}</p>
                  <p className="text-xs text-slate-500">
                    {l.phone} · {l.source} · {l.createdAt.slice(0, 10)}
                    {l.area ? ` · ${l.area}` : ''}
                    {l.budget ? ` · ₹${l.budget}` : ''}
                  </p>
                </button>
                <select
                  value={l.status}
                  onChange={(e) => update(l.id, { status: e.target.value as LeadStatus })}
                  className={`text-xs font-bold px-3 py-2 rounded-xl border ${STATUS_COLORS[l.status]}`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <label className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-xl border ${due ? 'border-rose-300 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-500'}`}>
                  <CalendarClock size={14} />
                  <input
                    type="date"
                    value={l.followUpAt || ''}
                    onChange={(e) => update(l.id, { followUpAt: e.target.value })}
                    className="bg-transparent outline-none"
                  />
                </label>
                <a href={`tel:+91${l.phone}`} className="p-2 rounded-xl bg-slate-100 text-slate-700" title="Call">
                  <Phone size={16} />
                </a>
                <a
                  href={`https://wa.me/91${l.phone}?text=${WA_TEXT(l.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-emerald-500 text-white"
                  title="WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              </div>
              {open && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['area', 'Area'],
                        ['budget', 'Budget'],
                        ['requirement', 'Requirement'],
                        ['institute', 'Coaching'],
                        ['propertyInterest', 'Hostel interested'],
                        ['assignedTo', 'Assigned to']
                      ] as [keyof CrmLead, string][]
                    ).map(([k, label]) => (
                      <label key={k} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                        <input
                          defaultValue={(l[k] as string) || ''}
                          onBlur={(e) => e.target.value !== ((l[k] as string) || '') && update(l.id, { [k]: e.target.value } as Partial<CrmLead>)}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-900 normal-case tracking-normal font-normal outline-none"
                        />
                      </label>
                    ))}
                    {l.status === 'Lost' && (
                      <label className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Lost reason
                        <input
                          defaultValue={l.lostReason || ''}
                          onBlur={(e) => update(l.id, { lostReason: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 text-sm text-slate-900 normal-case font-normal outline-none"
                        />
                      </label>
                    )}
                    <div className="col-span-2 flex gap-2 mt-1">
                      {onCreateBooking && (
                        <button onClick={() => onCreateBooking(l)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                          Record booking
                        </button>
                      )}
                      <button onClick={() => remove(l)} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Notes / call log</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(l.notes || []).slice().reverse().map((n, i) => (
                        <div key={i} className="text-xs bg-slate-50 rounded-xl px-3 py-2">
                          <span className="text-slate-400">{new Date(n.at).toLocaleString('en-IN')}:</span> {n.text}
                        </div>
                      ))}
                      {!l.notes?.length && <p className="text-xs text-slate-400">No notes yet.</p>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNote(l)}
                        placeholder="e.g. Called, wants Landmark near Allen, visit Sunday"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 text-sm outline-none"
                      />
                      <button onClick={() => addNote(l)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrmPanel;
