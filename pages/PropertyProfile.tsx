import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Wind,
  Wifi,
  Utensils,
  WashingMachine,
  Cctv,
  Droplet,
  Zap,
  Bath,
  BookOpen,
  Shirt,
  Sun,
  Star,
  MapPin,
  Phone,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Sparkles,
  Map as MapIcon,
  Share2,
  Navigation,
  Stethoscope,
  Bus,
  CheckCircle2,
  ArrowLeft,
  LayoutGrid,
  Shield as Safety,
  Coffee as Cup,
  ArrowRight,
  MessageCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X as CloseIcon
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useProperties } from '../context/PropertyContext';
import { PropertyProfileSkeleton } from '../components/Skeleton';
import { transformDriveUrl } from '../utils/urlHelper';
import OptimizedImage from '../components/OptimizedImage';
import { Gender, Property } from '../types';
import { fetchPropertyById } from '../db';
import { SAMPLE_PREVIEW_PROPERTY, SAMPLE_PREVIEW_PROPERTY_ID } from '../data/sampleProperty';
import {
  extractPropertyId,
  getAreaPath,
  getCanonicalUrl,
  SITE_ORIGIN,
  getPropertyPath,
  truncateMeta
} from '../utils/slug';
import { useLeadCapture } from '../components/LeadCaptureSheet';
import LockedLocation from '../components/LockedLocation';
import { useVisitTracker } from '../utils/useVisitTracker';

const facilityIconMap: Record<string, React.ElementType> = {
  AC: Wind,
  WiFi: Wifi,
  'Mess Facility': Utensils,
  Laundry: WashingMachine,
  CCTV: Cctv,
  'RO Water': Droplet,
  Geyser: Zap,
  'Attached Washroom': Bath,
  'Study Table': BookOpen,
  Wardrobe: Shirt,
  Balcony: Sun,
  'Biometric Entry': Safety
};

interface PropertyProfileProps {
  previewId?: string;
}

export const LegacyPropertyRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { properties, loading } = useProperties();
  const [fallbackProp, setFallbackProp] = useState<Property | null>(null);
  const [checkedRemote, setCheckedRemote] = useState(false);

  const localMatch =
    properties.find((p) => p.id === id) ||
    (id === SAMPLE_PREVIEW_PROPERTY_ID ? SAMPLE_PREVIEW_PROPERTY : undefined);

  useEffect(() => {
    if (localMatch || !id || loading) return;
    fetchPropertyById(id)
      .then((res) => setFallbackProp(res))
      .finally(() => setCheckedRemote(true));
  }, [id, localMatch, loading]);

  const target = localMatch || fallbackProp;
  if (target) {
    return <Navigate to={getPropertyPath(target)} replace />;
  }
  if (loading || !checkedRemote) {
    return <PropertyProfileSkeleton />;
  }
  return <Navigate to="/" replace />;
};

const PropertyProfile: React.FC<PropertyProfileProps> = ({ previewId }) => {
  const { propertySlugAndId, id: legacyId } = useParams<{
    areaSlug?: string;
    propertySlugAndId?: string;
    id?: string;
  }>();
  const { properties, loading } = useProperties();
  const { triggerLeadAction } = useLeadCapture();

  const knownWithSample = useMemo(() => [...properties, SAMPLE_PREVIEW_PROPERTY], [properties]);
  const resolvedId =
    previewId || legacyId || extractPropertyId(propertySlugAndId, knownWithSample);

  const [fetchedDirectProperty, setFetchedDirectProperty] = useState<Property | null>(null);
  const [directLookupDone, setDirectLookupDone] = useState(false);

  const property = useMemo(() => {
    return (
      knownWithSample.find((p) => p.id === resolvedId) || fetchedDirectProperty || undefined
    );
  }, [knownWithSample, resolvedId, fetchedDirectProperty]);

  useEffect(() => {
    if (property || !resolvedId || loading) return;
    let active = true;
    fetchPropertyById(resolvedId)
      .then((res) => {
        if (active && res) setFetchedDirectProperty(res);
      })
      .finally(() => {
        if (active) setDirectLookupDone(true);
      });
    return () => {
      active = false;
    };
  }, [property, resolvedId, loading]);

  const [activeRentType, setActiveRentType] = useState<'Single' | 'Double'>('Double');
  const [activeSection, setActiveSection] = useState('overview');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const overviewRef = useRef<HTMLDivElement>(null);
  const infrastructureRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const proximityRef = useRef<HTMLDivElement>(null);
  const managementRef = useRef<HTMLDivElement>(null);

  const sectionRefs = useMemo(
    () => ({
      overview: overviewRef,
      infrastructure: infrastructureRef,
      budget: budgetRef,
      proximity: proximityRef,
      management: managementRef
    }),
    []
  );

  useVisitTracker({
    lastAction: property ? `view: ${property.ListingName}` : `view: ${resolvedId || 'property'}`,
    property
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      Object.entries(sectionRefs).forEach(([key, ref]) => {
        if (
          ref.current &&
          scrollPos >= ref.current.offsetTop &&
          scrollPos < ref.current.offsetTop + ref.current.offsetHeight
        ) {
          setActiveSection(key);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [resolvedId, sectionRefs]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const toKm = (item: { distance: number; unit?: string }) =>
    item.unit === 'm' || item.distance > 50 ? item.distance / 1000 : item.distance;

  const isEcosystemNode = (name: string) =>
    ['HOSPITAL', 'BUS', 'STATION', 'MANDIR', 'MASJID', 'GURUDWARA', 'CAFE', 'MEDICAL', 'MARKET'].some(
      (k) => name.toUpperCase().includes(k)
    );

  const survivalMatrix = useMemo(() => {
    if (!property || !property.InstituteDistanceMatrix || property.InstituteDistanceMatrix.length === 0) {
      return [
        { label: 'Caffeine Node', value: '0.2km', icon: Cup, desc: 'Student Study Cafe' },
        { label: 'Medical Pulse', value: '1.2km', icon: Stethoscope, desc: 'City Hospital' },
        { label: 'Transit Link', value: '0.5km', icon: Bus, desc: 'Local Bus Stop' }
      ];
    }

    const nodes = property.InstituteDistanceMatrix.filter(
      (item) =>
        isEcosystemNode(item.name) ||
        ![
          'ALLEN',
          'MOTION',
          'PW',
          'RESONANCE',
          'VIBRANT',
          'BANSAL',
          'AKASH',
          'ISAC',
          'RELIABLE',
          'UNACADEMY',
          'E-SARAL',
          'SARVAM'
        ].some((brand) => item.name.toUpperCase().includes(brand))
    );

    if (nodes.length > 0) {
      return nodes.slice(0, 3).map((node) => {
        let icon = MapIcon;
        let label = 'Essential Node';
        if (node.name.toUpperCase().includes('CAFE') || node.name.toUpperCase().includes('BREW')) {
          icon = Cup;
          label = 'Caffeine Node';
        }
        if (
          node.name.toUpperCase().includes('HOSPITAL') ||
          node.name.toUpperCase().includes('MEDICAL')
        ) {
          icon = Stethoscope;
          label = 'Medical Pulse';
        }
        if (node.name.toUpperCase().includes('BUS') || node.name.toUpperCase().includes('STATION')) {
          icon = Bus;
          label = 'Transit Link';
        }
        if (
          node.name.toUpperCase().includes('MANDIR') ||
          node.name.toUpperCase().includes('MASJID') ||
          node.name.toUpperCase().includes('GURUDWARA')
        ) {
          icon = Sparkles;
          label = 'Spiritual Node';
        }

        return {
          label,
          value: `${toKm(node).toFixed(1)}km`,
          icon,
          desc: node.name
        };
      });
    }

    return [
      { label: 'Caffeine Node', value: '0.2km', icon: Cup, desc: 'Student Study Cafe' },
      { label: 'Medical Pulse', value: '1.2km', icon: Stethoscope, desc: 'City Hospital' },
      { label: 'Transit Link', value: '0.5km', icon: Bus, desc: 'Local Bus Stop' }
    ];
  }, [property]);

  const categorizedFacilities = useMemo(() => {
    if (!property) return { essential: [], comfort: [], safety: [] };
    return {
      essential: (property.Facilities || []).filter((f) =>
        ['RO Water', 'Mess Facility', 'Study Table', 'Wardrobe'].includes(f)
      ),
      comfort: (property.Facilities || []).filter((f) =>
        ['AC', 'WiFi', 'Laundry', 'Geyser', 'Balcony', 'Attached Washroom'].includes(f)
      ),
      safety: (property.Facilities || []).filter((f) => ['CCTV', 'Biometric Entry'].includes(f))
    };
  }, [property]);

  const sortedMatrix = useMemo(() => {
    if (!property) return [];
    const list = property.InstituteDistanceMatrix || [];
    const coachingOnly = list.filter((item) => !isEcosystemNode(item.name));
    const source = coachingOnly.length > 0 ? coachingOnly : list;
    return [...source].sort((a, b) => toKm(a) - toKm(b));
  }, [property]);

  const allPhotos = useMemo(() => {
    if (!property) return [];
    const base = [property.PhotoMain, property.PhotoRoom, property.PhotoWashroom].filter(Boolean);
    const gallery = property.PhotosGallery || [];
    return [...base, ...gallery];
  }, [property]);

  if ((loading || (!property && !directLookupDone)) && !property) {
    return <PropertyProfileSkeleton />;
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
          Property Not Found
        </h1>
        <p className="text-slate-500 font-bold mb-8">
          This listing may have been updated or removed.
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
        >
          Browse Kota Hostels
        </Link>
      </div>
    );
  }

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'infrastructure', label: 'Amenities' },
    { id: 'budget', label: 'Pricing' },
    { id: 'proximity', label: 'Location' },
    { id: 'management', label: 'Book Visit' }
  ];

  const allRents = [
    ...(Array.isArray(property.RentDouble) ? property.RentDouble : []),
    ...(Array.isArray(property.RentSingle) ? property.RentSingle : [])
  ].filter((n) => typeof n === 'number' && n > 0);
  const minRent = allRents.length > 0 ? Math.min(...allRents) : 0;
  const maxRent = allRents.length > 0 ? Math.max(...allRents) : minRent;

  const cleanArea = property.Area.split(' (')[0];
  const canonicalUrl = getCanonicalUrl(getPropertyPath(property));
  const mainPhoto800 = transformDriveUrl(property.PhotoMain, 800);
  // Static catalogue photos are site-relative (/hostels/media/...); OG + JSON-LD need absolute URLs.
  const mainPhotoAbs = mainPhoto800.startsWith('/') ? `${SITE_ORIGIN}${mainPhoto800}` : mainPhoto800;

  const pageTitle = truncateMeta(
    `${property.ListingName}, ${cleanArea} | eRooms.in`,
    59
  );
  const pageDescription = truncateMeta(
    `${property.ListingType} for ${property.Gender} in ${cleanArea}, Kota from ₹${minRent.toLocaleString('en-IN')}/mo${property.Facilities?.length ? `: ${property.Facilities.slice(0, 4).join(', ')}` : ''}. Photos & free visit on eRooms.in.`,
    154
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LodgingBusiness',
        name: property.ListingName,
        url: canonicalUrl,
        image: mainPhotoAbs,
        description: pageDescription,
        ...(property.Facilities?.length
          ? {
              amenityFeature: property.Facilities.map((f) => ({
                '@type': 'LocationFeatureSpecification',
                name: f,
                value: true
              }))
            }
          : {}),
        priceRange:
          minRent === maxRent
            ? `₹${minRent.toLocaleString('en-IN')}/month`
            : `₹${minRent.toLocaleString('en-IN')} - ₹${maxRent.toLocaleString('en-IN')}/month`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${cleanArea}, Kota`,
          addressLocality: cleanArea,
          addressRegion: 'Rajasthan',
          addressCountry: 'IN'
        }
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
            name: cleanArea,
            item: getCanonicalUrl(getAreaPath(property.Area))
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: property.ListingName,
            item: canonicalUrl
          }
        ]
      }
    ]
  };

  const handleShare = async () => {
    const shareUrl = canonicalUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${property.ListingName} - ${cleanArea}`,
          text: `Check out ${property.ListingName} (${property.ListingType} for ${property.Gender}) in ${cleanArea}, Kota`,
          url: shareUrl
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // ignore
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white min-h-screen pb-40 lg:pb-0 scroll-smooth"
    >
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-[100] origin-left"
        style={{ scaleX }}
      />

      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={mainPhotoAbs} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* 1. Hero Gallery */}
      <section id="overview" ref={overviewRef} className="relative h-[62vh] lg:h-[80vh] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
          <div
            className="lg:col-span-8 h-full relative group cursor-zoom-in"
            onClick={() => setLightboxIndex(0)}
          >
            <OptimizedImage
              src={mainPhoto800}
              width={800}
              height={600}
              priority
              className="w-full h-full transition-transform duration-1000 group-hover:scale-105"
              alt={`${property.ListingName} exterior`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
          </div>
          <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-2 h-full">
            <div
              className="relative overflow-hidden group cursor-zoom-in"
              onClick={() => setLightboxIndex(1)}
            >
              <OptimizedImage
                src={transformDriveUrl(property.PhotoRoom, 800)}
                width={800}
                height={400}
                className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                alt={`${property.ListingName} room`}
              />
              <div className="absolute inset-0 bg-black/15" />
            </div>
            <div
              className="relative overflow-hidden group cursor-zoom-in"
              onClick={() => setLightboxIndex(2)}
            >
              <OptimizedImage
                src={transformDriveUrl(property.PhotoWashroom, 800)}
                width={800}
                height={400}
                className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                alt={`${property.ListingName} washroom`}
              />
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/50 transition-all">
                <span className="text-white font-black uppercase text-xs tracking-widest border border-white/40 px-6 py-3 rounded-xl backdrop-blur-md">
                  View All {allPhotos.length} Photos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Header Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-20">
          <Link
            to="/"
            className="pointer-events-auto bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/25 text-white hover:bg-white hover:text-slate-900 transition-all shadow-xl"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="lg:hidden bg-white/15 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/25 text-white text-[10px] font-black uppercase tracking-widest shadow-xl"
            >
              {allPhotos.length} Photos
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="bg-white/15 backdrop-blur-xl p-3.5 rounded-2xl border border-white/25 text-white hover:bg-white hover:text-slate-900 transition-all shadow-xl flex items-center gap-2"
            >
              <Share2 size={20} />
              {shareCopied && (
                <span className="text-[10px] font-black uppercase tracking-widest">Copied</span>
              )}
            </button>
          </div>
        </div>

        <div className="absolute bottom-12 left-6 lg:left-16 right-6 lg:right-16 text-white pointer-events-none z-20">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                    property.Gender === Gender.Boys
                      ? 'bg-blue-600'
                      : property.Gender === Gender.Girls
                        ? 'bg-pink-600'
                        : 'bg-slate-700'
                  }`}
                >
                  {property.Gender} {property.ListingType}
                </span>
                <span className="bg-emerald-500/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Verified by eRooms
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-tight uppercase break-words">
                {property.ListingName}
              </h1>
              <div className="flex items-center gap-2.5 text-white/85 font-bold">
                <MapPin size={20} className="text-blue-400 flex-shrink-0" />
                <span className="text-base lg:text-xl">
                  {property.Area}, Kota, Rajasthan
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sticky Section Navigation */}
      <nav className="sticky top-20 z-[50] bg-white border-b border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 flex items-center justify-between min-w-max lg:min-w-0">
          <div className="flex gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`py-4 lg:py-5 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
                  activeSection === link.id
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-6 py-3">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                Starting at
              </p>
              <p className="text-xl font-black text-slate-900 leading-none">
                ₹{minRent.toLocaleString('en-IN')}
                <span className="text-[10px] font-bold text-slate-400">/mo</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => triggerLeadAction('Book Free Visit', property)}
              className="bg-blue-600 text-white px-7 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              Book Free Visit
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">
          {/* Main Info Stream */}
          <div className="lg:col-span-8 space-y-20">
            {/* Infrastructure Section */}
            <section id="infrastructure" ref={infrastructureRef} className="space-y-10">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">
                  Amenities & Facilities
                </p>
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter">
                  Included Infrastructure
                </h2>
                <p className="text-slate-500 font-bold max-w-xl text-base leading-relaxed">
                  Verified student housing amenities available at {property.ListingName} in{' '}
                  {cleanArea}, Kota.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                      <Sparkles size={22} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
                      Room Comfort
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {categorizedFacilities.comfort.map((f) => {
                      const Icon = facilityIconMap[f] || Star;
                      return (
                        <div
                          key={f}
                          className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                              <Icon size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              {f}
                            </span>
                          </div>
                          <CheckCircle2 size={16} className="text-blue-600" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                      <BookOpen size={22} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
                      Study & Daily Essentials
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {categorizedFacilities.essential.map((f) => {
                      const Icon = facilityIconMap[f] || Star;
                      return (
                        <div
                          key={f}
                          className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                              <Icon size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              {f}
                            </span>
                          </div>
                          <CheckCircle2 size={16} className="text-blue-600" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {categorizedFacilities.safety.length > 0 && (
                <div className="bg-slate-900 text-white p-10 rounded-[44px] flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10">
                      <Safety size={32} />
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight uppercase">Student Safety</p>
                      <p className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em]">
                        Verified Access & Monitoring
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {categorizedFacilities.safety.map((f) => (
                      <div
                        key={f}
                        className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3"
                      >
                        <CheckCircle2 size={16} className="text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-widest">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Budget Section */}
            <section
              id="budget"
              ref={budgetRef}
              className="bg-slate-50 border border-slate-200 rounded-[40px] p-8 lg:p-14 shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">
                    Transparent Pricing
                  </p>
                  <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase text-slate-900">
                    Monthly Rent & Terms
                  </h2>
                  <p className="text-slate-500 font-bold text-base">
                    Zero brokerage when you book directly through eRooms.in.
                  </p>
                </div>
                <div className="flex p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveRentType('Single')}
                    className={`flex-1 md:flex-none px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeRentType === 'Single'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Single Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRentType('Double')}
                    className={`flex-1 md:flex-none px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeRentType === 'Double'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Double Sharing
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-300">₹</span>
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-none">
                      {(
                        (activeRentType === 'Single'
                          ? Array.isArray(property.RentSingle)
                            ? property.RentSingle[0]
                            : property.RentSingle
                          : Array.isArray(property.RentDouble)
                            ? property.RentDouble[0]
                            : property.RentDouble) || 0
                      ).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl font-bold text-slate-400">/mo</span>
                  </div>

                  {Array.isArray(
                    activeRentType === 'Single' ? property.RentSingle : property.RentDouble
                  ) &&
                    (activeRentType === 'Single'
                      ? property.RentSingle
                      : property.RentDouble
                    ).length > 1 && (
                      <div className="flex flex-wrap gap-2.5 mt-3">
                        <p className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Other Room Variants
                        </p>
                        {(activeRentType === 'Single'
                          ? property.RentSingle
                          : property.RentDouble
                        )
                          .slice(1)
                          .map((price, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-black text-slate-900"
                            >
                              ₹{(price || 0).toLocaleString('en-IN')}/mo
                            </div>
                          ))}
                      </div>
                    )}

                  {(activeRentType === 'Single'
                    ? property.RentSingleDetails
                    : property.RentDoubleDetails) && (
                    <p className="text-xs font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 w-fit">
                      {activeRentType === 'Single'
                        ? property.RentSingleDetails
                        : property.RentDoubleDetails}
                    </p>
                  )}

                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl border border-emerald-100 w-fit">
                    <Zap size={15} />
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      Zero Commission / Brokerage
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  {[
                    {
                      label: 'Electricity',
                      val: `₹${property.ElectricityCharges || 0}`,
                      unit: '/Unit'
                    },
                    {
                      label: 'Parent Stay',
                      val: `₹${property.ParentsStayCharge || 0}`,
                      unit: '/Day'
                    },
                    {
                      label: 'Security',
                      val: property.SecurityDeposit || '1 Month',
                      unit: 'Refundable'
                    },
                    {
                      label: 'Maintenance',
                      val: `₹${property.Maintenance || 0}`,
                      unit: 'Charges'
                    }
                  ].map((fee, i) => (
                    <div
                      key={i}
                      className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm"
                    >
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                        {fee.label}
                      </p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">
                        {fee.val}
                        <span className="text-[10px] ml-1 text-slate-400 font-bold uppercase">
                          {fee.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 p-6 bg-slate-900 text-white rounded-[28px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black tracking-tight">Security Terms</p>
                    <p className="text-xs font-bold text-white/60">{property.SecurityTerms}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContractModal(true)}
                  className="w-full md:w-auto bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all"
                >
                  View Terms Summary
                </button>
              </div>
            </section>

            {/* Location Section */}
            <section id="proximity" ref={proximityRef} className="space-y-10">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">
                  Location & Commute
                </p>
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter">
                  Nearby Institutes
                </h2>
                <p className="text-slate-500 font-bold max-w-xl text-base leading-relaxed">
                  Located in {property.Area}, Kota for quick daily access to coaching campuses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
                    <Navigation size={18} className="text-blue-600" /> Coaching Distances
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                    {sortedMatrix.slice(0, 5).map((item, i) => {
                      const km = toKm(item);
                      return (
                        <div
                          key={i}
                          className="p-5 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base">{item.name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Coaching Institute
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">
                              {km.toFixed(1)} <span className="text-[10px]">KM</span>
                            </p>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                              🚶 {Math.max(1, Math.ceil(km * 12))} min walk
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
                    <MapIcon size={18} className="text-blue-600" /> Neighborhood Essentials
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {survivalMatrix.map((node, i) => (
                      <div
                        key={i}
                        className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center gap-5"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                          <node.icon size={22} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                            {node.label}
                          </p>
                          <p className="text-base font-black text-slate-900">
                            {node.desc}{' '}
                            <span className="text-blue-600 ml-1 font-mono text-xs">
                              [{node.value}]
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                    <LockedLocation property={property} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Booking Sidebar (All inquiries go to eRooms) */}
          <aside id="management" ref={managementRef} className="lg:col-span-4">
            <div className="lg:sticky lg:top-40 space-y-6">
              <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-[0_24px_60px_-16px_rgba(37,99,235,0.12)] relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    eRooms Concierge
                  </p>
                  <span className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={14} /> Zero Brokerage
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    e
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                      {property.ListingName}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {cleanArea}, Kota • Guided Support
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] mb-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    Starting Monthly Rent
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-400">₹</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {minRent.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-slate-400">/mo</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => triggerLeadAction('Get Details on WhatsApp', property)}
                    className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-between font-black uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle size={18} /> Get Details on WhatsApp
                    </span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerLeadAction('Book Free Visit', property)}
                    className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-between font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar size={18} /> Book Free Visit
                    </span>
                    <ArrowRight size={16} />
                  </button>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => triggerLeadAction('Call eRooms', property)}
                      className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      <Phone size={15} /> Call eRooms
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="py-3.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                    >
                      <Share2 size={15} /> {shareCopied ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                    All visits and room availability are coordinated directly by the eRooms.in Kota team.
                  </p>
                </div>
              </div>

              {/* Management Info (No private PII) */}
              <div className="bg-blue-600 text-white rounded-[36px] p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                    <LayoutGrid size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-100 tracking-widest">
                      On-Site Care
                    </p>
                    <p className="text-lg font-black">{property.WardenName || 'Dedicated Warden'}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-blue-100 leading-relaxed">
                  Exact street address and room tour scheduling are shared immediately on WhatsApp once you request details.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-16 left-3 right-3 lg:hidden z-[65]">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-[24px] p-2 flex items-center gap-2 border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={() => triggerLeadAction('Get Details on WhatsApp', property)}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-1.5 font-black uppercase tracking-wider text-[10px]"
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => triggerLeadAction('Book Free Visit', property)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-1.5 font-black uppercase tracking-wider text-[10px]"
          >
            <Calendar size={14} /> Free Visit
          </button>
          <button
            type="button"
            onClick={() => triggerLeadAction('Call eRooms', property)}
            className="w-11 h-11 bg-white text-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0"
            aria-label="Call eRooms"
          >
            <Phone size={18} />
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-20"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors p-3 bg-white/10 rounded-2xl z-[210]"
            >
              <CloseIcon size={28} />
            </button>

            <div
              className="relative w-full max-w-5xl aspect-video flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev - 1 + allPhotos.length) % allPhotos.length : null
                  );
                }}
                className="absolute left-2 md:-left-16 text-white/70 hover:text-white transition-colors p-3 bg-black/40 rounded-full"
              >
                <ChevronLeft size={32} />
              </button>

              <OptimizedImage
                key={lightboxIndex}
                src={transformDriveUrl(allPhotos[lightboxIndex], 800)}
                width={800}
                height={500}
                className="w-full h-full rounded-3xl shadow-2xl"
                alt={`${property.ListingName} photo ${lightboxIndex + 1}`}
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % allPhotos.length : null
                  );
                }}
                className="absolute right-2 md:-right-16 text-white/70 hover:text-white transition-colors p-3 bg-black/40 rounded-full"
              >
                <ChevronRightIcon size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      <AnimatePresence>
        {showContractModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowContractModal(false)}
            className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                    Booking Terms Summary
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {property.ListingName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              <div className="space-y-3 text-sm font-semibold text-slate-600 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p>
                  <span className="text-slate-900 font-black">Security Deposit:</span>{' '}
                  {property.SecurityDeposit || '1 Month Rent'} (Refundable)
                </p>
                <p>
                  <span className="text-slate-900 font-black">Terms:</span>{' '}
                  {property.SecurityTerms}
                </p>
                <p>
                  <span className="text-slate-900 font-black">Electricity:</span> ₹
                  {property.ElectricityCharges}/Unit
                </p>
                <p>
                  <span className="text-slate-900 font-black">Maintenance:</span> ₹
                  {property.Maintenance}
                </p>
                <p>
                  <span className="text-slate-900 font-black">Parent Stay:</span> ₹
                  {property.ParentsStayCharge}/Day
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PropertyProfile;
