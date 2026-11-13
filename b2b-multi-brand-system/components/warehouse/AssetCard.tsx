import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { BrandAsset } from '../../lib/types';
import { warehouseApi } from '../../lib/api/warehouse';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  ExternalLink,
  Shield,
  FileBox,
} from 'lucide-react-native';

interface AssetCardProps {
  asset: BrandAsset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const [downloading, setDownloading] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'high_res_image':
        return <ImageIcon size={22} color="#3b82f6" />;
      case 'video':
        return <Video size={22} color="#8b5cf6" />;
      case 'product_catalog_pdf':
      case 'spec_sheet':
      case 'brochure':
        return <FileText size={22} color="#10b981" />;
      default:
        return <FileBox size={22} color="#f59e0b" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const signedUrl = await warehouseApi.getSignedAssetUrl(asset.file_path, 3600);
      if (Platform.OS === 'web') {
        window.open(signedUrl, '_blank');
      } else {
        await Linking.openURL(signedUrl);
      }
    } catch (err: any) {
      alert(`Failed to retrieve file download link: ${err.message || err}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 justify-between">
      <View>
        {/* Top: Category Icon & Brand Tag */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-10 h-10 rounded-lg bg-slate-50 items-center justify-center border border-slate-100">
            {getCategoryIcon(asset.category)}
          </View>
          <View className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            <Text className="text-[11px] font-bold text-slate-700">
              {asset.brand?.name || 'Brand Asset'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text className="text-sm font-bold text-slate-900 mb-1 leading-tight">
          {asset.title}
        </Text>
        {asset.description && (
          <Text className="text-xs text-slate-500 mb-2.5 line-clamp-2">
            {asset.description}
          </Text>
        )}

        {/* Meta tags: file type, size, role access */}
        <View className="flex-row flex-wrap items-center gap-1.5 mb-3">
          <View className="bg-slate-100 px-1.5 py-0.5 rounded">
            <Text className="text-[10px] font-semibold text-slate-600 uppercase">
              {asset.file_type.split('/')[1] || 'FILE'}
            </Text>
          </View>
          <View className="bg-slate-100 px-1.5 py-0.5 rounded">
            <Text className="text-[10px] text-slate-600">
              {formatFileSize(asset.file_size_bytes)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button: Signed URL Retrieval */}
      <TouchableOpacity
        onPress={handleDownload}
        disabled={downloading}
        className="flex-row items-center justify-center bg-slate-900 active:bg-slate-800 py-2 px-3 rounded-lg mt-2"
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Download size={14} color="#ffffff" />
            <Text className="text-xs font-semibold text-white ml-1.5">
              Secure Download
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
