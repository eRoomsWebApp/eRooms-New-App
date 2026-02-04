
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { MOCK_USERS } from '../db';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string, role: UserRole) => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole | 'guest') => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REGISTERED_USERS_KEY = 'erooms_registered_users';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Seed mock users if none exist
    const storedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!storedUsers) {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(MOCK_USERS));
    }

    const storedUser = localStorage.getItem('erooms_auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const getRegisteredUsers = (): any[] => {
    const users = localStorage.getItem(REGISTERED_USERS_KEY);
    return users ? JSON.parse(users) : [];
  };

  const signup = async (userData: any): Promise<boolean> => {
    const users = getRegisteredUsers();
    if (users.find(u => u.email === userData.email)) return false; 

    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      status: UserStatus.Active,
      joinedAt: new Date().toISOString(),
      phone: userData.phone || '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
    };

    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    
    const sessionUser: User = { ...newUser };
    setUser(sessionUser);
    localStorage.setItem('erooms_auth_user', JSON.stringify(sessionUser));
    
    return true;
  };

  const login = async (email: string, pass: string, role: UserRole): Promise<boolean> => {
    if (role === UserRole.Admin && email === 'admin' && pass === '123') {
      const userData: User = { 
        id: 'admin-1', 
        username: 'Super Admin', 
        email: 'admin@erooms.in',
        role: UserRole.Admin,
        status: UserStatus.Active,
        joinedAt: '2023-01-01T00:00:00.000Z'
      };
      setUser(userData);
      localStorage.setItem('erooms_auth_user', JSON.stringify(userData));
      return true;
    }

    const users = getRegisteredUsers();
    const foundUser = users.find(u => u.email === email && u.password === pass && u.role === role);

    if (foundUser) {
      const userData: User = { ...foundUser };
      setUser(userData);
      localStorage.setItem('erooms_auth_user', JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const switchRole = (role: UserRole | 'guest') => {
    if (role === 'guest') {
      logout();
      return;
    }

    const mockData: Record<UserRole, User> = {
      [UserRole.Admin]: { id: 'admin', username: 'Emulator Admin', email: 'admin@erooms.in', role: UserRole.Admin, status: UserStatus.Active },
      [UserRole.Owner]: { id: 'owner', username: 'Emulator Owner', email: 'owner@erooms.in', role: UserRole.Owner, status: UserStatus.Active },
      [UserRole.Student]: { id: 'student', username: 'Emulator Student', email: 'student@erooms.in', role: UserRole.Student, status: UserStatus.Active },
    };

    const userData = mockData[role];
    setUser(userData);
    localStorage.setItem('erooms_auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erooms_auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      switchRole,
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
