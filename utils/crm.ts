/**
 * eRooms Lead CRM + Booking / Commission ledger (admin only).
 * Firestore collections:
 *   crm_leads/{10-digit phone}  — one document per student (phone = natural de-duplication key)
 *   bookings/{auto id}          — confirmed bookings with commission tracking
 * Only admins can read these (see firestore.rules). The public "name + mobile" gate may only CREATE a
 * minimal crm_leads document (status "New").
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export const LEAD_STATUSES = ['New', 'Contacted', 'Visit Scheduled', 'Visited', 'Booked', 'Lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadNote {
  at: string;
  text: string;
}

export interface CrmLead {
  id: string; // = phone
  name: string;
  phone: string;
  source: string;
  page?: string;
  status: LeadStatus;
  area?: string;
  budget?: string;
  requirement?: string;
  gender?: string;
  institute?: string;
  propertyInterest?: string;
  followUpAt?: string; // YYYY-MM-DD
  assignedTo?: string;
  lostReason?: string;
  notes?: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

export const COMMISSION_STATUSES = ['Pending', 'Received', 'Waived'] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Other'] as const;

export interface Booking {
  id: string;
  studentName: string;
  studentPhone: string;
  propertyId?: string;
  propertyName: string;
  area?: string;
  checkIn: string; // YYYY-MM-DD
  monthlyRent: number;
  commission: number;
  commissionStatus: CommissionStatus;
  receivedOn?: string; // YYYY-MM-DD
  paymentMode?: string;
  reference?: string;
  platformFee?: number; // fee collected from student, if any
  notes?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

const nowIso = () => new Date().toISOString();
export const todayYmd = () => new Date().toISOString().slice(0, 10);

export const normalizePhone = (raw: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : '';
};

const clean = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

// ---------------- Public: lead from the "name + mobile first" gate ----------------
export const createGateLead = async (name: string, phoneRaw: string, page: string) => {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return;
  const ts = nowIso();
  try {
    // Plain create (no merge). If this student already exists, the rules reject it — that is fine.
    await setDoc(doc(db, 'crm_leads', phone), {
      id: phone,
      name: name.trim().slice(0, 80),
      phone,
      source: 'hostels-gate',
      page: page.slice(0, 200),
      status: 'New',
      createdAt: ts,
      updatedAt: ts
    });
  } catch {
    // duplicate / offline — the Google Sheet copy is still sent separately
  }
};

// ---------------- Admin: leads ----------------
export const fetchCrmLeads = async (): Promise<CrmLead[]> => {
  const snap = await getDocs(collection(db, 'crm_leads'));
  return snap.docs
    .map((d) => d.data() as CrmLead)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
};

export const saveCrmLead = async (lead: CrmLead) => {
  const data = clean({ ...lead, updatedAt: nowIso() });
  await setDoc(doc(db, 'crm_leads', lead.id), data);
  return data;
};

export const patchCrmLead = async (id: string, updates: Partial<CrmLead>) => {
  const data = clean({ ...updates, updatedAt: nowIso() });
  await updateDoc(doc(db, 'crm_leads', id), data);
  return data;
};

export const deleteCrmLead = (id: string) => deleteDoc(doc(db, 'crm_leads', id));

/**
 * Import rows exported from the leads Google Sheet (File → Download → CSV).
 * Existing phone numbers are skipped (never overwritten). Returns counts.
 */
export const importLeadsFromRows = async (
  rows: Record<string, string>[],
  existingIds: Set<string>
): Promise<{ added: number; skipped: number; invalid: number }> => {
  const pick = (row: Record<string, string>, keys: string[]) => {
    for (const k of Object.keys(row)) {
      if (keys.includes(k.trim().toLowerCase())) {
        const v = (row[k] || '').toString().trim();
        if (v) return v;
      }
    }
    return '';
  };
  const toAdd = new Map<string, CrmLead>();
  let skipped = 0;
  let invalid = 0;
  for (const row of rows) {
    const phone = normalizePhone(pick(row, ['whatsapp', 'phone', 'mobile', 'mobile number', 'whatsapp number', 'contact']));
    const name = pick(row, ['name', 'student name', 'full name']);
    if (!phone) {
      invalid++;
      continue;
    }
    if (existingIds.has(phone) || toAdd.has(phone)) {
      skipped++;
      continue;
    }
    const ts = nowIso();
    toAdd.set(
      phone,
      clean({
        id: phone,
        phone,
        name: name || 'Student',
        source: pick(row, ['source']) || 'sheet-import',
        status: 'New' as LeadStatus,
        area: pick(row, ['area']) || undefined,
        budget: pick(row, ['budget']) || undefined,
        requirement: pick(row, ['requirement']) || undefined,
        gender: pick(row, ['gender']) || undefined,
        institute: pick(row, ['extra1', 'institute']) || undefined,
        notes: pick(row, ['date']) ? [{ at: ts, text: `Imported from sheet (lead date: ${pick(row, ['date'])})` }] : undefined,
        createdAt: ts,
        updatedAt: ts
      })
    );
  }
  const list = [...toAdd.values()];
  for (let i = 0; i < list.length; i += 400) {
    const batch = writeBatch(db);
    list.slice(i, i + 400).forEach((l) => batch.set(doc(db, 'crm_leads', l.id), l));
    await batch.commit();
  }
  return { added: list.length, skipped, invalid };
};

// ---------------- Admin: bookings ----------------
export const fetchBookings = async (): Promise<Booking[]> => {
  const snap = await getDocs(collection(db, 'bookings'));
  return snap.docs
    .map((d) => d.data() as Booking)
    .sort((a, b) => (b.checkIn || '').localeCompare(a.checkIn || ''));
};

export const saveBooking = async (b: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> & Partial<Booking>) => {
  const ts = nowIso();
  const id = b.id || `bk-${Date.now()}`;
  const data = clean({ ...b, id, createdAt: b.createdAt || ts, updatedAt: ts }) as Booking;
  await setDoc(doc(db, 'bookings', id), data);
  return data;
};

export const deleteBooking = (id: string) => deleteDoc(doc(db, 'bookings', id));

// ---------------- Helpers ----------------
export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      cur.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else field += c;
  }
  if (field || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  const nonEmpty = rows.filter((r) => r.some((x) => x.trim()));
  if (nonEmpty.length < 2) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
};

export const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
};

export const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
