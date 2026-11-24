// Post-build: write one static HTML file per hostel (and the /hostels/ list) with the right
// <title>, description, canonical, Open Graph, JSON-LD and readable text, so Google and
// WhatsApp/Facebook previews see real content without running JavaScript.
// Only PUBLIC fields are used (name, area, type, rent, facilities, institutes, photo).
// Exact address / map pin / phone are never written here.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://www.erooms.in';
const BASE = '/hostels';
const hostels = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hostels.json'), 'utf8'));
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const slugify = (s) =>
  (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'kota';
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const pathOf = (h) => `/${slugify(h.Area)}/${slugify(h.ListingName)}-${h.id}`;
const rents = (h) => [...(h.RentSingle || []), ...(h.RentDouble || [])].filter((n) => typeof n === 'number' && n > 0);
const abs = (u) => (u && u.startsWith('/') ? SITE + u : u || '');

// Leak guard: these keys must be empty in the public data.
for (const h of hostels) {
  if (h.Address || h.GoogleMapsPlusCode || h.lat || h.lng || h.OwnerName || h.WardenName) {
    throw new Error(`Private field present in public data for ${h.id}`);
  }
}

const render = ({ title, description, canonical, image, jsonLd, body }) => {
  let html = template;
  const head = [
    `<title data-prerender="1">${esc(title)}</title>`,
    `<meta data-prerender="1" name="description" content="${esc(description)}" />`,
    `<link data-prerender="1" rel="canonical" href="${esc(canonical)}" />`,
    `<meta data-prerender="1" property="og:title" content="${esc(title)}" />`,
    `<meta data-prerender="1" property="og:description" content="${esc(description)}" />`,
    `<meta data-prerender="1" property="og:type" content="website" />`,
    `<meta data-prerender="1" property="og:url" content="${esc(canonical)}" />`,
    image ? `<meta data-prerender="1" property="og:image" content="${esc(image)}" />` : '',
    `<meta property="og:site_name" content="eRooms.in" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
  ].join('\n    ');
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta property="og:(title|description|type|url|site_name)"[^>]*>\s*/g, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
};

const box = 'style="max-width:960px;margin:0 auto;padding:24px;font-family:\'Plus Jakarta Sans\',system-ui,sans-serif;color:#0f172a"';
let count = 0;

for (const h of hostels) {
  const r = rents(h);
  const min = r.length ? Math.min(...r) : 0;
  const max = r.length ? Math.max(...r) : 0;
  const area = (h.Area || '').split(' (')[0];
  const url = SITE + BASE + pathOf(h);
  const fac = h.Facilities || [];
  const title = cut(`${h.ListingName}, ${area} | eRooms.in`, 59);
  const description = cut(
    `${h.ListingType} for ${h.Gender} in ${area}, Kota from ${inr(min)}/mo${fac.length ? `: ${fac.slice(0, 4).join(', ')}` : ''}. Photos & free visit on eRooms.in.`,
    154
  );
  const near = (h.InstituteDistanceMatrix || []).filter((n) => !n.generic).slice(0, 5);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        name: h.ListingName,
        url,
        image: abs(h.PhotoMain),
        description,
        priceRange: min === max ? `${inr(min)}/month` : `${inr(min)} - ${inr(max)}/month`,
        amenityFeature: fac.map((f) => ({ '@type': 'LocationFeatureSpecification', name: f, value: true })),
        address: { '@type': 'PostalAddress', streetAddress: `${area}, Kota`, addressLocality: area, addressRegion: 'Rajasthan', addressCountry: 'IN' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}${BASE}/` },
          { '@type': 'ListItem', position: 2, name: area, item: `${SITE}${BASE}/area/${slugify(h.Area)}` },
          { '@type': 'ListItem', position: 3, name: h.ListingName, item: url }
        ]
      }
    ]
  };
  const body = `<main ${box}>
<p style="font-size:12px;color:#2563eb;font-weight:700;text-transform:uppercase">${esc(h.ListingType)} · ${esc(h.Gender)} · Verified by eRooms</p>
<h1 style="font-size:32px;margin:8px 0">${esc(h.ListingName)}</h1>
<p style="font-weight:700">${esc(area)}, Kota, Rajasthan</p>
${h.PhotoMain ? `<img src="${esc(h.PhotoMain)}" alt="${esc(h.ListingName)} ${esc(area)} Kota" width="800" style="max-width:100%;height:auto;border-radius:16px" />` : ''}
<h2>Rent</h2>
<ul>${(h.RentSingle || []).map((n) => `<li>Single room: ${inr(n)} per month</li>`).join('')}${(h.RentDouble || []).map((n) => `<li>Double sharing: ${inr(n)} per student per month</li>`).join('')}</ul>
${fac.length ? `<h2>Facilities</h2><ul>${fac.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
${near.length ? `<h2>Nearby coaching</h2><ul>${near.map((n) => `<li>${esc(n.name || n.institute || '')}${n.distance ? ` – ${esc(n.distance)} ${esc(n.unit || '')}` : ''}</li>`).join('')}</ul>` : ''}
<p>Exact address and phone number are shared after you request details. Zero brokerage · Free visit with the eRooms team.</p>
<p><a href="${BASE}/">See all verified hostels &amp; PGs in Kota</a></p>
</main>`;
  const out = path.join(DIST, 'hostels', slugify(h.Area), `${slugify(h.ListingName)}-${h.id}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, render({ title, description, canonical: url, image: abs(h.PhotoMain), jsonLd, body }));
  count++;
}

// List page: /hostels/
{
  const title = 'Verified Hostels, PG & Flats in Kota | eRooms.in';
  const description = `Compare ${hostels.length}+ verified hostels & PGs in Kota near Allen, Motion & PW. Rent, photos & facilities. Zero brokerage, free visits with eRooms.in.`;
  const canonical = `${SITE}${BASE}/`;
  const items = hostels
    .map((h) => {
      const r = rents(h);
      return `<li><a href="${BASE}${pathOf(h)}">${esc(h.ListingName)}</a> – ${esc(h.ListingType)} for ${esc(h.Gender)}, ${esc((h.Area || '').split(' (')[0])}${r.length ? `, from ${inr(Math.min(...r))}/month` : ''}</li>`;
    })
    .join('');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Verified hostels and PGs in Kota',
    itemListElement: hostels.map((h, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${BASE}${pathOf(h)}`, name: h.ListingName }))
  };
  const body = `<main ${box}><h1 style="font-size:32px">Verified Hostels, PG &amp; Flats in Kota</h1><p>Zero brokerage · Transparent rent · Free visit with the eRooms team.</p><ul>${items}</ul></main>`;
  fs.mkdirSync(path.join(DIST, 'hostels'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'hostels', 'index.html'), render({ title, description, canonical, image: '', jsonLd, body }));
}
console.log(`prerender: ${count} hostel pages + list page written`);
