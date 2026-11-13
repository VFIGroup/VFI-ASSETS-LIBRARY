import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../../lib/api/products';
import { useAuth } from '../../../lib/auth-context';
import { useCartStore } from '../../../lib/store/useCartStore';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, ShoppingCart, Tag, Package, Check } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const addItemToCart = useCartStore((state) => state.addItem);

  const role = profile?.role;
  const canOrder = role === 'dealer' || role === 'distributor' || role === 'super_admin';

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) return null;
      return await productsApi.fetchProductById(id);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-white text-base font-bold">Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-400 text-sm font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayedPrice =
    role === 'distributor' ? product.distributor_price : product.dealer_price;

  const handleAddToCart = () => {
    if (!canOrder) {
      Alert.alert('Ordering Restricted', 'Your account role has catalog view privileges only.');
      return;
    }
    const res = addItemToCart(product, role || 'dealer', product.min_order_qty || 1);
    if (res.success) {
      Alert.alert('Added to Cart', `${product.name} added to cart.`);
    } else {
      Alert.alert('Cart Notification', res.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-4xl w-full mx-auto">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-5"
        >
          <ArrowLeft size={16} color="#94a3b8" />
          <Text className="text-xs text-slate-400 font-semibold ml-1.5">
            Back to Catalog
          </Text>
        </TouchableOpacity>

        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded">
              <Text className="text-xs font-bold text-emerald-400">
                {product.brand?.name}
              </Text>
            </View>
            <Text className="text-xs font-mono font-bold text-slate-400">
              SKU: {product.sku}
            </Text>
          </View>

          <Text className="text-2xl font-black text-white mb-2">
            {product.name}
          </Text>
          <Text className="text-sm text-slate-300 mb-6 leading-relaxed">
            {product.description || 'Full enterprise technical specifications.'}
          </Text>

          {/* Pricing Box */}
          <View className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              {role === 'distributor' ? 'Your Distributor Wholesale Rate' : 'Your Dealer Partner Rate'}
            </Text>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-3xl font-black text-emerald-400">
                ${Number(displayedPrice).toFixed(2)}
              </Text>
              <Text className="text-xs text-slate-400">
                Minimum Batch Order: {product.min_order_qty} units
              </Text>
            </View>
          </View>

          {canOrder && (
            <Button
              title="Add Product to Order Cart"
              onPress={handleAddToCart}
              variant="primary"
              size="lg"
              icon={<ShoppingCart size={18} color="#ffffff" />}
              className="bg-emerald-600 border-emerald-600"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
