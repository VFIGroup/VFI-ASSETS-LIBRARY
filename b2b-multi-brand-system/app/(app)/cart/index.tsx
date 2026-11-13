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
import { router } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { useCartStore } from '../../../lib/store/useCartStore';
import { useBrandStore } from '../../../lib/store/useBrandStore';
import { ordersApi } from '../../../lib/api/orders';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';

export default function CartScreen() {
  const { profile } = useAuth();
  const {
    items,
    activeBrandId,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalAmount,
    getTotalItemCount,
  } = useCartStore();
  const { availableBrands } = useBrandStore();

  const [shippingStreet, setShippingStreet] = useState('100 Industrial Parkway');
  const [shippingCity, setShippingCity] = useState('Chicago');
  const [shippingState, setShippingState] = useState('IL');
  const [shippingZip, setShippingZip] = useState('60601');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  const brand = availableBrands.find((b) => b.id === activeBrandId);
  const totalAmount = getTotalAmount();
  const totalItems = getTotalItemCount();

  const handleCheckout = async () => {
    if (items.length === 0 || !activeBrandId) {
      Alert.alert('Empty Cart', 'Your cart has no products to submit.');
      return;
    }

    if (!shippingStreet.trim() || !shippingCity.trim() || !shippingZip.trim()) {
      Alert.alert('Shipping Address Required', 'Please provide a valid delivery destination.');
      return;
    }

    try {
      setSubmitting(true);

      const order = await ordersApi.createOrder({
        brandId: activeBrandId,
        items,
        notes: orderNotes.trim(),
        shippingAddress: {
          street: shippingStreet.trim(),
          city: shippingCity.trim(),
          state: shippingState.trim(),
          zip: shippingZip.trim(),
          recipient: profile?.company_name || profile?.full_name,
        },
        userRole: profile?.role || 'dealer',
      });

      clearCart();
      setOrderSuccess(order);
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="bg-slate-950 p-6">
        <View className="max-w-lg w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 items-center text-center">
          <View className="w-16 h-16 bg-emerald-950 border border-emerald-700 rounded-full items-center justify-center mb-4">
            <CheckCircle2 size={36} color="#10b981" />
          </View>
          <Text className="text-2xl font-black text-white mb-1">
            Order Submitted for Stage-1 Review!
          </Text>
          <Text className="text-xs font-mono font-bold text-emerald-400 mb-3">
            Reference: {orderSuccess.order_number}
          </Text>
          <Text className="text-xs text-slate-400 leading-relaxed mb-6">
            Your B2B order has been queued in <Text className="text-white font-bold">Stage 1: Pending Approval</Text>.
            Our Brand Management & Accounting team will review pricing, tax compliance, and stock allocation. You will receive real-time email updates via Gmail SMTP as it moves through fulfillment.
          </Text>

          <View className="flex-row gap-3 w-full">
            <Button
              title="Track This Order"
              onPress={() => router.replace('/(app)/orders')}
              variant="secondary"
              className="flex-1"
            />
            <Button
              title="Back to Catalog"
              onPress={() => router.replace('/(app)/catalog')}
              variant="primary"
              className="flex-1 bg-emerald-600 border-emerald-600"
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-6xl w-full mx-auto">
        <View className="flex-row items-center mb-6">
          <ShoppingCart size={24} color="#10b981" />
          <Text className="text-2xl font-black text-white ml-2">
            B2B Order Cart & Stage-1 Submission
          </Text>
        </View>

        {items.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-12 items-center text-center">
            <ShoppingCart size={48} color="#64748b" className="mb-3" />
            <Text className="text-lg font-bold text-white mb-1">
              Your B2B Cart is Empty
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm mb-6">
              Browse brand catalogs to add items with your negotiated dealer or distributor tier pricing.
            </Text>
            <Button
              title="Browse Product Catalog"
              onPress={() => router.push('/(app)/catalog')}
              variant="primary"
              className="bg-emerald-600 border-emerald-600"
            />
          </View>
        ) : (
          <View className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Cart Items list */}
            <View className="lg:col-span-2 space-y-4">
              <View className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order Brand Scope
                  </Text>
                  <Text className="text-base font-extrabold text-white">
                    {brand?.name || 'Authorized Brand'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearCart}
                  className="flex-row items-center bg-rose-950 border border-rose-800 px-3 py-1.5 rounded-lg"
                >
                  <Trash2 size={13} color="#f43f5e" />
                  <Text className="text-xs font-bold text-rose-300 ml-1.5">Clear Cart</Text>
                </TouchableOpacity>
              </View>

              {items.map((item) => (
                <View
                  key={item.product.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-xs font-mono font-bold text-emerald-400">
                      {item.product.sku}
                    </Text>
                    <Text className="text-sm font-bold text-white mb-1">
                      {item.product.name}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Unit Tier Rate: ${Number(item.unitPrice).toFixed(2)}
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-lg p-1 mr-4">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded bg-slate-800"
                    >
                      <Minus size={14} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-xs font-bold text-white px-3">
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded bg-slate-800"
                    >
                      <Plus size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  {/* Subtotal */}
                  <View className="items-end min-w-[80px]">
                    <Text className="text-sm font-black text-white">
                      ${Number(item.subtotal).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item.product.id)}
                      className="mt-1"
                    >
                      <Text className="text-[10px] text-rose-400">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Right: Checkout & Address Details */}
            <View className="space-y-4">
              <View className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <Text className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Destination & Dispatch Notes
                </Text>

                <Input
                  label="Delivery Street Address *"
                  value={shippingStreet}
                  onChangeText={setShippingStreet}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input label="City *" value={shippingCity} onChangeText={setShippingCity} />
                  </View>
                  <View className="w-20">
                    <Input label="State" value={shippingState} onChangeText={setShippingState} />
                  </View>
                  <View className="w-24">
                    <Input label="Zip *" value={shippingZip} onChangeText={setShippingZip} />
                  </View>
                </View>

                <Input
                  label="Special Dispatch Instructions / PO Number"
                  placeholder="e.g. PO-88921. Gate delivery only."
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                />

                {/* Summary calculation */}
                <View className="pt-4 border-t border-slate-800 space-y-2 mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-400">Total Units:</Text>
                    <Text className="text-xs font-bold text-white">{totalItems}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-400">Subtotal:</Text>
                    <Text className="text-xs font-bold text-white">${totalAmount.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between pt-2 border-t border-slate-800">
                    <Text className="text-sm font-bold text-white">Estimated Order Total:</Text>
                    <Text className="text-lg font-black text-emerald-400">
                      ${totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <Button
                  title="Submit Order for Stage-1 Approval"
                  onPress={handleCheckout}
                  loading={submitting}
                  variant="primary"
                  size="lg"
                  className="bg-emerald-600 border-emerald-600 w-full"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
