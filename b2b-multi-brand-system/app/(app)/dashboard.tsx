import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useBrandStore } from '../../lib/store/useBrandStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  FolderArchive,
  ShoppingBag,
  Clock,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Boxes,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { availableBrands, selectedBrandId } = useBrandStore();

  const role = profile?.role;
  const isManagementOrAdmin = role === 'super_admin' || role === 'management';
  const isSuperAdmin = role === 'super_admin';
  const canPlaceOrders = role === 'dealer' || role === 'distributor';

  // Fetch KPI statistics based on role & brand scope
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedBrandId, role],
    queryFn: async () => {
      let pendingOrdersCount = 0;
      let pendingKycCount = 0;
      let totalProductsCount = 0;
      let totalAssetsCount = 0;

      // Pending Stage-1 Orders count
      let orderQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');
      if (selectedBrandId !== 'ALL') {
        orderQuery = orderQuery.eq('brand_id', selectedBrandId);
      }
      const orderRes = await orderQuery;
      pendingOrdersCount = orderRes.count || 0;

      // Pending KYC (Admin / Management only)
      if (isManagementOrAdmin) {
        const kycRes = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('approval_status', 'pending_approval');
        pendingKycCount = kycRes.count || 0;
      }

      // Products count
      let prodQuery = supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (selectedBrandId !== 'ALL') {
        prodQuery = prodQuery.eq('brand_id', selectedBrandId);
      }
      const prodRes = await prodQuery;
      totalProductsCount = prodRes.count || 0;

      // Brand Assets count
      let assetQuery = supabase
        .from('brand_assets')
        .select('*', { count: 'exact', head: true });
      if (selectedBrandId !== 'ALL') {
        assetQuery = assetQuery.eq('brand_id', selectedBrandId);
      }
      const assetRes = await assetQuery;
      totalAssetsCount = assetRes.count || 0;

      return {
        pendingOrdersCount,
        pendingKycCount,
        totalProductsCount,
        totalAssetsCount,
      };
    },
  });

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Welcome Banner */}
        <View className="bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center justify-between flex-wrap gap-4">
            <View>
              <Text className="text-xl md:text-2xl font-black text-white">
                Welcome back, {profile?.full_name}
              </Text>
              <Text className="text-xs md:text-sm text-slate-400 mt-1">
                {profile?.company_name ? `${profile.company_name} • ` : ''}
                Access Tier: <Text className="text-emerald-400 font-bold uppercase">{role?.replace('_', ' ')}</Text>
              </Text>
            </View>

            <View className="flex-row items-center bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
              <Boxes size={18} color="#10b981" />
              <Text className="text-xs text-slate-300 font-semibold ml-2">
                Authorized Brands: <Text className="text-white font-bold">{isSuperAdmin ? 'All System Brands' : availableBrands.length}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Metrics Grid */}
        <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Metric 1: Stage-1 Pending Approvals */}
          <TouchableOpacity
            onPress={() => router.push(isManagementOrAdmin ? '/(app)/orders/approval' : '/(app)/orders')}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isManagementOrAdmin ? 'Pending Stage-1 Orders' : 'My Pending Orders'}
              </Text>
              <View className="p-2 rounded-lg bg-amber-500/10">
                <Clock size={18} color="#f59e0b" />
              </View>
            </View>
            <Text className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : stats?.pendingOrdersCount ?? 0}
            </Text>
            <Text className="text-[11px] text-amber-400 font-medium mt-1">
              Awaiting Stage-1 Review
            </Text>
          </TouchableOpacity>

          {/* Metric 2: Pending KYC Verifications */}
          {isManagementOrAdmin ? (
            <TouchableOpacity
              onPress={() => router.push('/(app)/admin/kyc-verification')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pending KYC Reviews
                </Text>
                <View className="p-2 rounded-lg bg-blue-500/10">
                  <ShieldCheck size={18} color="#3b82f6" />
                </View>
              </View>
              <Text className="text-3xl font-extrabold text-white">
                {isLoading ? '...' : stats?.pendingKycCount ?? 0}
              </Text>
              <Text className="text-[11px] text-blue-400 font-medium mt-1">
                New partner registrations
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(app)/orders')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Orders Tracking
                </Text>
                <View className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp size={18} color="#3b82f6" />
                </View>
              </View>
              <Text className="text-3xl font-extrabold text-white">Live</Text>
              <Text className="text-[11px] text-blue-400 font-medium mt-1">
                Fulfillment & Tracking
              </Text>
            </TouchableOpacity>
          )}

          {/* Metric 3: Products in Catalog */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/catalog')}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Product Catalog
              </Text>
              <View className="p-2 rounded-lg bg-emerald-500/10">
                <ShoppingBag size={18} color="#10b981" />
              </View>
            </View>
            <Text className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : stats?.totalProductsCount ?? 0}
            </Text>
            <Text className="text-[11px] text-emerald-400 font-medium mt-1">
              Active SKUs with Tiered Rates
            </Text>
          </TouchableOpacity>

          {/* Metric 4: Warehouse Assets */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/warehouse')}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Warehouse Assets
              </Text>
              <View className="p-2 rounded-lg bg-purple-500/10">
                <FolderArchive size={18} color="#8b5cf6" />
              </View>
            </View>
            <Text className="text-3xl font-extrabold text-white">
              {isLoading ? '...' : stats?.totalAssetsCount ?? 0}
            </Text>
            <Text className="text-[11px] text-purple-400 font-medium mt-1">
              Marketing kits & spec sheets
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Launchpad */}
        <Text className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Operational Modules
        </Text>
        <View className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push('/(app)/warehouse')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-600/50 p-5 rounded-xl transition"
          >
            <FolderArchive size={28} color="#10b981" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">
              Multi-Brand Asset Warehouse
            </Text>
            <Text className="text-xs text-slate-400 leading-relaxed mb-3">
              Access high-resolution branding assets, CAD spec sheets, and marketing brochures isolated by brand permission.
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-emerald-400 mr-1">Enter Warehouse</Text>
              <ArrowRight size={13} color="#34d399" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(app)/catalog')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-600/50 p-5 rounded-xl transition"
          >
            <ShoppingBag size={28} color="#3b82f6" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">
              Brand Product Catalogs & Pricing
            </Text>
            <Text className="text-xs text-slate-400 leading-relaxed mb-3">
              Browse brand-wise inventories with locked {role === 'distributor' ? 'Distributor Tier' : 'Dealer Tier'} pricing.
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-blue-400 mr-1">Browse Catalog</Text>
              <ArrowRight size={13} color="#60a5fa" />
            </View>
          </TouchableOpacity>

          {isManagementOrAdmin ? (
            <TouchableOpacity
              onPress={() => router.push('/(app)/orders/approval')}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-600/50 p-5 rounded-xl transition"
            >
              <FileCheck2 size={28} color="#f59e0b" className="mb-3" />
              <Text className="text-base font-bold text-white mb-1">
                Stage-1 Order Approvals
              </Text>
              <Text className="text-xs text-slate-400 leading-relaxed mb-3">
                Review submitted bulk orders, examine dealer credit/stock allocation, and approve or reject with audit remarks.
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-amber-400 mr-1">Review Queue</Text>
                <ArrowRight size={13} color="#fbbf24" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(app)/orders')}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-600/50 p-5 rounded-xl transition"
            >
              <Clock size={28} color="#f59e0b" className="mb-3" />
              <Text className="text-base font-bold text-white mb-1">
                Track My B2B Orders
              </Text>
              <Text className="text-xs text-slate-400 leading-relaxed mb-3">
                Monitor status across Stage-1 review, invoicing, packing, and courier dispatch with real-time tracking numbers.
              </Text>
              <View className="flex-row items-center">
                <Text className="text-xs font-bold text-amber-400 mr-1">View Orders</Text>
                <ArrowRight size={13} color="#fbbf24" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
