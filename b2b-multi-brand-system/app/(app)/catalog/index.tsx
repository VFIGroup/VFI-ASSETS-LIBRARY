import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth-context';
import { useBrandStore } from '../../../lib/store/useBrandStore';
import { useCartStore } from '../../../lib/store/useCartStore';
import { productsApi } from '../../../lib/api/products';
import { Product } from '../../../lib/types';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  ShoppingBag,
  Search,
  Plus,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Tag,
  Package,
} from 'lucide-react-native';

export default function CatalogScreen() {
  const { profile } = useAuth();
  const { selectedBrandId, availableBrands } = useBrandStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const role = profile?.role;
  const isSuperAdminOrManagement = role === 'super_admin' || role === 'management';
  const canOrder = role === 'dealer' || role === 'distributor' || role === 'super_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New product modal state (Admin / Management)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrandId, setNewBrandId] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newMinPrice, setNewMinPrice] = useState('');
  const [newMaxPrice, setNewMaxPrice] = useState('');
  const [newDealerPrice, setNewDealerPrice] = useState('');
  const [newDistributorPrice, setNewDistributorPrice] = useState('');
  const [newStock, setNewStock] = useState('100');
  const [newMinOrderQty, setNewMinOrderQty] = useState('1');
  const [savingProduct, setSavingProduct] = useState(false);

  // Fetch products
  const {
    data: products = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['catalog-products', selectedBrandId, selectedCategory, searchQuery],
    queryFn: async () => {
      return await productsApi.fetchProducts(
        selectedBrandId,
        selectedCategory,
        searchQuery
      );
    },
  });

  const handleAddToCart = (product: Product) => {
    if (!canOrder) {
      Alert.alert('Ordering Restricted', 'Your account role has catalog view privileges only.');
      return;
    }

    const result = addItemToCart(product, role || 'dealer', product.min_order_qty || 1);
    if (!result.success) {
      Alert.alert('Cart Notification', result.message || 'Could not add to cart.');
    } else {
      Alert.alert('Added to Cart', `${product.name} (Qty: ${product.min_order_qty || 1}) added.`);
    }
  };

  const handleSaveProduct = async () => {
    if (!newBrandId || !newSku.trim() || !newName.trim() || !newDealerPrice || !newDistributorPrice) {
      Alert.alert('Required Fields', 'Please fill in SKU, Name, Brand, Dealer Price, and Distributor Price.');
      return;
    }

    try {
      setSavingProduct(true);
      await productsApi.createProduct({
        brand_id: newBrandId,
        sku: newSku.trim().toUpperCase(),
        name: newName.trim(),
        description: newDesc.trim(),
        category: newCategory.trim(),
        dealer_price: Number(newDealerPrice),
        distributor_price: Number(newDistributorPrice),
        min_price: Number(newMinPrice || newDistributorPrice),
        max_price: Number(newMaxPrice || newDealerPrice),
        stock_qty: Number(newStock || 0),
        min_order_qty: Number(newMinOrderQty || 1),
        status: 'active',
      });

      setIsAddModalOpen(false);
      refetch();
      Alert.alert('Product Published', 'Product has been added to the brand catalog.');
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 flex-wrap gap-4">
          <View>
            <View className="flex-row items-center">
              <ShoppingBag size={24} color="#10b981" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                Brand Product Catalog & Tiered Pricing
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              {role === 'distributor'
                ? 'Displaying Tier: DISTRIBUTOR WHOLESALE PRICING'
                : role === 'dealer'
                ? 'Displaying Tier: DEALER PARTNER PRICING'
                : 'Role-Based Tiered B2B Inventory Management'}
            </Text>
          </View>

          {isSuperAdminOrManagement && (
            <Button
              title="Add New Product"
              onPress={() => {
                setNewBrandId(
                  selectedBrandId !== 'ALL' ? selectedBrandId : availableBrands[0]?.id || ''
                );
                setIsAddModalOpen(true);
              }}
              variant="primary"
              icon={<Plus size={16} color="#ffffff" />}
              className="bg-emerald-600 border-emerald-600"
            />
          )}
        </View>

        {/* Search & Category Filter */}
        <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
            <Search size={16} color="#94a3b8" />
            <TextInput
              placeholder="Search catalog by SKU, product name, or specifications..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-sm text-white ml-2 py-0"
            />
          </View>
        </View>

        {/* Product Cards Grid */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-xs text-slate-400 mt-3">Loading product inventory...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-xl p-12 items-center text-center">
            <Package size={42} color="#64748b" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">
              No Products Found
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm text-center">
              No products found matching the brand scope and filters.
            </Text>
          </View>
        ) : (
          <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => {
              // Calculate role-specific pricing
              const displayedPrice =
                role === 'distributor'
                  ? product.distributor_price
                  : product.dealer_price;

              return (
                <View
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm justify-between hover:border-slate-700"
                >
                  <View>
                    {/* Brand & SKU Header */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="bg-slate-800 px-2 py-0.5 rounded">
                        <Text className="text-[11px] font-bold text-emerald-400">
                          {product.brand?.name || 'Brand Product'}
                        </Text>
                      </View>
                      <Text className="text-xs font-mono font-bold text-slate-400">
                        {product.sku}
                      </Text>
                    </View>

                    {/* Product Name & Description */}
                    <Text className="text-base font-extrabold text-white mb-1.5">
                      {product.name}
                    </Text>
                    <Text className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {product.description || 'Commercial grade B2B enterprise specification.'}
                    </Text>

                    {/* Pricing Tiers Box */}
                    <View className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 mb-4">
                      {isSuperAdminOrManagement ? (
                        <View className="space-y-1">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-400">Distributor Rate:</Text>
                            <Text className="text-xs font-bold text-emerald-400">
                              ${Number(product.distributor_price).toFixed(2)}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-slate-400">Dealer Rate:</Text>
                            <Text className="text-xs font-bold text-blue-400">
                              ${Number(product.dealer_price).toFixed(2)}
                            </Text>
                          </View>
                          <View className="flex-row justify-between pt-1 border-t border-slate-850">
                            <Text className="text-[11px] text-slate-500">MSRP Range:</Text>
                            <Text className="text-[11px] text-slate-400">
                              ${Number(product.min_price).toFixed(2)} - ${Number(product.max_price).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View>
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            {role === 'distributor' ? 'Your Distributor Rate' : 'Your Dealer Rate'}
                          </Text>
                          <View className="flex-row items-baseline justify-between">
                            <Text className="text-2xl font-black text-emerald-400">
                              ${Number(displayedPrice).toFixed(2)}
                            </Text>
                            <Text className="text-xs text-slate-400">
                              Min Order: {product.min_order_qty} units
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Stock Status */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <View
                          className={`w-2 h-2 rounded-full mr-1.5 ${
                            product.stock_qty > 20
                              ? 'bg-emerald-500'
                              : product.stock_qty > 0
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <Text className="text-xs text-slate-300 font-medium">
                          {product.stock_qty > 0
                            ? `${product.stock_qty} in warehouse`
                            : 'Out of Stock / Backorder'}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-slate-400">{product.category}</Text>
                    </View>
                  </View>

                  {/* Add to Cart (Dealers & Distributors only) */}
                  {canOrder ? (
                    <TouchableOpacity
                      onPress={() => handleAddToCart(product)}
                      className="bg-emerald-600 active:bg-emerald-700 flex-row items-center justify-center py-2.5 rounded-lg"
                    >
                      <ShoppingCart size={15} color="#ffffff" />
                      <Text className="text-xs font-bold text-white ml-2">
                        Add to B2B Cart
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="bg-slate-800 py-2 rounded-lg items-center">
                      <Text className="text-xs font-semibold text-slate-400">
                        View Only Access
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Add Product Modal (Admin & Management) */}
      <Modal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Catalog Product & Set Pricing Tiers"
      >
        <View className="space-y-3">
          <View className="mb-2">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Brand *
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {availableBrands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setNewBrandId(b.id)}
                  className={`px-3 py-1 rounded border ${
                    newBrandId === b.id
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      newBrandId === b.id ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="SKU Identifier *" placeholder="e.g. AURA-SPK-900" value={newSku} onChangeText={setNewSku} />
          <Input label="Product Name *" placeholder="e.g. 12-inch Subwoofer" value={newName} onChangeText={setNewName} />
          <Input label="Category *" placeholder="e.g. Amplifiers" value={newCategory} onChangeText={setNewCategory} />
          <Input label="Description" placeholder="Product technical summary" value={newDesc} onChangeText={setNewDesc} multiline />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Distributor Rate ($) *" placeholder="140.00" value={newDistributorPrice} onChangeText={setNewDistributorPrice} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Input label="Dealer Rate ($) *" placeholder="185.00" value={newDealerPrice} onChangeText={setNewDealerPrice} keyboardType="numeric" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Stock Units" placeholder="100" value={newStock} onChangeText={setNewStock} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <Input label="Min Order Qty" placeholder="1" value={newMinOrderQty} onChangeText={setNewMinOrderQty} keyboardType="numeric" />
            </View>
          </View>

          <View className="flex-row justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button title="Cancel" variant="outline" onPress={() => setIsAddModalOpen(false)} />
            <Button title="Publish Product" variant="primary" loading={savingProduct} onPress={handleSaveProduct} className="bg-emerald-600 border-emerald-600 ml-2" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
