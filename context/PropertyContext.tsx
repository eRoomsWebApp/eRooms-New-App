import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Property, ApprovalStatus, Gender } from '../types';
import {
  saveProperty,
  updateProperty as dbUpdateProperty,
  deleteProperty,
  bulkSaveProperties
} from '../db';
import { useConfig } from './ConfigContext';
import { SAMPLE_PREVIEW_PROPERTY } from '../data/sampleProperty';
import { STATIC_PROPERTIES } from '../data/staticProperties';

export interface Filters {
  coaching: string;
  gender: string;
  area: string;
  listingType: string;
  activePills: string[];
  priceRange: [number, number];
  selectedFacilities: string[];
  maxDistance: number; // in meters, 0 means no limit
  roomTypes: string[]; // ['Single', 'Double']
}

export const DEFAULT_FILTERS: Filters = {
  coaching: 'All',
  gender: 'All',
  area: 'All',
  listingType: 'All',
  activePills: [],
  priceRange: [0, 50000],
  selectedFacilities: [],
  maxDistance: 0,
  roomTypes: []
};

interface PropertyContextType {
  properties: Property[];
  filteredProperties: Property[];
  isFiltering: boolean;
  loading: boolean;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  refreshProperties: () => Promise<void>;
  addProperty: (property: Property) => Promise<void>;
  bulkAddProperties: (properties: Property[]) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  approveProperty: (id: string) => Promise<void>;
  bulkUpdatePrices: (area: string, amount: number) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { config } = useConfig();
  const [properties, setProperties] = useState<Property[]>(STATIC_PROPERTIES);
  const [loading, setLoading] = useState(STATIC_PROPERTIES.length === 0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Public hostel listing comes from the static catalogue (data/hostels.json) — zero Firebase reads.
  // Admin / owner writes still go to Firestore through the functions below.
  const refreshProperties = useCallback(async () => {
    setProperties(STATIC_PROPERTIES.length > 0 ? STATIC_PROPERTIES : [SAMPLE_PREVIEW_PROPERTY]);
    setLoading(false);
  }, []);

  useEffect(() => {
    setProperties(STATIC_PROPERTIES.length > 0 ? STATIC_PROPERTIES : [SAMPLE_PREVIEW_PROPERTY]);
    setLoading(false);
  }, []);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => p.ApprovalStatus === ApprovalStatus.Approved)
      .filter(p => {
        const rents = [
          ...(Array.isArray(p.RentDouble) ? p.RentDouble : []),
          ...(Array.isArray(p.RentSingle) ? p.RentSingle : [])
        ].filter(n => typeof n === 'number' && n > 0);
        const minRent = rents.length > 0 ? Math.min(...rents) : 0;

        const matchesType =
          filters.listingType === 'All' ||
          p.ListingType.toLowerCase() === filters.listingType.toLowerCase();

        const matchesCoaching =
          filters.coaching === 'All' ||
          p.InstituteDistanceMatrix?.some(
            i => i.name.toLowerCase() === filters.coaching.toLowerCase()
          );

        const matchesGender =
          filters.gender === 'All' ||
          p.Gender.toLowerCase() === filters.gender.toLowerCase();

        const matchesArea =
          filters.area === 'All' ||
          p.Area.toLowerCase() === filters.area.toLowerCase() ||
          p.Area.toLowerCase().includes(filters.area.toLowerCase());

        const matchesPrice =
          minRent >= filters.priceRange[0] && minRent <= filters.priceRange[1];

        const matchesFacilities =
          filters.selectedFacilities.length === 0 ||
          filters.selectedFacilities.every(f => p.Facilities?.includes(f));

        const toMeters = (item: { distance: number; unit?: string }) =>
          item.unit === 'm' || item.distance > 50 ? item.distance : item.distance * 1000;

        let matchesDistance = true;
        if (filters.maxDistance > 0) {
          if (filters.coaching !== 'All') {
            const match = p.InstituteDistanceMatrix?.find(
              i => i.name.toLowerCase() === filters.coaching.toLowerCase()
            );
            matchesDistance = match !== undefined && toMeters(match) <= filters.maxDistance;
          } else {
            const minDist = Math.min(
              ...(p.InstituteDistanceMatrix?.map(i => toMeters(i)) || [Infinity])
            );
            matchesDistance = minDist <= filters.maxDistance;
          }
        }

        let matchesRoomType = true;
        if (filters.roomTypes.length > 0) {
          matchesRoomType = filters.roomTypes.some(type => {
            if (type === 'Single') return p.RentSingle && p.RentSingle.length > 0;
            if (type === 'Double') return p.RentDouble && p.RentDouble.length > 0;
            return false;
          });
        }

        let matchesPills = true;
        if (filters.activePills.length > 0) {
          matchesPills = filters.activePills.every(pill => {
            switch (pill) {
              case 'Luxury':
                return minRent > 15000;
              case 'Budget':
                return minRent < 10000;
              case 'Girls':
                return p.Gender === Gender.Girls;
              case 'Boys':
                return p.Gender === Gender.Boys;
              case 'Near Allen':
                return p.InstituteDistanceMatrix?.some(
                  i => i.name.includes('Allen') && toMeters(i) < 500
                );
              case 'Near PW':
                return p.InstituteDistanceMatrix?.some(
                  i => i.name.includes('PW') && toMeters(i) < 500
                );
              case 'AC':
                return p.Facilities?.includes('AC');
              case 'Food':
                return p.Facilities?.includes('Mess Facility');
              case 'Hostel':
              case 'PG':
              case 'Flat':
              case 'Mess':
                return p.ListingType === pill;
              default:
                return true;
            }
          });
        }

        return (
          matchesType &&
          matchesCoaching &&
          matchesGender &&
          matchesArea &&
          matchesPills &&
          matchesPrice &&
          matchesFacilities &&
          matchesDistance &&
          matchesRoomType
        );
      })
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        const priorityA = a.priorityScore || 0;
        const priorityB = b.priorityScore || 0;
        if (priorityA !== priorityB) return priorityB - priorityA;
        return a.ListingName.localeCompare(b.ListingName);
      });
  }, [properties, filters]);

  const isFiltering =
    filters.coaching !== 'All' ||
    filters.gender !== 'All' ||
    filters.area !== 'All' ||
    filters.listingType !== 'All' ||
    filters.activePills.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000 ||
    filters.selectedFacilities.length > 0 ||
    filters.maxDistance > 0 ||
    filters.roomTypes.length > 0;

  const normalize = (p: Property): Property => ({
    ...p,
    InstituteDistanceMatrix: Array.isArray(p.InstituteDistanceMatrix)
      ? p.InstituteDistanceMatrix
      : (config?.institutes || []).map(name => ({ name, distance: 1.0, unit: 'km' })),
    Facilities: Array.isArray(p.Facilities) ? p.Facilities : []
  });

  const addProperty = async (property: Property) => {
    const normalized = normalize(property);
    await saveProperty(normalized);
    setProperties(prev => [...prev.filter(x => x.id !== normalized.id), normalized]);
  };

  const bulkAddProperties = async (newProps: Property[]) => {
    const normalizedProps = newProps.map(normalize);
    await bulkSaveProperties(normalizedProps);
    await refreshProperties();
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    await dbUpdateProperty(id, updates);
    setProperties(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePropertyHandler = async (id: string) => {
    await deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const approveProperty = async (id: string) => {
    await updateProperty(id, { ApprovalStatus: ApprovalStatus.Approved });
  };

  const bulkUpdatePrices = async (area: string, amount: number) => {
    const toSave: Property[] = [];
    properties.forEach(p => {
      if (area === 'All' || p.Area === area) {
        toSave.push({
          ...p,
          RentSingle: (p.RentSingle || []).map(r => Math.max(0, r + amount)),
          RentDouble: (p.RentDouble || []).map(r => Math.max(0, r + amount))
        });
      }
    });
    await bulkSaveProperties(toSave);
    await refreshProperties();
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        filteredProperties,
        isFiltering,
        loading,
        filters,
        setFilters,
        refreshProperties,
        addProperty,
        bulkAddProperties,
        updateProperty,
        deleteProperty: deletePropertyHandler,
        approveProperty,
        bulkUpdatePrices
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) throw new Error('useProperties must be used within a PropertyProvider');
  return context;
};
