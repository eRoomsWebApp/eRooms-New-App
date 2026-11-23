import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITE_BASE = 'https://www.erooms.in/hostels';

const slugify = (input) =>
  (input || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'kota';

const escapeXml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const parseStringArrayFromConstants = (source, exportName, fallback) => {
  const regex = new RegExp(`export const ${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
  const match = source.match(regex);
  if (!match) return fallback;
  const items = [];
  const itemRegex = /'([^']+)'|"([^"]+)"/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push(m[1] || m[2]);
  }
  return items.length > 0 ? items : fallback;
};

const loadStaticCatalog = () => {
  const fallbackAreas = [
    'Landmark City (Kunadi)',
    'Coral Park',
    'Talwandi',
    'Vigyan Nagar',
    'Jawahar Nagar',
    'Rajeev Gandhi Nagar',
    'Indra Vihar',
    'Indraprastha',
    'Mahaveer Nagar',
  ];
  const fallbackInstitutes = [
    'Allen Samyak',
    'Allen Sangyan',
    'Allen Safalya',
    'Allen Satyarth',
    'Allen Supath',
    'Resonance',
    'Motion',
    'PW Vidyapeeth',
    'Unacademy',
  ];

  try {
    const constantsSrc = fs.readFileSync(path.join(ROOT_DIR, 'constants.ts'), 'utf8');
    return {
      areas: parseStringArrayFromConstants(constantsSrc, 'KOTA_AREAS', fallbackAreas),
      institutes: parseStringArrayFromConstants(constantsSrc, 'INSTITUTES', fallbackInstitutes),
    };
  } catch {
    return { areas: fallbackAreas, institutes: fallbackInstitutes };
  }
};

const fetchApprovedPropertiesFromFirestore = async () => {
  try {
    const cfgRaw = fs.readFileSync(path.join(ROOT_DIR, 'firebase-applet-config.json'), 'utf8');
    const cfg = JSON.parse(cfgRaw);
    const projectId = cfg.projectId;
    const databaseId = cfg.firestoreDatabaseId || '(default)';
    if (!projectId) return [];

    const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'properties' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'ApprovalStatus' },
                op: 'EQUAL',
                value: { stringValue: 'Approved' },
              },
            },
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[sitemap] Firestore REST returned HTTP ${res.status}; using static pages only.`);
        return [];
      }

      const rows = await res.json();
      if (!Array.isArray(rows)) return [];

      const props = [];
      for (const row of rows) {
        const doc = row?.document;
        if (!doc?.fields) continue;
        const fields = doc.fields;
        const docId = fields.id?.stringValue || (doc.name ? doc.name.split('/').pop() : '');
        const area = fields.Area?.stringValue || 'kota';
        const listingName = fields.ListingName?.stringValue || '';
        if (!docId || !listingName) continue;
        props.push({
          id: docId,
          area,
          listingName,
          lastmod: doc.updateTime ? doc.updateTime.split('T')[0] : undefined,
        });
      }
      return props;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn(`[sitemap] Failed to fetch Firestore properties (${err?.message || err}); falling back to static URLs.`);
    return [];
  }
};

const main = async () => {
  const { areas, institutes } = loadStaticCatalog();
  const today = new Date().toISOString().split('T')[0];

  const urls = new Map();
  const addUrl = (loc, changefreq, priority, lastmod = today) => {
    if (!urls.has(loc)) {
      urls.set(loc, { loc, changefreq, priority, lastmod });
    }
  };

  addUrl(`${SITE_BASE}/`, 'daily', '1.0');

  for (const area of areas) {
    addUrl(`${SITE_BASE}/area/${slugify(area)}`, 'weekly', '0.9');
  }

  for (const inst of institutes) {
    addUrl(`${SITE_BASE}/near/${slugify(inst)}`, 'weekly', '0.9');
  }

  // Always include the canonical sample preview property URL as fallback or alongside Firestore docs
  addUrl(`${SITE_BASE}/talwandi/vedanta-residency-kota-elite-preview-1`, 'weekly', '0.8');

  // Static catalogue (data/hostels.json) — always included, no network needed
  let staticCount = 0;
  try {
    const staticList = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'hostels.json'), 'utf8'));
    for (const p of staticList) {
      addUrl(`${SITE_BASE}/${slugify(p.Area)}/${slugify(p.ListingName)}-${p.id}`, 'weekly', '0.8', p.updatedAt || today);
      staticCount++;
    }
  } catch (err) {
    console.warn('[sitemap] Could not read data/hostels.json:', err?.message || err);
  }

  const properties = await fetchApprovedPropertiesFromFirestore();
  for (const prop of properties) {
    const areaSlug = slugify(prop.area);
    const propSlug = slugify(prop.listingName);
    addUrl(`${SITE_BASE}/${areaSlug}/${propSlug}-${prop.id}`, 'weekly', '0.8', prop.lastmod || today);
  }

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const entry of urls.values()) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    xmlLines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${entry.priority}</priority>`);
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');

  const publicDir = path.join(ROOT_DIR, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlLines.join('\n') + '\n', 'utf8');
  console.log(`[sitemap] Generated public/sitemap.xml with ${urls.size} URLs (${staticCount} static hostels, ${properties.length} from Firestore).`);
};

main().catch((err) => {
  console.warn('[sitemap] Unexpected error, continuing build:', err);
});
