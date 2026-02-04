
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string, role: UserRole) => Promise<boolean>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
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
    if (users.find(u => u.email === userData.email)) return false; // User exists

    const newUser = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
    };

    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    
    // Auto-login after signup - Ensure email is included in the session user
    const sessionUser: User = { 
      id: newUser.id, 
      username: newUser.username, 
      email: newUser.email,
      role: newUser.role 
    };
    setUser(sessionUser);
    localStorage.setItem('erooms_auth_user', JSON.stringify(sessionUser));
    
    return true;
  };

  const login = async (email: string, pass: string, role: UserRole): Promise<boolean> => {
    // 1. Check Hardcoded Super Admin - Ensure email is included
    if (role === UserRole.Admin && email === 'admin' && pass === '123') {
      const userData: User = { 
        id: 'admin-1', 
        username: 'Super Admin', 
        email: 'admin',
        role: UserRole.Admin 
      };
      setUser(userData);
      localStorage.setItem('erooms_auth_user', JSON.stringify(userData));
      return true;
    }

    // 2. Check Registered Users (Owners/Students)
    const users = getRegisteredUsers();
    const foundUser = users.find(u => u.email === email && u.password === pass && u.role === role);

    if (foundUser) {
      // Ensure email is included from found user data
      const userData: User = { 
        id: foundUser.id, 
        username: foundUser.username, 
        email: foundUser.email,
        role: foundUser.role 
      };
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

    // Emulator roles: Ensure email is populated for type compliance
    const mockData: Record<UserRole, User> = {
      [UserRole.Admin]: { id: 'admin', username: 'Emulator Admin', email: 'admin@erooms.in', role: UserRole.Admin },
      [UserRole.Owner]: { id: 'owner', username: 'Emulator Owner', email: 'owner@erooms.in', role: UserRole.Owner },
      [UserRole.Student]: { id: 'student', username: 'Emulator Student', email: 'student@erooms.in', role: UserRole.Student },
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
