import { Property } from '../types';
import { getCanonicalUrl, getPropertyPath } from './slug';

export const APPS_SCRIPT_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwRfP9_xNy7e_-Bk3P3wSe9yWdUCkJDceUCTbFnk1omm0zeeziQ-Xaa5PmE_PSWko1p/exec';

export const EROOMS_WHATSAPP_NUMBER = '919351099947';
export const EROOMS_CALL_TEL = '+919351099947';
export const EROOMS_KNOWN_NAME_KEY = 'erooms_known_name';
export const EROOMS_KNOWN_PHONE_KEY = 'erooms_known_phone';
const SESSION_ID_KEY = 'erooms_session_id';
const VISITOR_ID_KEY = 'erooms_visitor_id';
const CLICK_PATH_KEY = 'erooms_click_path';

export type LeadActionType = 'Get Details on WhatsApp' | 'Call eRooms' | 'Book Free Visit';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export const normalizeIndianPhone = (raw: string): string => {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  cleaned = cleaned.replace(/^0+/, '');
  return cleaned;
};

export const isValidIndianPhone = (raw: string): boolean => {
  const normalized = normalizeIndianPhone(raw);
  return /^[6-9]\d{9}$/.test(normalized);
};

export const getKnownLeadInfo = (): { name: string; phone: string; isComplete: boolean } => {
  try {
    const name = (localStorage.getItem(EROOMS_KNOWN_NAME_KEY) || '').trim();
    const rawPhone = localStorage.getItem(EROOMS_KNOWN_PHONE_KEY) || '';
    const phone = normalizeIndianPhone(rawPhone);
    const validPhone = /^[6-9]\d{9}$/.test(phone) ? phone : '';
    return {
      name,
      phone: validPhone,
      isComplete: name.length >= 2 && validPhone.length === 10
    };
  } catch {
    return { name: '', phone: '', isComplete: false };
  }
};

export const saveKnownLeadInfo = (name: string, phone: string) => {
  try {
    const trimmedName = name.trim();
    const normalizedPhone = normalizeIndianPhone(phone);
    if (trimmedName) {
      localStorage.setItem(EROOMS_KNOWN_NAME_KEY, trimmedName);
    }
    if (/^[6-9]\d{9}$/.test(normalizedPhone)) {
      localStorage.setItem(EROOMS_KNOWN_PHONE_KEY, normalizedPhone);
    }
  } catch {
    // ignore storage errors
  }
};

export const getSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return `sess-${Date.now()}`;
  }
};

export const getVisitorId = (): string => {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `vis-${Date.now()}`;
  }
};

export const pushClickPathAction = (actionLabel: string): string => {
  try {
    const raw = sessionStorage.getItem(CLICK_PATH_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const next = [...existing, actionLabel].slice(-20);
    sessionStorage.setItem(CLICK_PATH_KEY, JSON.stringify(next));
    return next.join(' > ');
  } catch {
    return actionLabel;
  }
};

export const getDeviceType = (): string => {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
};

export const getLowestRent = (property: Pick<Property, 'RentSingle' | 'RentDouble'>): number => {
  const all = [
    ...(Array.isArray(property.RentDouble) ? property.RentDouble : []),
    ...(Array.isArray(property.RentSingle) ? property.RentSingle : [])
  ].filter(n => typeof n === 'number' && n > 0);
  return all.length > 0 ? Math.min(...all) : 0;
};

const postRecordsToSheets = (records: Record<string, unknown>[]) => {
  try {
    fetch(APPS_SCRIPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'no-cors',
      keepalive: true,
      body: JSON.stringify({ records, reset: false })
    }).catch(() => {});
  } catch {
    // non-blocking
  }
};

export const sendCompletedLead = ({
  action,
  property,
  name,
  whatsapp,
  instituteFilter
}: {
  action: LeadActionType;
  property: Property;
  name: string;
  whatsapp: string;
  instituteFilter?: string;
}) => {
  const actionLabel = `${action}: ${property.ListingName}`;
  const clickPath = pushClickPathAction(actionLabel);

  postRecordsToSheets([
    {
      type: 'STUDENT',
      date: new Date().toLocaleString('en-IN'),
      status: 'completed',
      name: name.trim(),
      whatsapp: normalizeIndianPhone(whatsapp),
      requirement: property.ListingType,
      budget: getLowestRent(property),
      area: property.Area,
      gender: property.Gender,
      extra1: instituteFilter && instituteFilter !== 'All' ? instituteFilter : '',
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      source: 'hostels',
      device: getDeviceType(),
      lastAction: actionLabel,
      clickPath,
      fieldsFilled: 2
    }
  ]);

  try {
    window.gtag?.('event', 'generate_lead', { value: 1, currency: 'INR' });
    window.fbq?.('track', 'Lead');
  } catch {
    // ignore analytics failures
  }
};

let lastPartialSentAt = 0;

export const sendPartialVisit = (
  params: {
    lastAction: string;
    property?: Property;
    area?: string;
    requirement?: string;
    gender?: string;
    budget?: number | string;
    extra1?: string;
  },
  force = false
) => {
  const now = Date.now();
  if (!force && now - lastPartialSentAt < 15000) {
    return;
  }
  lastPartialSentAt = now;

  const known = getKnownLeadInfo();
  const clickPath = pushClickPathAction(params.lastAction);

  postRecordsToSheets([
    {
      type: 'STUDENT',
      date: new Date().toLocaleString('en-IN'),
      status: 'partial',
      name: known.name || '',
      whatsapp: known.phone || '',
      requirement: params.property?.ListingType || params.requirement || '',
      budget: params.property ? getLowestRent(params.property) : params.budget || '',
      area: params.property?.Area || params.area || '',
      gender: params.property?.Gender || params.gender || '',
      extra1: params.extra1 && params.extra1 !== 'All' ? params.extra1 : '',
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      source: 'hostels',
      device: getDeviceType(),
      lastAction: params.lastAction,
      clickPath,
      fieldsFilled: known.isComplete ? 2 : 0
    }
  ]);
};

export const openExternalUrl = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const executeLeadChannelAction = (action: LeadActionType, property: Property) => {
  const pageUrl = getCanonicalUrl(getPropertyPath(property));
  if (action === 'Get Details on WhatsApp') {
    const text = `Namaste eRooms, mujhe ${property.ListingName} (${property.Area}) ke baare mein details chahiye. Link: ${pageUrl}`;
    openExternalUrl(`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`);
  } else if (action === 'Call eRooms') {
    window.location.href = `tel:${EROOMS_CALL_TEL}`;
  } else if (action === 'Book Free Visit') {
    const text = `Namaste eRooms, mujhe ${property.ListingName} (${property.Area}) ki visit book karni hai. Link: ${pageUrl}`;
    openExternalUrl(`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`);
  }
};
