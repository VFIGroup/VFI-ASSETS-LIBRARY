import { supabase } from '../supabase';
import { Product } from '../types';

export const productsApi = {
  fetchProducts: async (brandId?: string, category?: string, searchQuery?: string) => {
    let query = supabase
      .from('products')
      .select('*, brand:brands(id, name, code, logo_url)')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (brandId && brandId !== 'ALL') {
      query = query.eq('brand_id', brandId);
    }

    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Product[];
  },

  fetchProductById: async (productId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, brand:brands(id, name, code, logo_url)')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data as unknown as Product;
  },

  createProduct: async (productData: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        brand_id: productData.brand_id!,
        sku: productData.sku!,
        name: productData.name!,
        description: productData.description || null,
        category: productData.category || 'General',
        image_url: productData.image_url || null,
        min_price: productData.min_price || 0,
        max_price: productData.max_price || 0,
        dealer_price: productData.dealer_price || 0,
        distributor_price: productData.distributor_price || 0,
        stock_qty: productData.stock_qty || 0,
        min_order_qty: productData.min_order_qty || 1,
        status: productData.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Product;
  },

  updateProduct: async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Product;
  },
};
