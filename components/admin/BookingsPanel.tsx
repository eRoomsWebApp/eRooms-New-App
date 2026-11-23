import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, RefreshCw, X, Trash2, CheckCircle2 } from 'lucide-react';
import { Property } from '../../types';
import {
  Booking,
  COMMISSION_STATUSES,
  CommissionStatus,
  PAYMENT_MODES,
  fetchBookings,
  saveBooking,
  deleteBooking,
  patchCrmLead,
  toCsv,
  downloadText,
  normalizePhone,
  todayYmd,
  inr
} from '../../utils/crm';

export interface BookingDraft {
  studentName?: string;
  studentPhone?: string;
  propertyName?: string;
  leadId?: string;
}

interface Props {
  properties: Property[];
  draft?: BookingDraft | null;
  onDraftUsed?: () => void;
}

const emptyForm = {
  id: '',
  studentName: '',
  studentPhone: '',
  propertyId: '',
  propertyName: '',
  area: '',
  checkIn: todayYmd(),
  monthlyRent: '',
  commission: '',
  commissionStatus: 'Pending' as CommissionStatus,
  receivedOn: '',
  paymentMode: '',
  reference: '',
  platformFee: '',
  notes: '',
  leadId: '',
  createdAt: ''
};

const BookingsPanel: React.FC<Props> = ({ properties, draft, onDraftUsed }) => {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [month, setMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CommissionStatus>('All');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await fetchBookings());
    } catch (e: any) {
      setError(
        e?.code === 'permission-denied'
          ? 'Permission denied — publish the new Firestore rules (bookings) in Firebase console.'
          : 'Could not load bookings. Check internet and try Refresh.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!draft) return;
    setForm({
      ...emptyForm,
      checkIn: todayYmd(),
      studentName: draft.studentName || '',
      studentPhone: draft.studentPhone || '',
      propertyName: draft.propertyName || '',
      leadId: draft.leadId || ''
    });
    setShowForm(true);
    onDraftUsed?.();
  }, [draft]);

  const propertyOptions = useMemo(
    () =>
      [...properties]
        .filter((p) => p.id && p.ListingName)
        .sort((a, b) => a.ListingName.localeCompare(b.ListingName)),
    [properties]
  );

  const pickProperty = (name: string) => {
    const p = propertyOptions.find((x) => x.ListingName === name);
    setForm((f) => ({
      ...f,
      propertyName: name,
      propertyId: p?.id || '',
      area: p?.Area || f.area,
      monthlyRent: f.monthlyRent || (p?.RentSingle ? String(p.RentSingle) : f.monthlyRent)
    }));
  };

  const months = useMemo(() => [...new Set(rows.map((r) => (r.checkIn || '').slice(0, 7)).filter(Boolean))].sort().reverse(), [rows]);

  const visible = useMemo(
    () =>
      rows.filter(
        (r) => (!month || (r.checkIn || '').startsWith(month)) && (statusFilter === 'All' || r.commissionStatus === statusFilter)
      ),
    [rows, month, statusFilter]
  );

  const kpi = useMemo(() => {
    const base = rows.filter((r) => !month || (r.checkIn || '').startsWith(month));
    const sum = (f: (r: Booking) => number) => base.reduce((a, r) => a + (f(r) || 0), 0);
    return {
      bookings: base.length,
      earned: sum((r) => (r.commissionStatus === 'Waived' ? 0 : r.commission)) + sum((r) => r.platformFee || 0),
      received: sum((r) => (r.commissionStatus === 'Received' ? r.commission : 0)) + sum((r) => r.platformFee || 0),
      pending: sum((r) => (r.commissionStatus === 'Pending' ? r.commission : 0)),
      rentValue: sum((r) => r.monthlyRent)
    };
  }, [rows, month]);

  const duesByOwner = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    rows
      .filter((r) => r.commissionStatus === 'Pending')
      .forEach((r) => {
        const cur = m.get(r.propertyName) || { count: 0, amount: 0 };
        m.set(r.propertyName, { count: cur.count + 1, amount: cur.amount + (r.commission || 0) });
      });
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount);
  }, [rows]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizePhone(form.studentPhone);
    if (form.studentName.trim().length < 2 || !phone || !form.propertyName.trim()) {
      setMsg('Student name, valid mobile and hostel are required.');
      return;
    }
    const rent = Number(form.monthlyRent) || 0;
    const commission = Number(form.commission) || 0;
    if (rent < 0 || commission < 0) {
      setMsg('Amounts cannot be negative.');
      return;
    }
    try {
      const saved = await saveBooking({
        id: form.id || undefined,
        createdAt: form.createdAt || undefined,
        studentName: form.studentName.trim(),
        studentPhone: phone,
        propertyId: form.propertyId || undefined,
        propertyName: form.propertyName.trim(),
        area: form.area || undefined,
        checkIn: form.checkIn || todayYmd(),
        monthlyRent: rent,
        commission,
        commissionStatus: form.commissionStatus,
        receivedOn: form.commissionStatus === 'Received' ? form.receivedOn || todayYmd() : undefined,
        paymentMode: form.paymentMode || undefined,
        reference: form.reference || undefined,
        platformFee: Number(form.platformFee) || undefined,
        notes: form.notes || undefined,
        leadId: form.leadId || undefined
      });
      setRows((rs) => [saved, ...rs.filter((r) => r.id !== saved.id)].sort((a, b) => b.checkIn.localeCompare(a.checkIn)));
      if (form.leadId) {
        patchCrmLead(form.leadId, { status: 'Booked', propertyInterest: saved.propertyName }).catch(() => undefined);
      }
      setForm({ ...emptyForm, checkIn: todayYmd() });
      setShowForm(false);
      setMsg('Booking saved.');
    } catch {
      setMsg('Save failed — check rules / internet and try again.');
    }
  };

  const markReceived = async (b: Booking) => {
    const mode = prompt('Payment mode? (Cash / UPI / Bank Transfer / Other)', b.paymentMode || 'UPI');
    if (mode === null) return;
    const saved = await saveBooking({ ...b, commissionStatus: 'Received', receivedOn: todayYmd(), paymentMode: mode || b.paymentMode });
    setRows((rs) => rs.map((r) => (r.id === b.id ? saved : r)));
  };

  const edit = (b: Booking) => {
    setForm({
      ...emptyForm,
      ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v === undefined || v === null ? '' : String(v)])),
      commissionStatus: b.commissionStatus
    } as typeof emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (b: Booking) => {
    if (prompt(`Type DELETE to remove the booking of ${b.studentName} at ${b.propertyName}`) !== 'DELETE') return;
    await deleteBooking(b.id);
    setRows((rs) => rs.filter((r) => r.id !== b.id));
  };

  const exportCsv = () => {
    downloadText(
      `erooms_bookings_${month || 'all'}.csv`,
      toCsv(
        visible.map((r) => ({
          CheckIn: r.checkIn,
          Student: r.studentName,
          Phone: r.studentPhone,
          Hostel: r.propertyName,
          Area: r.area || '',
          MonthlyRent: r.monthlyRent,
          Commission: r.commission,
          CommissionStatus: r.commissionStatus,
          ReceivedOn: r.receivedOn || '',
          PaymentMode: r.paymentMode || '',
          Reference: r.reference || '',
          PlatformFee: r.platformFee || 0,
          Notes: r.notes || ''
        }))
      )
    );
  };

  const input = 'px-3 py-2.5 rounded-2xl bg-slate-50 text-sm outline-none w-full';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: month ? `Bookings (${month})` : 'Bookings (all time)', value: String(kpi.bookings) },
          { label: 'Revenue earned', value: inr(kpi.earned) },
          { label: 'Received', value: inr(kpi.received), good: true },
          { label: 'Pending from owners', value: inr(kpi.pending), warn: kpi.pending > 0 }
        ].map((k) => (
          <div key={k.label} className={`rounded-3xl border p-5 bg-white ${k.warn ? 'border-amber-200' : 'border-slate-100'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.warn ? 'text-amber-600' : k.good ? 'text-emerald-600' : 'text-slate-900'}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-4 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => {
            setForm({ ...emptyForm, checkIn: todayYmd() });
            setShowForm((s) => !s);
          }}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Plus size={14} /> New booking
        </button>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2.5 rounded-2xl bg-slate-100 text-xs font-bold">
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | CommissionStatus)}
          className="px-3 py-2.5 rounded-2xl bg-slate-100 text-xs font-bold"
        >
          <option value="All">All status</option>
          {COMMISSION_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button onClick={exportCsv} className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
          <Download size={14} /> Export
        </button>
        <button onClick={load} title="Refresh" className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

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

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-3xl border border-emerald-100 p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className={input} placeholder="Student name *" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
          <input className={input} placeholder="Student mobile *" value={form.studentPhone} onChange={(e) => setForm({ ...form, studentPhone: e.target.value })} />
          <input
            className={`${input} col-span-2`}
            list="erooms-hostel-names"
            placeholder="Hostel / PG name *"
            value={form.propertyName}
            onChange={(e) => pickProperty(e.target.value)}
          />
          <datalist id="erooms-hostel-names">
            {propertyOptions.map((p) => (
              <option key={p.id} value={p.ListingName}>
                {p.Area}
              </option>
            ))}
          </datalist>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Check-in
            <input type="date" className={input} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Monthly rent ₹
            <input type="number" min="0" className={input} value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Commission ₹ (from owner)
            <input type="number" min="0" className={input} value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Fee from student ₹
            <input type="number" min="0" className={input} value={form.platformFee} onChange={(e) => setForm({ ...form, platformFee: e.target.value })} />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Commission status
            <select
              className={input}
              value={form.commissionStatus}
              onChange={(e) => setForm({ ...form, commissionStatus: e.target.value as CommissionStatus })}
            >
              {COMMISSION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            Payment mode
            <select className={input} value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
              <option value="">—</option>
              {PAYMENT_MODES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <input className={input} placeholder="UTR / reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <input className={input} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold">{form.id ? 'Update booking' : 'Save booking'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-2xl bg-slate-100 text-xs font-bold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-4">Check-in</th>
                <th className="p-4">Student</th>
                <th className="p-4">Hostel</th>
                <th className="p-4 text-right">Rent</th>
                <th className="p-4 text-right">Commission</th>
                <th className="p-4">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-slate-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-slate-400">
                    No bookings yet. Use “New booking” or “Record booking” from the CRM.
                  </td>
                </tr>
              )}
              {visible.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="p-4 whitespace-nowrap">{b.checkIn}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{b.studentName}</p>
                    <p className="text-xs text-slate-400">{b.studentPhone}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{b.propertyName}</p>
                    <p className="text-xs text-slate-400">{b.area}</p>
                  </td>
                  <td className="p-4 text-right">{inr(b.monthlyRent)}</td>
                  <td className="p-4 text-right font-bold">{inr(b.commission)}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        b.commissionStatus === 'Received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.commissionStatus === 'Pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {b.commissionStatus}
                    </span>
                    {b.receivedOn && <p className="text-[10px] text-slate-400 mt-1">{b.receivedOn} · {b.paymentMode}</p>}
                  </td>
                  <td className="p-4 whitespace-nowrap text-right">
                    {b.commissionStatus === 'Pending' && (
                      <button onClick={() => markReceived(b)} title="Mark received" className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mr-1">
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    <button onClick={() => edit(b)} className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-xs font-bold mr-1">
                      Edit
                    </button>
                    <button onClick={() => remove(b)} title="Delete" className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pending dues by hostel</p>
          {duesByOwner.length === 0 && <p className="text-sm text-slate-400">Nothing pending.</p>}
          <div className="space-y-2">
            {duesByOwner.map(([name, d]) => (
              <div key={name} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {name} <span className="text-slate-400">({d.count})</span>
                </span>
                <span className="font-bold text-amber-600">{inr(d.amount)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">Total rent value booked: {inr(kpi.rentValue)}/month</p>
        </div>
      </div>
    </div>
  );
};

export default BookingsPanel;
