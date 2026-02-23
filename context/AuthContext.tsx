
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, UserStatus, SavedSearch } from '../types';
import { getMockUsers } from '../db';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string, role: UserRole) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole | 'guest') => void;
  saveSearch: (name: string, filters: any) => Promise<void>;
  removeSavedSearch: (searchId: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REGISTERED_USERS_KEY = 'erooms_atlas_users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!storedUsers) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(getMockUsers()));
    }

    const storedUser = localStorage.getItem('erooms_auth_session');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getRegisteredUsers = (): any[] => {
    const users = localStorage.getItem(REGISTERED_USERS_KEY);
    return users ? JSON.parse(users) : [];
  };

  const updateGlobalUser = (updatedUser: User) => {
    const users = getRegisteredUsers();
    const index = users.findIndex(u => u.email === updatedUser.email);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }
  };

  const saveSearch = async (name: string, filters: any) => {
    if (!user) return;
    
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name,
      filters: JSON.parse(JSON.stringify(filters)),
      timestamp: new Date().toISOString()
    };

    const updatedUser: User = {
      ...user,
      savedSearches: [...(user.savedSearches || []), newSearch],
      activityLog: [
        { 
          id: `log-${Date.now()}`, 
          action: 'Signal Captured', 
          target: name, 
          timestamp: new Date().toISOString(), 
          importance: 'medium' as const
        },
        ...(user.activityLog || [])
      ]
    };

    setUser(updatedUser);
    localStorage.setItem('erooms_auth_session', JSON.stringify(updatedUser));
    updateGlobalUser(updatedUser);
  };

  const removeSavedSearch = async (searchId: string) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      savedSearches: (user.savedSearches || []).filter(s => s.id !== searchId)
    };

    setUser(updatedUser);
    localStorage.setItem('erooms_auth_session', JSON.stringify(updatedUser));
    updateGlobalUser(updatedUser);
  };

  const signup = async (userData: any): Promise<boolean> => {
    const users = getRegisteredUsers();
    if (users.find(u => u.email === userData.email)) return false; 

    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      status: UserStatus.Active,
      joinedAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      savedSearches: [],
      activityLog: [
        { 
          id: `log-${Date.now()}`, 
          action: 'Onboarding Complete', 
          target: 'Platform Hub', 
          timestamp: new Date().toISOString(), 
          importance: 'high' as const
        }
      ],
      behavioralMetrics: userData.role === UserRole.Student ? {
        avgSessionTime: 0,
        totalSessions: 1,
        pricePreference: { min: 5000, max: 20000 },
        topAreas: [],
        topFacilities: [],
        searchDepth: 0
      } : undefined
    };

    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('erooms_auth_session', JSON.stringify(newUser));
    return true;
  };

  const login = async (email: string, pass: string, role: UserRole): Promise<boolean> => {
    if (role === UserRole.Admin && email === 'admin' && pass === '123') {
      const userData: User = { id: 'admin-1', username: 'Super Admin', email: 'admin@erooms.in', role: UserRole.Admin, status: UserStatus.Active, savedSearches: [] };
      setUser(userData);
      localStorage.setItem('erooms_auth_session', JSON.stringify(userData));
      return true;
    }

    const users = getRegisteredUsers();
    const foundUser = users.find(u => u.email === email && u.password === pass && u.role === role);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('erooms_auth_session', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const switchRole = (role: UserRole | 'guest') => {
    if (role === 'guest') {
      logout();
      return;
    }

    // Comprehensive Mock Data Injection for Inspection
    const userData: User = { 
      id: `emu-${role}`, 
      username: role === UserRole.Student ? 'Aarav Sharma' : role === UserRole.Owner ? 'Vikram Malhotra' : 'Super Admin', 
      email: `${role}@erooms.in`, 
      role: role as UserRole, 
      status: UserStatus.Active, 
      avatar: role === UserRole.Student 
        ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav' 
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
      savedSearches: role === UserRole.Student ? [
        { 
          id: 's1', 
          name: 'Premium Landmark Selection', 
          timestamp: new Date(Date.now() - 86400000).toISOString(), 
          filters: { coaching: 'Allen Samyak', gender: 'Boys', area: 'Landmark City (Kunadi)', activePills: ['Luxury', 'AC'] } 
        },
        { 
          id: 's2', 
          name: 'Budget Indra Vihar', 
          timestamp: new Date(Date.now() - 172800000).toISOString(), 
          filters: { coaching: 'Motion', gender: 'Boys', area: 'Indra Vihar', activePills: ['Budget', 'Food'] } 
        }
      ] : [],
      activityLog: [
        { id: 'l1', action: 'Platform Entry', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), importance: 'low' as const, target: 'Discovery Hub' },
        { id: 'l2', action: 'Signal Captured', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), importance: 'medium' as const, target: 'Premium Landmark Selection' },
        { id: 'l3', action: 'Node Inspection', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), importance: 'high' as const, target: 'Zenith Elite Hostel' },
        { id: 'l4', action: 'Filter Grid Refinement', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), importance: 'low' as const, target: 'Price: 15k+' },
        { id: 'l5', action: 'Identity Verification', timestamp: new Date(Date.now() - 86400000).toISOString(), importance: 'high' as const, target: 'Biometric Core' },
      ],
      behavioralMetrics: role === UserRole.Student ? {
        avgSessionTime: 18.4,
        totalSessions: 142,
        pricePreference: { min: 12000, max: 19500 },
        topAreas: ['Landmark City', 'Kunadi', 'Coral Park'],
        topFacilities: ['AC', 'Mess Facility', 'Biometric Entry', 'Laundry', 'Balcony'],
        searchDepth: 9.2
      } : undefined
    };
    
    setUser(userData);
    localStorage.setItem('erooms_auth_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erooms_auth_session');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      switchRole,
      saveSearch,
      removeSavedSearch,
      isAuthenticated: !!user,
      isAdmin: user?.role === UserRole.Admin,
      isOwner: user?.role === UserRole.Owner,
      isStudent: user?.role === UserRole.Student
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
