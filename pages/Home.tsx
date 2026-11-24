import React, { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperties, DEFAULT_FILTERS } from '../context/PropertyContext';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { ApprovalStatus, Gender, ListingType } from '../types';
import { useConfig } from '../context/ConfigContext';
import { Helmet } from 'react-helmet-async';
import { Building2, ArrowRight, Zap, MapPin, GraduationCap } from 'lucide-react';
import { transformDriveUrl } from '../utils/urlHelper';
import { PropertyCardSkeleton } from '../components/Skeleton';
import OptimizedImage from '../components/OptimizedImage';
import {
  getPropertyPath,
  getAreaPath,
  getInstitutePath,
  getCanonicalUrl,
  truncateMeta,
  slugify
} from '../utils/slug';
import { saveKnownLeadInfo, EROOMS_WHATSAPP_NUMBER } from '../utils/tracking';
import { useVisitTracker } from '../utils/useVisitTracker';

const Home: React.FC = () => {
  const { filteredProperties, properties, loading, isFiltering, filters, setFilters } = useProperties();
  const { config } = useConfig();
  const [searchParams] = useSearchParams();

  // Read filters & prefill params from query string (?type, ?gender, ?budget, ?institute, ?area, ?name, ?phone)
  useEffect(() => {
    if (!config) return;

    const qType = searchParams.get('type');
    const qGender = searchParams.get('gender');
    const qBudget = searchParams.get('budget');
    const qInstitute = searchParams.get('institute');
    const qArea = searchParams.get('area');
    const qName = searchParams.get('name');
    const qPhone = searchParams.get('phone');

    if (qName || qPhone) {
      saveKnownLeadInfo(qName || '', qPhone || '');
    }

    const hasFilterParam = qType || qGender || qBudget || qInstitute || qArea;
    if (!hasFilterParam) return;

    setFilters((prev) => {
      const next = { ...prev };

      if (qType) {
        const matchedType = Object.values(ListingType).find(
          (t) => t.toLowerCase() === qType.trim().toLowerCase()
        );
        next.listingType = matchedType || qType.trim();
      }

      if (qGender) {
        const matchedGender = Object.values(Gender).find(
          (g) => g.toLowerCase() === qGender.trim().toLowerCase()
        );
        if (matchedGender) next.gender = matchedGender;
      }

      if (qBudget) {
        const parsed = parseInt(qBudget.replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          next.priceRange = [0, parsed];
        }
      }

      if (qInstitute) {
        const matchedInst = config.institutes.find(
          (inst) =>
            inst.toLowerCase() === qInstitute.trim().toLowerCase() ||
            slugify(inst) === slugify(qInstitute)
        );
        next.coaching = matchedInst || qInstitute.trim();
      }

      if (qArea) {
        const matchedArea = config.areas.find(
          (area) =>
            area.toLowerCase() === qArea.trim().toLowerCase() ||
            slugify(area) === slugify(qArea) ||
            area.toLowerCase().includes(qArea.trim().toLowerCase())
        );
        next.area = matchedArea || qArea.trim();
      }

      return next;
    });
  }, [searchParams, config, setFilters]);

  useVisitTracker({
    lastAction: isFiltering ? `browse: filtered (${filters.area}/${filters.coaching})` : 'browse: home',
    area: filters.area !== 'All' ? filters.area : undefined,
    requirement: filters.listingType !== 'All' ? filters.listingType : undefined,
    gender: filters.gender !== 'All' ? filters.gender : undefined,
    budget: filters.priceRange[1] < 50000 ? filters.priceRange[1] : undefined,
    extra1: filters.coaching !== 'All' ? filters.coaching : undefined
  });

  const recommendations = useMemo(() => {
    return properties.filter((p) => p.ApprovalStatus === ApprovalStatus.Approved).slice(0, 3);
  }, [properties]);

  if (!config) return null;

  const pageTitle = truncateMeta('Verified Hostels & PG in Kota | eRooms.in', 59);
  const pageDescription = truncateMeta(
    'Browse verified hostels & PGs in Kota near Allen, Motion & PW with rent, photos and facilities. Zero brokerage, free visit with eRooms.in.',
    154
  );
  const canonicalUrl = getCanonicalUrl('/');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: 'Verified Hostels & PGs in Kota',
        url: canonicalUrl,
        numberOfItems: filteredProperties.length,
        itemListElement: filteredProperties.slice(0, 20).map((p, index) => ({
          '@type': 'ListItem',
          position: index + 1,
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
            name: 'eRooms.in',
            item: 'https://www.erooms.in/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Kota Hostels & PG',
            item: canonicalUrl
          }
        ]
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pb-20"
    >
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

      {/* Announcement Bar */}
      <AnimatePresence>
        {config.announcements
          ?.filter((a) => a.active)
          .map((ann) => (
            <motion.div
              key={ann.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-600 text-white py-3 px-4 text-center relative z-50 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                <Zap size={14} className="animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest">
                  {ann.text}
                  {ann.link && (
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 underline hover:text-blue-200 transition-colors"
                    >
                      Learn More
                    </a>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="bg-slate-50 pt-16 pb-14 px-4 border-b border-slate-100 relative overflow-hidden min-h-[540px] flex items-center">
        <div className="absolute inset-0 z-0">
          {config.heroImages && config.heroImages.length > 0 ? (
            <div className="absolute inset-0">
              <OptimizedImage
                src={config.heroImages[0]}
                className="w-full h-full object-cover opacity-10 grayscale"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/85 via-slate-50/50 to-slate-50" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 via-slate-50 to-slate-50" />
          )}
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center w-full">
          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
              eRooms.in Verified Kota Catalogue
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-5 tracking-tighter">
            {config.tagline}
          </h1>

          <p className="text-slate-500 font-bold text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {config.heroDescription}
          </p>

          <SearchBar />

          {/* Category Quick Links */}
          <div className="mt-10 flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:justify-center lg:overflow-visible">
            {[
              { label: 'All Stays', type: 'All', icon: '✨' },
              { label: 'Hostels', type: 'Hostel', icon: '🏢' },
              { label: 'PGs', type: 'PG', icon: '🏠' },
              { label: 'Flats', type: 'Flat', icon: '🏙️' },
              { label: 'Mess', type: 'Mess', icon: '🍱' }
            ]
              // Only show categories that actually have listings (no empty "Flats"/"Mess" pages).
              .filter((cat) => cat.type === 'All' || properties.some((p) => p.ListingType === cat.type))
              .map((cat) => {
              const isSelected = filters.listingType === cat.type;
              return (
                <button
                  type="button"
                  key={cat.label}
                  onClick={() => setFilters((prev) => ({ ...prev, listingType: cat.type }))}
                  className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl border shadow-sm transition-all group ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                      : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <FilterBar />

      <div id="catalogue-results" className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isFiltering ? 'Matches for your criteria' : 'Verified Stays in Kota'}
            </h2>
            {!loading && (
              <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                {filteredProperties.length} Properties
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isFiltering && (
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, idx) => (
                <PropertyCard key={property.id} property={property} priority={idx < 3} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 px-8 text-center bg-white border border-slate-100 rounded-[32px] shadow-sm max-w-2xl mx-auto"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                🏠
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No matching stays found</h3>
              <p className="text-slate-400 font-bold mb-10">
                We couldn&apos;t find rooms matching all selected filters. Explore these stays instead:
              </p>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Available Options
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((p) => (
                    <Link key={p.id} to={getPropertyPath(p)} className="group block">
                      <div className="aspect-square rounded-2xl overflow-hidden mb-2 border border-slate-100">
                        <OptimizedImage
                          src={transformDriveUrl(p.PhotoMain, 400)}
                          width={400}
                          height={400}
                          className="w-full h-full group-hover:scale-110 transition-transform"
                          alt={p.ListingName}
                        />
                      </div>
                      <p className="text-xs font-black text-slate-900 truncate">{p.ListingName}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="mt-10 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Browse by Area & Institute (SEO Internal Links) */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Explore by Kota Area
                </h2>
                <p className="text-xs font-bold text-slate-400">
                  Student hubs near coaching corridors
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.areas.map((area) => (
                <Link
                  key={area}
                  to={getAreaPath(area)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold border border-slate-100 transition-colors"
                >
                  {area.split(' (')[0]}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Near Coaching Institutes
                </h2>
                <p className="text-xs font-bold text-slate-400">
                  Walking distance hostels and PGs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.institutes.map((inst) => (
                <Link
                  key={inst}
                  to={getInstitutePath(inst)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold border border-slate-100 transition-colors"
                >
                  {inst}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Host CTA Section */}
      <div className="max-w-7xl mx-auto px-4 mt-20 mb-12">
        <div className="bg-slate-900 rounded-[48px] p-10 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 pointer-events-none">
            <Building2 size={240} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase mb-5 leading-tight">
              Own a Hostel or PG in Kota?
            </h2>
            <p className="text-white/70 font-bold text-base mb-8 leading-relaxed">
              Partner with eRooms.in to showcase your property to NEET and JEE students arriving in Kota. Reach our Kota onboarding desk directly on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${EROOMS_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                'Namaste eRooms, mujhe Kota mein apna Hostel / PG list karwana hai.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all group"
            >
              Partner With eRooms <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
