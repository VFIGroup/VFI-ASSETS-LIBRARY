import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useBrandStore } from '../../lib/store/useBrandStore';
import { useAuth } from '../../lib/auth-context';
import { Tag } from 'lucide-react-native';

export const BrandSelector: React.FC = () => {
  const { availableBrands, selectedBrandId, setSelectedBrandId } = useBrandStore();
  const { profile } = useAuth();

  const isSuperAdmin = profile?.role === 'super_admin';

  if (!availableBrands || availableBrands.length === 0) {
    return null;
  }

  return (
    <View className="py-2.5 px-4 bg-slate-900 border-b border-slate-800">
      <View className="flex-row items-center mb-1.5">
        <Tag size={13} color="#94a3b8" />
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-1.5">
          Active Brand Scope:
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {isSuperAdmin && (
          <TouchableOpacity
            onPress={() => setSelectedBrandId('ALL')}
            className={`px-3 py-1.5 rounded-lg mr-2 border ${
              selectedBrandId === 'ALL'
                ? 'bg-emerald-600 border-emerald-500'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedBrandId === 'ALL' ? 'text-white' : 'text-slate-300'
              }`}
            >
              All Brands (Admin Scope)
            </Text>
          </TouchableOpacity>
        )}

        {availableBrands.map((brand) => {
          const isSelected = selectedBrandId === brand.id;
          return (
            <TouchableOpacity
              key={brand.id}
              onPress={() => setSelectedBrandId(brand.id)}
              className={`px-3 py-1.5 rounded-lg mr-2 border ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-500'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {brand.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
