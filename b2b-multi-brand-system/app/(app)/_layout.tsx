import React, { useEffect } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { AppHeader } from '../../components/layout/AppHeader';
import { SidebarNav } from '../../components/layout/SidebarNav';
import { BrandSelector } from '../../components/layout/BrandSelector';
import { useAuth } from '../../lib/auth-context';
import { useBrandStore } from '../../lib/store/useBrandStore';
import { supabase } from '../../lib/supabase';
import { Brand } from '../../lib/types';

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const { setAvailableBrands } = useBrandStore();

  const isDesktop = width >= 768; // Tailwind md breakpoint

  useEffect(() => {
    async function fetchUserBrands() {
      if (!profile) return;

      let query = supabase.from('brands').select('*').eq('status', 'active');

      if (profile.role !== 'super_admin' && profile.assigned_brands?.length > 0) {
        query = query.in('id', profile.assigned_brands);
      }

      const { data } = await query;
      if (data) {
        setAvailableBrands(data as Brand[]);
      }
    }

    fetchUserBrands();
  }, [profile]);

  return (
    <View className="flex-1 bg-slate-950">
      {/* Top Universal App Header */}
      <AppHeader />

      {/* Brand Switcher Bar */}
      <BrandSelector />

      {/* Responsive Workspace: Desktop Sidebar + Content */}
      <View className="flex-1 flex-row">
        {isDesktop && <SidebarNav />}

        <View className="flex-1 bg-slate-950 overflow-hidden">
          <Slot />
        </View>
      </View>
    </View>
  );
}
