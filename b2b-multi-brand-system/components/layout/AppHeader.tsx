import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { useCartStore } from '../../lib/store/useCartStore';
import { ShoppingCart, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { router } from 'expo-router';

export const AppHeader: React.FC = () => {
  const { profile, signOut } = useAuth();
  const totalItemCount = useCartStore((state) => state.getTotalItemCount());

  const canPlaceOrder =
    profile?.role === 'dealer' ||
    profile?.role === 'distributor' ||
    profile?.role === 'super_admin';

  return (
    <View className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 flex-row items-center justify-between">
      {/* Brand & Portal Title */}
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-lg bg-emerald-600 items-center justify-center mr-3 shadow-md shadow-emerald-900/50">
          <ShieldCheck size={20} color="#ffffff" />
        </View>
        <View>
          <Text className="text-white font-extrabold text-base tracking-tight">
            NEXUS B2B
          </Text>
          <Text className="text-slate-400 text-xs font-medium">
            Multi-Brand Warehouse & Orders
          </Text>
        </View>
      </View>

      {/* Right Controls: Role Badge, Cart, Profile & Logout */}
      <View className="flex-row items-center space-x-3">
        {/* Role Badge */}
        {profile?.role && (
          <View className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md">
            <Text className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {profile.role.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* B2B Cart Button (Role-restricted) */}
        {canPlaceOrder && (
          <TouchableOpacity
            onPress={() => router.push('/(app)/cart')}
            className="relative bg-slate-900 border border-slate-800 p-2 rounded-lg active:bg-slate-800"
          >
            <ShoppingCart size={18} color="#e2e8f0" />
            {totalItemCount > 0 && (
              <View className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full w-5 h-5 items-center justify-center border-2 border-slate-950">
                <Text className="text-slate-950 text-xs font-black">
                  {totalItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* User Info / Sign Out */}
        <TouchableOpacity
          onPress={signOut}
          className="flex-row items-center bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg active:bg-slate-800"
        >
          <LogOut size={16} color="#94a3b8" />
          <Text className="text-slate-300 text-xs font-medium ml-1.5 hidden sm:flex">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
