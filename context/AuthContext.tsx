
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole, UserStatus, SavedSearch } from '../types';

interface AuthContextType {
  user: User | null;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  saveSearch: (name: string, filters: Record<string, unknown>) => Promise<void>;
  removeSavedSearch: (searchId: string) => Promise<void>;
  toggleShortlist: (propertyId: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isStudent: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // User exists in Auth but not in Firestore
          // This might happen if they closed the tab during the first sign-in
          // We'll leave them as null for now, the sign-in flow should handle creation
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = UserRole.Student) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
          role: preferredRole,
          status: UserStatus.Active,
          joinedAt: new Date().toISOString(),
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          shortlist: [],
          savedSearches: [],
          activityLog: []
        };
        await setDoc(userRef, newUser);
        setUser(newUser);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role };
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, updatedUser);
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const saveSearch = async (name: string, filters: Record<string, unknown>) => {
    if (!user) return;
    
    const newSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name,
      filters: JSON.parse(JSON.stringify(filters)),
      timestamp: new Date().toISOString()
    };

    const updatedUser: User = {
      ...user,
      savedSearches: [...(user.savedSearches || []), newSearch]
    };

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, updatedUser);
    setUser(updatedUser);
  };

  const removeSavedSearch = async (searchId: string) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      savedSearches: (user.savedSearches || []).filter(s => s.id !== searchId)
    };

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, updatedUser);
    setUser(updatedUser);
  };

  const toggleShortlist = async (propertyId: string) => {
    if (!user) return;

    const shortlist = user.shortlist || [];
    const isShortlisted = shortlist.includes(propertyId);
    
    const updatedShortlist = isShortlisted 
      ? shortlist.filter(id => id !== propertyId)
      : [...shortlist, propertyId];

    const updatedUser: User = {
      ...user,
      shortlist: updatedShortlist
    };

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      signInWithGoogle,
      logout,
      updateUserRole,
      saveSearch,
      removeSavedSearch,
      toggleShortlist,
      isAuthenticated: !!user,
      isAdmin: user?.role === UserRole.Admin,
      isOwner: user?.role === UserRole.Owner,
      isStudent: user?.role === UserRole.Student,
      isAuthReady
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
