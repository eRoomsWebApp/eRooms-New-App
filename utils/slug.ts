import { Property } from '../types';

export const SITE_ORIGIN = 'https://www.erooms.in';
export const BASE_PATH = '/hostels';

export const slugify = (input: string): string => {
  return (input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'kota';
};

export const getPropertyPath = (property: Pick<Property, 'id' | 'Area' | 'ListingName'>): string => {
  const areaSlug = slugify(property.Area || 'kota');
  const propSlug = slugify(property.ListingName || 'property');
  return `/${areaSlug}/${propSlug}-${property.id}`;
};

export const getCanonicalUrl = (routePath: string): string => {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${SITE_ORIGIN}${BASE_PATH}${normalized === '/' ? '/' : normalized}`;
};

export const getAreaPath = (area: string): string => `/area/${slugify(area)}`;

export const getInstitutePath = (institute: string): string => `/near/${slugify(institute)}`;

export const findBySlug = (slug: string, candidates: string[]): string | undefined => {
  const target = slugify(slug);
  return candidates.find(item => slugify(item) === target);
};

export const extractPropertyId = (
  slugAndId: string | undefined,
  knownProperties: Pick<Property, 'id' | 'ListingName'>[]
): string | undefined => {
  if (!slugAndId) return undefined;

  // Exact suffix match against known property IDs (handles hyphenated IDs like kota-elite-preview-1 or prop-123)
  const sorted = [...knownProperties].sort((a, b) => b.id.length - a.id.length);
  for (const prop of sorted) {
    if (slugAndId === prop.id || slugAndId.endsWith(`-${prop.id}`)) {
      return prop.id;
    }
  }

  // Fallback for well-known ID patterns when list hasn't loaded yet
  const knownPatternMatch = slugAndId.match(/(kota-elite-preview-\d+|prop-\d+|bulk-\d+-\d+)$/);
  if (knownPatternMatch) {
    return knownPatternMatch[1];
  }

  // Generic fallback: last hyphen-delimited segment (e.g., Firestore auto-IDs)
  const lastDash = slugAndId.lastIndexOf('-');
  return lastDash !== -1 ? slugAndId.slice(lastDash + 1) : slugAndId;
};

export const truncateMeta = (text: string, maxLen: number): string => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen - 1);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? trimmed.slice(0, lastSpace) : trimmed).trim() + '…';
};
