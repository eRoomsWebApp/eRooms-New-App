import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, GraduationCap } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { useConfig } from '../context/ConfigContext';
import { ApprovalStatus } from '../types';
import PropertyCard from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/Skeleton';
import {
  findBySlug,
  getAreaPath,
  getCanonicalUrl,
  getInstitutePath,
  getPropertyPath,
  slugify,
  truncateMeta
} from '../utils/slug';
import { useVisitTracker } from '../utils/useVisitTracker';

interface LandingPageProps {
  mode: 'area' | 'institute';
}

const formatSlugTitle = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const LandingPage: React.FC<LandingPageProps> = ({ mode }) => {
  const { areaSlug, instituteSlug } = useParams<{
    areaSlug?: string;
    instituteSlug?: string;
  }>();
  const { properties, loading } = useProperties();
  const { config } = useConfig();

  const targetName = useMemo(() => {
    if (mode === 'area') {
      const matched = areaSlug && config?.areas ? findBySlug(areaSlug, config.areas) : undefined;
      return matched || formatSlugTitle(areaSlug || 'Kota');
    }
    const matched =
      instituteSlug && config?.institutes ? findBySlug(instituteSlug, config.institutes) : undefined;
    return matched || formatSlugTitle(instituteSlug || 'Allen');
  }, [mode, areaSlug, instituteSlug, config]);

  const toMeters = (item: { distance: number; unit?: string }) =>
    item.unit === 'm' || item.distance > 50 ? item.distance : item.distance * 1000;

  const matchingProperties = useMemo(() => {
    const approved = properties.filter((p) => p.ApprovalStatus === ApprovalStatus.Approved);
    if (mode === 'area') {
      const targetSlug = slugify(targetName);
      return approved.filter(
        (p) =>
          slugify(p.Area) === targetSlug ||
          p.Area.toLowerCase().includes(targetName.split(' (')[0].toLowerCase())
      );
    }

    const instLower = targetName.toLowerCase();
    return approved
      .filter((p) =>
        p.InstituteDistanceMatrix?.some(
          (i) => i.name.toLowerCase() === instLower || slugify(i.name) === slugify(targetName)
        )
      )
      .sort((a, b) => {
        const distA =
          a.InstituteDistanceMatrix?.find((i) => slugify(i.name) === slugify(targetName))?.distance ??
          999;
        const distB =
          b.InstituteDistanceMatrix?.find((i) => slugify(i.name) === slugify(targetName))?.distance ??
          999;
        return toMeters({ distance: distA }) - toMeters({ distance: distB });
      });
  }, [properties, mode, targetName]);

  const routePath =
    mode === 'area' ? getAreaPath(targetName) : getInstitutePath(targetName);
  const canonicalUrl = getCanonicalUrl(routePath);
  const cleanDisplayName = targetName.split(' (')[0];

  useVisitTracker({
    lastAction: mode === 'area' ? `landing-area: ${cleanDisplayName}` : `landing-inst: ${cleanDisplayName}`,
    area: mode === 'area' ? targetName : undefined,
    extra1: mode === 'institute' ? targetName : undefined
  });

  const heading =
    mode === 'area'
      ? `Hostels & PG in ${cleanDisplayName}, Kota`
      : `Hostels & PG Near ${cleanDisplayName}, Kota`;

  const pageTitle = truncateMeta(
    mode === 'area'
      ? `Hostels & PG in ${cleanDisplayName}, Kota | eRooms.in`
      : `Hostels & PG Near ${cleanDisplayName}, Kota | eRooms.in`,
    59
  );

  const pageDescription = truncateMeta(
    mode === 'area'
      ? `Find verified boys and girls hostels, PGs, and student rooms in ${cleanDisplayName}, Kota. Compare transparent monthly rents and book a free visit with eRooms.in.`
      : `Compare verified hostels and PGs at walking distance from ${cleanDisplayName}, Kota. Check room types, amenities, and book a free guided visit via eRooms.in.`,
    154
  );

  const introParagraph =
    mode === 'area'
      ? `${cleanDisplayName} is one of Kota's most sought-after student residential neighborhoods for NEET, JEE, and foundation aspirants. Choosing a hostel or PG in ${cleanDisplayName} gives students practical access to daily coaching classes, study libraries, tiffin and mess kitchens, medical stores, and quiet residential lanes suited for focused preparation. On eRooms.in, every listed stay displays transparent single and double-occupancy monthly rent options, security deposit terms, electricity unit charges, and verified amenities such as air conditioning, attached washrooms, RO drinking water, biometric entry, CCTV security, laundry, and freshly prepared meals. Instead of calling unverified brokers or walking street by street in Kota heat, students and parents can shortlist suitable boys or girls hostels in ${cleanDisplayName}, check exact distances to nearby coaching campuses, and schedule a free guided visit directly with the eRooms.in Kota support team.`
      : `Finding a comfortable hostel or PG near ${cleanDisplayName} in Kota saves valuable daily commute time so students can dedicate more energy to classes, self-study, and test series revisions. Living close to ${cleanDisplayName} helps reduce morning rush and late-evening travel while keeping libraries, bookshops, pharmacies, and student mess hubs within a short walk. Every property listed on eRooms.in highlights its walking distance to ${cleanDisplayName} alongside transparent single and shared room rents, electricity unit rates, security deposit conditions, and everyday essentials like AC, WiFi, RO water, biometric access, CCTV, and laundry services. Whether you are looking for a disciplined boys hostel, a secure girls residency, or a flexible PG near ${cleanDisplayName}, our Kota team coordinates direct property details on WhatsApp and arranges zero-brokerage site visits tailored to your budget.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: heading,
        url: canonicalUrl,
        numberOfItems: matchingProperties.length,
        itemListElement: matchingProperties.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: getCanonicalUrl(getPropertyPath(p)),
          name: p.ListingName
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: getCanonicalUrl('/')
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: cleanDisplayName,
            item: canonicalUrl
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <header className="bg-white border-b border-slate-100 py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:underline mb-6"
          >
            <ArrowLeft size={14} /> All Kota Hostels
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              {mode === 'area' ? <MapPin size={12} /> : <GraduationCap size={12} />}
              {mode === 'area' ? 'Kota Residential Zone' : 'Coaching Proximity'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">
            {heading}
          </h1>

          <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed max-w-4xl">
            {introParagraph}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Available Stays ({matchingProperties.length})
          </h2>
          <Link
            to={
              mode === 'area'
                ? `/?area=${encodeURIComponent(targetName)}`
                : `/?institute=${encodeURIComponent(targetName)}`
            }
            className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
          >
            Open with Full Filters →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : matchingProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {matchingProperties.map((p, idx) => (
              <PropertyCard key={p.id} property={p} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900 mb-2">
              No stays currently listed for {cleanDisplayName}
            </p>
            <p className="text-sm font-bold text-slate-400 mb-6">
              Browse all verified properties across Kota or ask our WhatsApp team for offline options.
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Browse All Kota Stays
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
