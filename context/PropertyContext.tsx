
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Property, ApprovalStatus, Gender } from '../types';
import { subscribeToProperties, saveProperty, deleteProperty, bulkSaveProperties } from '../db';
import { INSTITUTES } from '../constants';
import { useAuth } from './AuthContext';

export interface Filters {
  coaching: string;
  gender: string;
  area: string;
  activePills: string[];
  priceRange: [number, number];
  selectedFacilities: string[];
  maxDistance: number; // in meters, 0 means no limit
  roomTypes: string[]; // ['Single', 'Double']
}

interface PropertyContextType {
  properties: Property[];
  filteredProperties: Property[];
  isFiltering: boolean;
  loading: boolean;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  addProperty: (property: Property) => Promise<void>;
  bulkAddProperties: (properties: Property[]) => Promise<void>;
  updateProperty: (id: string, property: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  approveProperty: (id: string) => Promise<void>;
  bulkUpdatePrices: (area: string, amount: number) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    coaching: 'All',
    gender: 'All',
    area: 'All',
    activePills: [],
    priceRange: [0, 50000],
    selectedFacilities: [],
    maxDistance: 0,
    roomTypes: []
  });

  useEffect(() => {
    const unsubscribe = subscribeToProperties(user?.id, user?.role, (data) => {
      setProperties(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => p.ApprovalStatus === ApprovalStatus.Approved)
      .filter(p => {
        const minRent = Math.min(...(p.RentDouble || [0]), ...(p.RentSingle || [0]));
        
        const matchesCoaching = filters.coaching === 'All' || 
          p.InstituteDistanceMatrix?.some(i => i.name === filters.coaching);
        
        const matchesGender = filters.gender === 'All' || p.Gender === filters.gender;
        const matchesArea = filters.area === 'All' || p.Area === filters.area;
        
        const matchesPrice = minRent >= filters.priceRange[0] && minRent <= filters.priceRange[1];
        
        const matchesFacilities = filters.selectedFacilities.length === 0 || 
          filters.selectedFacilities.every(f => p.Facilities?.includes(f));

        let matchesDistance = true;
        if (filters.maxDistance > 0) {
          if (filters.coaching !== 'All') {
            const dist = p.InstituteDistanceMatrix?.find(i => i.name === filters.coaching)?.distance;
            matchesDistance = dist !== undefined && dist <= filters.maxDistance;
          } else {
            // If "All" coaching is selected, check if it's within distance of ANY institute
            const minDist = Math.min(...(p.InstituteDistanceMatrix?.map(i => i.distance) || [Infinity]));
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
              case 'Luxury': return minRent > 15000;
              case 'Budget': return minRent < 10000;
              case 'Girls': return p.Gender === Gender.Girls;
              case 'Boys': return p.Gender === Gender.Boys;
              case 'Near Allen': return p.InstituteDistanceMatrix?.some(i => i.name.includes('Allen') && i.distance < 500);
              case 'Near PW': return p.InstituteDistanceMatrix?.some(i => i.name.includes('PW') && i.distance < 500);
              case 'AC': return p.Facilities?.includes('AC');
              case 'Food': return p.Facilities?.includes('Mess Facility');
              default: return true;
            }
          });
        }

        return matchesCoaching && matchesGender && matchesArea && matchesPills && matchesPrice && matchesFacilities && matchesDistance && matchesRoomType;
      });
  }, [properties, filters]);

  const isFiltering = filters.coaching !== 'All' || 
                      filters.gender !== 'All' || 
                      filters.area !== 'All' || 
                      filters.activePills.length > 0 ||
                      filters.priceRange[0] > 0 ||
                      filters.priceRange[1] < 50000 ||
                      filters.selectedFacilities.length > 0 ||
                      filters.maxDistance > 0 ||
                      filters.roomTypes.length > 0;

  const normalize = (p: Property): Property => ({
    ...p,
    InstituteDistanceMatrix: Array.isArray(p.InstituteDistanceMatrix) ? p.InstituteDistanceMatrix : INSTITUTES.map(name => ({ name, distance: 1.0 })),
    Facilities: Array.isArray(p.Facilities) ? p.Facilities : []
  });

  const addProperty = async (property: Property) => {
    const normalized = normalize(property);
    await saveProperty(normalized);
  };

  const bulkAddProperties = async (newProps: Property[]) => {
    const normalizedProps = newProps.map(normalize);
    await bulkSaveProperties(normalizedProps);
  };

  const updateProperty = async (id: string, updated: Property) => {
    const normalized = normalize(updated);
    await saveProperty(normalized);
  };

  const deletePropertyHandler = async (id: string) => {
    await deleteProperty(id);
  };

  const approveProperty = async (id: string) => {
    const p = properties.find(prop => prop.id === id);
    if (p) {
      const updated = { ...p, ApprovalStatus: ApprovalStatus.Approved };
      await saveProperty(updated);
    }
  };

  const bulkUpdatePrices = async (area: string, amount: number) => {
    const toSave: Property[] = [];
    properties.forEach(p => {
      if (area === 'All' || p.Area === area) {
        const updated = {
          ...p,
          RentSingle: p.RentSingle.map(r => r + amount),
          RentDouble: p.RentDouble.map(r => r + amount)
        };
        toSave.push(updated);
      }
    });
    await bulkSaveProperties(toSave);
  };

  return (
    <PropertyContext.Provider value={{ 
      properties, 
      filteredProperties, 
      isFiltering,
      loading, 
      filters, 
      setFilters, 
      addProperty, 
      bulkAddProperties,
      updateProperty, 
      deleteProperty: deletePropertyHandler, 
      approveProperty,
      bulkUpdatePrices
    }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) throw new Error('useProperties must be used within a PropertyProvider');
  return context;
};
