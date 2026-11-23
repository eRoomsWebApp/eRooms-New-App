import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole, UserStatus, SavedSearch } from '../types';

// Company accounts that always get full Super Admin rights (must match firestore.rules isAdmin()).
export const SUPER_ADMIN_EMAILS = ['kajay5788@gmail.com', 'erooms.edtechsathi@gmail.com'];
const isSuperAdminEmail = (email?: string | null) => !!email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());

interface AuthContextType {
  user: User | null;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            if (isSuperAdminEmail(userData.email) && userData.role !== UserRole.SuperAdmin) {
              try {
                await setDoc(userRef, { role: UserRole.SuperAdmin }, { merge: true });
                setUser({ ...userData, role: UserRole.SuperAdmin });
              } catch {
                setUser({ ...userData, role: UserRole.SuperAdmin });
              }
            } else {
              setUser(userData);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
          if (msg.includes('quota') || msg.includes('resource-exhausted')) {
            console.warn('Firestore quota reached while loading user profile.');
          } else {
            console.error('Error loading user profile:', error);
          }
          setUser(null);
        } finally {
          setIsAuthReady(true);
        }
      } else {
        setUser(null);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = UserRole.Owner) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const finalRole =
          isSuperAdminEmail(firebaseUser.email)
            ? UserRole.SuperAdmin
            : preferredRole === UserRole.Admin || preferredRole === UserRole.SuperAdmin
              ? UserRole.Owner
              : preferredRole;

        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || 'Partner User',
          email: firebaseUser.email || '',
          role: finalRole,
          status: UserStatus.Active,
          isVerified: false,
          joinedAt: new Date().toISOString(),
          avatar:
            firebaseUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
          shortlist: [],
          savedSearches: [],
          activityLog: []
        };
        await setDoc(userRef, newUser);
        setUser(newUser);
      } else {
        setUser(userSnap.data() as User);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
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
    const nextSearches = [...(user.savedSearches || []), newSearch];
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { savedSearches: nextSearches }, { merge: true });
    setUser(prev => (prev ? { ...prev, savedSearches: nextSearches } : prev));
  };

  const removeSavedSearch = async (searchId: string) => {
    if (!user) return;
    const nextSearches = (user.savedSearches || []).filter(s => s.id !== searchId);
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { savedSearches: nextSearches }, { merge: true });
    setUser(prev => (prev ? { ...prev, savedSearches: nextSearches } : prev));
  };

  const toggleShortlist = async (propertyId: string) => {
    if (!user) return;
    const shortlist = user.shortlist || [];
    const isShortlisted = shortlist.includes(propertyId);
    const updatedShortlist = isShortlisted
      ? shortlist.filter(id => id !== propertyId)
      : [...shortlist, propertyId];

    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, { shortlist: updatedShortlist }, { merge: true });
    setUser(prev => (prev ? { ...prev, shortlist: updatedShortlist } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        logout,
        saveSearch,
        removeSavedSearch,
        toggleShortlist,
        isAuthenticated: !!user,
        isAdmin:
          user?.role === UserRole.Admin ||
          user?.role === UserRole.SuperAdmin ||
          isSuperAdminEmail(user?.email),
        isSuperAdmin: user?.role === UserRole.SuperAdmin || isSuperAdminEmail(user?.email),
        isOwner: user?.role === UserRole.Owner,
        isStudent: user?.role === UserRole.Student,
        isAuthReady
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
