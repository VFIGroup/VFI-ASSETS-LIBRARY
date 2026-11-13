import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth-context';
import { useBrandStore } from '../../../lib/store/useBrandStore';
import { warehouseApi } from '../../../lib/api/warehouse';
import { AssetCard } from '../../../components/warehouse/AssetCard';
import { AssetCategory, BrandAsset } from '../../../lib/types';
import { Button } from '../../../components/ui/Button';
import {
  FolderArchive,
  Search,
  Upload,
  Filter,
  FileBox,
  Image as ImageIcon,
  Video,
  FileText,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

export default function WarehouseScreen() {
  const { profile } = useAuth();
  const { selectedBrandId, availableBrands } = useBrandStore();
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Asset upload state (for Admin & Management)
  const isManagementOrAdmin = profile?.role === 'super_admin' || profile?.role === 'management';
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadBrandId, setUploadBrandId] = useState('');
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>('marketing_kit');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch assets filtered by active brand scope & category
  const {
    data: assets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['warehouse-assets', selectedBrandId, selectedCategory],
    queryFn: async () => {
      const cat = selectedCategory === 'ALL' ? undefined : selectedCategory;
      return await warehouseApi.fetchBrandAssets(selectedBrandId, cat);
    },
  });

  const categories: { id: AssetCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Collateral' },
    { id: 'marketing_kit', label: 'Marketing Kits' },
    { id: 'product_catalog_pdf', label: 'Catalogs (PDF)' },
    { id: 'spec_sheet', label: 'Technical Spec Sheets' },
    { id: 'high_res_image', label: 'High-Res Media' },
    { id: 'video', label: 'Brand Videos' },
    { id: 'price_list', label: 'Price Lists' },
  ];

  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      asset.title.toLowerCase().includes(q) ||
      asset.description?.toLowerCase().includes(q) ||
      asset.brand?.name.toLowerCase().includes(q)
    );
  });

  const handlePickAssetFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setSelectedFile(res.assets[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim() || !uploadBrandId || !selectedFile) {
      alert('Please provide title, select brand, and attach an asset file.');
      return;
    }

    try {
      setUploading(true);
      await warehouseApi.uploadBrandAsset(
        uploadBrandId,
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
          size: selectedFile.size,
        },
        {
          title: uploadTitle.trim(),
          description: uploadDesc.trim(),
          category: uploadCategory,
        }
      );

      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setSelectedFile(null);
      refetch();
      alert('Brand asset published to Data Warehouse.');
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 flex-wrap gap-4">
          <View>
            <View className="flex-row items-center">
              <FolderArchive size={24} color="#10b981" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                Multi-Brand Data Warehouse
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              Secure digital asset repository with role-based isolation & signed downloads
            </Text>
          </View>

          {isManagementOrAdmin && (
            <Button
              title="Upload Brand Asset"
              onPress={() => {
                setUploadBrandId(
                  selectedBrandId !== 'ALL' ? selectedBrandId : availableBrands[0]?.id || ''
                );
                setIsUploadModalOpen(true);
              }}
              variant="primary"
              icon={<Upload size={16} color="#ffffff" />}
              className="bg-emerald-600 border-emerald-600"
            />
          )}
        </View>

        {/* Filter Bar: Search + Category Pills */}
        <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 mb-4">
            <Search size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search assets by title, keyword, or brand..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-sm text-white ml-2 py-0"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg mr-2 border ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Assets Grid */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-xs text-slate-400 mt-3">
              Loading authorized brand assets...
            </Text>
          </View>
        ) : filteredAssets.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-xl p-12 items-center text-center">
            <FileBox size={42} color="#64748b" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">
              No Brand Assets Found
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm text-center">
              No collateral available for the selected brand or category filters under your account permissions.
            </Text>
          </View>
        ) : (
          <View className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </View>
        )}
      </View>

      {/* Asset Upload Modal (Admin / Management) */}
      <Modal
        visible={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Brand Collateral to Warehouse"
        subtitle="Assets will be secured in private Supabase Storage and served via signed URLs."
      >
        <View className="space-y-4">
          {/* Brand select */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Brand *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableBrands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setUploadBrandId(b.id)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    uploadBrandId === b.id
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      uploadBrandId === b.id ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Asset Title *"
            placeholder="e.g. 2026 Commercial Audio Product Spec Sheet"
            value={uploadTitle}
            onChangeText={setUploadTitle}
          />

          <Input
            label="Description / Usage Notes"
            placeholder="e.g. Official hi-res vector logos, spec manual, and CAD drawings."
            value={uploadDesc}
            onChangeText={setUploadDesc}
            multiline
          />

          {/* Category */}
          <View className="mb-3">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {categories
                .filter((c) => c.id !== 'ALL')
                .map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setUploadCategory(cat.id as AssetCategory)}
                    className={`px-2.5 py-1.5 rounded border ${
                      uploadCategory === cat.id
                        ? 'bg-slate-900 border-slate-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        uploadCategory === cat.id ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          {/* File Picker */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attachment File *
            </Text>
            <TouchableOpacity
              onPress={handlePickAssetFile}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 items-center justify-center bg-slate-50 active:bg-slate-100"
            >
              <Upload size={22} color="#64748b" className="mb-1" />
              <Text className="text-xs font-bold text-slate-700">
                {selectedFile ? selectedFile.name : 'Select PDF, Image, Video, or Spec Sheet'}
              </Text>
              {selectedFile && (
                <Text className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Ready: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View className="flex-row justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setIsUploadModalOpen(false)}
            />
            <Button
              title="Publish Asset"
              variant="primary"
              loading={uploading}
              onPress={handleUploadSubmit}
              className="bg-emerald-600 border-emerald-600 ml-2"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
