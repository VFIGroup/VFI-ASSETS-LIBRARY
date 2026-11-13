import { supabase } from '../supabase';
import { AssetCategory, BrandAsset, UserRole } from '../types';

export const warehouseApi = {
  // Fetch brand assets according to user permissions & brand isolation
  fetchBrandAssets: async (brandId?: string, category?: AssetCategory) => {
    let query = supabase
      .from('brand_assets')
      .select('*, brand:brands(id, name, code, logo_url)')
      .order('created_at', { ascending: false });

    if (brandId && brandId !== 'ALL') {
      query = query.eq('brand_id', brandId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as BrandAsset[];
  },

  // Generate a secure signed URL from private 'brand-assets' storage bucket
  getSignedAssetUrl: async (filePath: string, expiresIn = 3600): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('[WarehouseApi] Failed to create signed URL:', error);
      throw error;
    }
    return data.signedUrl;
  },

  // Upload an asset file and create database record
  uploadBrandAsset: async (
    brandId: string,
    file: { uri: string; name: string; type: string; size?: number; base64?: string; blob?: Blob },
    metadata: {
      title: string;
      description?: string;
      category: AssetCategory;
      allowedRoles?: UserRole[];
    }
  ) => {
    const fileExt = file.name.split('.').pop() || 'bin';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${brandId}/${Date.now()}_${cleanFileName}`;

    let uploadBody: any;
    if (file.blob) {
      uploadBody = file.blob;
    } else {
      // In web/react-native, handle fetch blob
      const res = await fetch(file.uri);
      uploadBody = await res.blob();
    }

    // Upload to private Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(storagePath, uploadBody, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Insert metadata record into public.brand_assets
    const { data: userAuth } = await supabase.auth.getUser();

    const { data: assetRecord, error: dbError } = await supabase
      .from('brand_assets')
      .insert({
        brand_id: brandId,
        title: metadata.title,
        description: metadata.description || null,
        category: metadata.category,
        file_path: storagePath,
        file_url: null, // Private; accessed via signed URLs
        file_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size || null,
        allowed_roles: (metadata.allowedRoles || [
          'super_admin',
          'management',
          'distributor',
          'dealer',
          'salesperson',
          'employee',
        ]) as any,
        created_by: userAuth.user?.id || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return assetRecord;
  },
};
