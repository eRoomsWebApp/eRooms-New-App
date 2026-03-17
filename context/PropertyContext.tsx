
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Property, ApprovalStatus, Gender } from '../types';
import { fetchProperties, saveProperty, deleteProperty, bulkSaveProperties } from '../db';
import { INSTITUTES } from '../constants';
import { generatePropertyKey } from '../utils/normalization';

export interface Filters {
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
  addProperty: (property: Property) => Promise<void>;
  bulkAddProperties: (properties: Property[]) => Promise<void>;
  updateProperty: (id: string, property: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  approveProperty: (id: string) => Promise<void>;
  bulkUpdatePrices: (area: string, amount: number) => Promise<void>;
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
    const loadData = async () => {
      const data = await fetchProperties();
      setProperties(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => p.ApprovalStatus === ApprovalStatus.Approved)
      .filter(p => {
        const matchesCoaching = filters.coaching === 'All' || 
          p.InstituteDistanceMatrix?.some(i => i.name === filters.coaching);
        const matchesGender = filters.gender === 'All' || p.Gender === filters.gender;
        const matchesArea = filters.area === 'All' || p.Area === filters.area;

        let matchesPills = true;
        if (filters.activePills.length > 0) {
          matchesPills = filters.activePills.every(pill => {
            const minRent = Math.min(...(p.RentDouble || [0]));
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

        return matchesCoaching && matchesGender && matchesArea && matchesPills;
      });
  }, [properties, filters]);

  const isFiltering = filters.coaching !== 'All' || filters.gender !== 'All' || filters.area !== 'All' || filters.activePills.length > 0;

  const normalize = (p: Property): Property => ({
    ...p,
    InstituteDistanceMatrix: Array.isArray(p.InstituteDistanceMatrix) ? p.InstituteDistanceMatrix : INSTITUTES.map(name => ({ name, distance: 1.0 })),
    Facilities: Array.isArray(p.Facilities) ? p.Facilities : []
  });

  const addProperty = async (property: Property) => {
    const normalized = normalize(property);
    const newList = [...properties, normalized];
    setProperties(newList);
    await saveProperty(normalized);
  };

  const bulkAddProperties = async (newProps: Property[]) => {
    const normalizedProps = newProps.map(normalize);
    
    const newList = [...properties];
    const toSave: Property[] = [];
    
    normalizedProps.forEach(incoming => {
      const incomingKey = generatePropertyKey(incoming.OwnerWhatsApp, incoming.ListingName);
      const existingIndex = newList.findIndex(p => 
        generatePropertyKey(p.OwnerWhatsApp, p.ListingName) === incomingKey
      );
      
      if (existingIndex >= 0) {
        // Update existing record
        const updated = { ...newList[existingIndex], ...incoming, id: newList[existingIndex].id };
        newList[existingIndex] = updated;
        toSave.push(updated);
      } else {
        // Insert new record
        newList.push(incoming);
        toSave.push(incoming);
      }
    });

    setProperties(newList);
    await bulkSaveProperties(toSave);
  };

  const updateProperty = async (id: string, updated: Property) => {
    const normalized = normalize(updated);
    const newList = properties.map(p => p.id === id ? normalized : p);
    setProperties(newList);
    await saveProperty(normalized);
  };

  const deletePropertyHandler = async (id: string) => {
    const newList = properties.filter(p => p.id !== id);
    setProperties(newList);
    await deleteProperty(id);
  };

  const approveProperty = async (id: string) => {
    const newList = properties.map(p => {
      if (p.id === id) {
        const updated = { ...p, ApprovalStatus: ApprovalStatus.Approved };
        saveProperty(updated); // Async background save
        return updated;
      }
      return p;
    });
    setProperties(newList);
  };

  const bulkUpdatePrices = async (area: string, amount: number) => {
    const toSave: Property[] = [];
    const newList = properties.map(p => {
      if (area === 'All' || p.Area === area) {
        const updated = {
          ...p,
          RentSingle: p.RentSingle.map(r => r + amount),
          RentDouble: p.RentDouble.map(r => r + amount)
        };
        toSave.push(updated);
        return updated;
      }
      return p;
    });
    setProperties(newList);
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
