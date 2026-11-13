import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { UserProfile, UserRole } from './types';
import { router, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isApproved: boolean;
  role: UserRole | null;
  assignedBrands: string[];
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isApproved: false,
  role: null,
  assignedBrands: [],
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        return null;
      }
      setProfile(data as UserProfile);
      return data as UserProfile;
    } catch (err) {
      console.error('[AuthContext] Fetch profile exception:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Universal Route Guard Protection
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[1] as string | undefined;

    if (!session || !profile) {
      // User is not signed in
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // User is authenticated
      const isSuperAdmin = profile.role === 'super_admin';

      if (isSuperAdmin) {
        // Super admins have immediate bypass access
        if (inAuthGroup) {
          router.replace('/(app)/dashboard');
        }
        return;
      }

      // Check KYC and approval gates for standard partners
      if (profile.kyc_status === 'not_submitted' && currentScreen !== 'kyc-upload') {
        router.replace('/(auth)/kyc-upload');
      } else if (profile.approval_status === 'pending_approval' && currentScreen !== 'pending-approval') {
        router.replace('/(auth)/pending-approval');
      } else if (profile.approval_status === 'rejected') {
        // Show pending-approval screen which displays rejection reason
        if (currentScreen !== 'pending-approval') {
          router.replace('/(auth)/pending-approval');
        }
      } else if (profile.approval_status === 'approved' && inAuthGroup) {
        // Fully approved user trying to view auth pages -> navigate to dashboard
        router.replace('/(app)/dashboard');
      }
    }
  }, [session, profile, isLoading, segments]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    router.replace('/(auth)/login');
  };

  const isApproved = profile?.approval_status === 'approved' || profile?.role === 'super_admin';
  const role = profile?.role ?? null;
  const assignedBrands = profile?.assigned_brands ?? [];

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isApproved,
        role,
        assignedBrands,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
