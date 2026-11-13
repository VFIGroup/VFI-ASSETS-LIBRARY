import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../lib/api/orders';
import { OrderStatusBadge } from '../../../components/orders/OrderStatusBadge';
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2 } from 'lucide-react-native';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      if (!id) return null;
      return await ordersApi.fetchOrderById(id);
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

  if (!order) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <Text className="text-white text-base font-bold">Order not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-400 text-sm font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-4xl w-full mx-auto">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-5"
        >
          <ArrowLeft size={16} color="#94a3b8" />
          <Text className="text-xs text-slate-400 font-semibold ml-1.5">
            Back to Orders
          </Text>
        </TouchableOpacity>

        {/* Order Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <View className="flex-row items-center justify-between pb-4 mb-4 border-b border-slate-800 flex-wrap gap-3">
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Reference
              </Text>
              <Text className="text-2xl font-black text-white font-mono">
                {order.order_number}
              </Text>
            </View>
            <OrderStatusBadge status={order.status} />
          </View>

          {/* Details Grid */}
          <View className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <View className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ordering Partner
              </Text>
              <Text className="text-sm font-bold text-white">
                {order.placed_by?.company_name || order.placed_by?.full_name}
              </Text>
              <Text className="text-xs text-slate-400">
                {order.placed_by?.email} • {order.placed_by?.phone || 'No phone'}
              </Text>
              <Text className="text-[11px] text-emerald-400 font-bold uppercase mt-1">
                Role: {order.user_role_at_order}
              </Text>
            </View>

            <View className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Brand Division
              </Text>
              <Text className="text-sm font-bold text-white">
                {order.brand?.name}
              </Text>
              <Text className="text-xs text-slate-400 font-mono">
                Code: {order.brand?.code}
              </Text>
              {order.tracking_number && (
                <Text className="text-xs text-purple-400 font-bold mt-1">
                  Airway Bill / Tracking: {order.tracking_number}
                </Text>
              )}
            </View>
          </View>

          {/* Items Table */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Line Items ({order.order_items?.length || 0})
            </Text>
            <View className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              {order.order_items?.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between p-4 border-b border-slate-850"
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-sm font-bold text-white">
                      {item.product?.name || 'Product SKU'}
                    </Text>
                    <Text className="text-xs text-slate-400 font-mono">
                      SKU: {item.product?.sku}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-slate-400">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    </Text>
                    <Text className="text-sm font-bold text-emerald-400">
                      ${Number(item.subtotal).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Total */}
          <View className="flex-row justify-between items-center pt-4 border-t border-slate-800">
            <Text className="text-base font-bold text-white">Total Order Value:</Text>
            <Text className="text-2xl font-black text-emerald-400">
              ${Number(order.total_amount).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
