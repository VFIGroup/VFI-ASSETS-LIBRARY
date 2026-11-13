import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { Brand } from '../../../lib/types';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Building2, Plus, CheckCircle, ShieldAlert, Tag } from 'lucide-react-native';

export default function BrandManagementScreen() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: brands = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Brand[];
    },
    enabled: isSuperAdmin,
  });

  const handleCreateBrand = async () => {
    if (!brandName.trim() || !brandCode.trim()) {
      Alert.alert('Required Fields', 'Please enter Brand Name and unique Brand Code.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('brands').insert({
        name: brandName.trim(),
        code: brandCode.trim().toUpperCase(),
        description: brandDescription.trim() || null,
        status: 'active',
      });

      if (error) throw error;

      setIsAddModalOpen(false);
      setBrandName('');
      setBrandCode('');
      setBrandDescription('');
      refetch();
      Alert.alert('Brand Created', `Brand ${brandName} has been initialized.`);
    } catch (err: any) {
      Alert.alert('Creation Error', err.message || 'Failed to create brand');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6 text-center">
        <ShieldAlert size={48} color="#f43f5e" className="mb-3" />
        <Text className="text-xl font-bold text-white mb-2">Super Admin Only</Text>
        <Text className="text-xs text-slate-400">
          Only Super Administrators can create and configure multi-brand entities.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        <View className="flex-row items-center justify-between mb-6 flex-wrap gap-4">
          <View>
            <View className="flex-row items-center">
              <Building2 size={24} color="#10b981" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                Brand Directory & Multi-Tenant Entities
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              Manage multi-brand isolation, warehouse partitions, and distributor authorizations
            </Text>
          </View>

          <Button
            title="Create New Brand"
            onPress={() => setIsAddModalOpen(true)}
            variant="primary"
            icon={<Plus size={16} color="#ffffff" />}
            className="bg-emerald-600 border-emerald-600"
          />
        </View>

        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-xs text-slate-400 mt-3">Loading system brands...</Text>
          </View>
        ) : (
          <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {brands.map((brand) => (
              <View
                key={brand.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm justify-between"
              >
                <View>
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 items-center justify-center">
                      <Tag size={20} color="#10b981" />
                    </View>
                    <View className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      <Text className="text-xs font-mono font-bold text-slate-300">
                        {brand.code}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-base font-extrabold text-white mb-1">
                    {brand.name}
                  </Text>
                  <Text className="text-xs text-slate-400 mb-4">
                    {brand.description || 'Enterprise brand division.'}
                  </Text>
                </View>

                <View className="pt-3 border-t border-slate-800 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    <Text className="text-xs font-bold text-emerald-400 uppercase">
                      {brand.status}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-slate-500">
                    ID: {brand.id.slice(0, 8)}...
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add Brand Modal */}
      <Modal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Initialize New Brand Entity"
      >
        <View className="space-y-3">
          <Input
            label="Brand Name *"
            placeholder="e.g. Zenith Commercial Lighting"
            value={brandName}
            onChangeText={setBrandName}
          />
          <Input
            label="Unique Brand Code *"
            placeholder="e.g. ZENITH-LIGHT"
            value={brandCode}
            onChangeText={setBrandCode}
            autoCapitalize="characters"
          />
          <Input
            label="Description / Category"
            placeholder="Commercial illumination and architectural spotlights."
            value={brandDescription}
            onChangeText={setBrandDescription}
            multiline
          />

          <View className="flex-row justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setIsAddModalOpen(false)}
            />
            <Button
              title="Create Brand"
              variant="primary"
              loading={saving}
              onPress={handleCreateBrand}
              className="bg-emerald-600 border-emerald-600 ml-2"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
