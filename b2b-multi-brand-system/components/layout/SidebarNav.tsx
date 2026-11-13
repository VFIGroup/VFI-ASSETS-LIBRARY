import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import {
  LayoutDashboard,
  FolderArchive,
  ShoppingBag,
  FileCheck2,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Building2,
} from 'lucide-react-native';

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { profile } = useAuth();
  const role = profile?.role;

  const isManagementOrAdmin = role === 'super_admin' || role === 'management';
  const isSuperAdmin = role === 'super_admin';
  const canOrder = role === 'dealer' || role === 'distributor' || role === 'super_admin';

  const navItems = [
    {
      title: 'Dashboard',
      path: '/(app)/dashboard',
      icon: <LayoutDashboard size={18} color={pathname.includes('/dashboard') ? '#10b981' : '#94a3b8'} />,
      show: true,
    },
    {
      title: 'Data Warehouse',
      path: '/(app)/warehouse',
      icon: <FolderArchive size={18} color={pathname.includes('/warehouse') ? '#10b981' : '#94a3b8'} />,
      show: true,
    },
    {
      title: 'Product Catalog',
      path: '/(app)/catalog',
      icon: <ShoppingBag size={18} color={pathname.includes('/catalog') ? '#10b981' : '#94a3b8'} />,
      show: true,
    },
    {
      title: 'B2B Orders',
      path: '/(app)/orders',
      icon: <Clock size={18} color={pathname.includes('/orders') && !pathname.includes('/approval') ? '#10b981' : '#94a3b8'} />,
      show: true,
    },
    {
      title: 'Stage-1 Approvals',
      path: '/(app)/orders/approval',
      icon: <FileCheck2 size={18} color={pathname.includes('/orders/approval') ? '#10b981' : '#94a3b8'} />,
      show: isManagementOrAdmin,
      badge: 'Review',
    },
    {
      title: 'KYC Verifications',
      path: '/(app)/admin/kyc-verification',
      icon: <ShieldAlert size={18} color={pathname.includes('/admin/kyc') ? '#10b981' : '#94a3b8'} />,
      show: isManagementOrAdmin,
      badge: 'Admin',
    },
    {
      title: 'Brand Management',
      path: '/(app)/admin/brands',
      icon: <Building2 size={18} color={pathname.includes('/admin/brands') ? '#10b981' : '#94a3b8'} />,
      show: isSuperAdmin,
    },
  ];

  return (
    <View className="w-64 bg-slate-900 border-r border-slate-800 p-4 justify-between h-full">
      <View>
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider px-3 mb-3">
          Navigation
        </Text>
        <ScrollView>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <TouchableOpacity
                  key={item.path}
                  onPress={() => router.push(item.path as any)}
                  className={`flex-row items-center justify-between px-3 py-2.5 rounded-lg mb-1.5 ${
                    isActive ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-850 active:bg-slate-800'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="mr-3">{item.icon}</View>
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {item.title}
                    </Text>
                  </View>
                  {item.badge && (
                    <View className="bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-emerald-400">
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      {/* Profile info footer in sidebar */}
      <View className="pt-4 border-t border-slate-800">
        <Text className="text-white text-xs font-bold truncate">
          {profile?.full_name || 'Partner Account'}
        </Text>
        <Text className="text-slate-400 text-xs truncate">
          {profile?.company_name || profile?.email}
        </Text>
      </View>
    </View>
  );
};
