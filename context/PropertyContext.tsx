
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Property, ApprovalStatus, Gender, ListingType } from '../types';
import { getProperties, saveProperties } from '../db';

interface Filters {
  coaching: string;
  gender: string;
  area: string;
  activePills: string[];
}

interface PropertyContextType {
  properties: Property[];
  filteredProperties: Property[];
  isFiltering: boolean;
  loading: boolean;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  addProperty: (property: Property) => void;
  updateProperty: (id: string, property: Property) => void;
  deleteProperty: (id: string) => void;
  approveProperty: (id: string) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    coaching: 'All',
    gender: 'All',
    area: 'All',
    activePills: []
  });

  useEffect(() => {
    const data = getProperties();
    setProperties(data);
    setLoading(false);
  }, []);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => p.ApprovalStatus === ApprovalStatus.Approved)
      .filter(p => {
        // 1. Smart Search Bar Logic
        const matchesCoaching = filters.coaching === 'All' || 
          p.InstituteDistanceMatrix?.some(i => i.name === filters.coaching);
        const matchesGender = filters.gender === 'All' || p.Gender === filters.gender;
        const matchesArea = filters.area === 'All' || p.Area === filters.area;

        // 2. Quick Filter Pills Logic
        let matchesPills = true;
        if (filters.activePills.length > 0) {
          matchesPills = filters.activePills.every(pill => {
            switch (pill) {
              case 'Luxury': return p.RentDouble > 15000;
              case 'Budget': return p.RentDouble < 10000;
              case 'Girls': return p.Gender === Gender.Girls;
              case 'Boys': return p.Gender === Gender.Boys;
              case 'Near Allen': return p.InstituteDistanceMatrix?.some(i => i.name.includes('Allen') && i.distance < 0.5);
              case 'Near PW': return p.InstituteDistanceMatrix?.some(i => i.name.includes('PW') && i.distance < 0.5);
              case 'AC': return p.Facilities?.includes('AC');
              case 'Food': return p.Facilities?.includes('Mess Facility');
              default: return true;
            }
          });
        }

        return matchesCoaching && matchesGender && matchesArea && matchesPills;
      });
  }, [properties, filters]);

  const isFiltering = filters.coaching !== 'All' || filters.gender !== 'All' || filters.area !== 'All' || filters.activePills.length > 0;

  const addProperty = (property: Property) => {
    // Defensive normalization
    const normalized = {
      ...property,
      InstituteDistanceMatrix: property.InstituteDistanceMatrix || [],
      Facilities: property.Facilities || []
    };
    const newList = [...properties, normalized];
    setProperties(newList);
    saveProperties(newList);
  };

  const updateProperty = (id: string, updated: Property) => {
    // Defensive normalization
    const normalized = {
      ...updated,
      InstituteDistanceMatrix: updated.InstituteDistanceMatrix || [],
      Facilities: updated.Facilities || []
    };
    const newList = properties.map(p => p.id === id ? normalized : p);
    setProperties(newList);
    saveProperties(newList);
  };

  const deleteProperty = (id: string) => {
    const newList = properties.filter(p => p.id !== id);
    setProperties(newList);
    saveProperties(newList);
  };

  const approveProperty = (id: string) => {
    const newList = properties.map(p => 
      p.id === id ? { ...p, ApprovalStatus: ApprovalStatus.Approved } : p
    );
    setProperties(newList);
    saveProperties(newList);
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
      updateProperty, 
      deleteProperty, 
      approveProperty 
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
