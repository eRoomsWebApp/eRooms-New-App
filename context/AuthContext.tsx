
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
  isSuperAdmin: boolean;
  isOwner: boolean;
  isStudent: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Subscribe to user profile from Firestore for real-time sync
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            
            // Auto-upgrade to SuperAdmin if email matches and role is not SuperAdmin
            if (userData.email === 'kajay5788@gmail.com' && userData.role !== UserRole.SuperAdmin) {
              await setDoc(userRef, { role: UserRole.SuperAdmin }, { merge: true });
              // The next snapshot will have the updated role
              return;
            }
            
            setUser(userData);
          } else {
            setUser(null);
          }
          setIsAuthReady(true);
        }, (error) => {
          console.error("Error syncing user profile:", error);
          setIsAuthReady(true);
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setUser(null);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = UserRole.Student) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const finalRole = firebaseUser.email === 'kajay5788@gmail.com' ? UserRole.SuperAdmin : preferredRole;
        
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
          role: finalRole,
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
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { role }, { merge: true });
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

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { 
      savedSearches: [...(user.savedSearches || []), newSearch] 
    }, { merge: true });
  };

  const removeSavedSearch = async (searchId: string) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { 
      savedSearches: (user.savedSearches || []).filter(s => s.id !== searchId)
    }, { merge: true });
  };

  const toggleShortlist = async (propertyId: string) => {
    if (!user) return;

    const shortlist = user.shortlist || [];
    const isShortlisted = shortlist.includes(propertyId);
    
    const updatedShortlist = isShortlisted 
      ? shortlist.filter(id => id !== propertyId)
      : [...shortlist, propertyId];

    const userRef = doc(db, 'users', user.id);
    // We only update Firestore, the onSnapshot will update the local state
    await setDoc(userRef, { shortlist: updatedShortlist }, { merge: true });
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
      isAdmin: user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin || user?.email === 'kajay5788@gmail.com',
      isSuperAdmin: user?.role === UserRole.SuperAdmin || user?.email === 'kajay5788@gmail.com',
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
