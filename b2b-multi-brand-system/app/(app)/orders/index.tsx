import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth-context';
import { useBrandStore } from '../../../lib/store/useBrandStore';
import { ordersApi } from '../../../lib/api/orders';
import { Order, OrderStatus } from '../../../lib/types';
import { OrderStatusBadge } from '../../../components/orders/OrderStatusBadge';
import { Button } from '../../../components/ui/Button';
import { Clock, Filter, Eye, Truck, CheckCircle, Package } from 'lucide-react-native';
import { Modal } from '../../../components/ui/Modal';

export default function OrdersListScreen() {
  const { profile } = useAuth();
  const { selectedBrandId } = useBrandStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders-list', selectedBrandId, statusFilter],
    queryFn: async () => {
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      return await ordersApi.fetchOrders({ brandId: selectedBrandId, status });
    },
  });

  const statuses: { id: OrderStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'pending_approval', label: 'Stage-1 Pending' },
    { id: 'stage1_approved', label: 'Stage-1 Approved' },
    { id: 'confirmed', label: 'Confirmed / Invoiced' },
    { id: 'dispatched', label: 'Dispatched' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <View className="flex-row items-center">
              <Clock size={24} color="#10b981" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                B2B Orders & Fulfillment Tracking
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              Multi-brand order pipeline, approval timestamps, and carrier tracking
            </Text>
          </View>
        </View>

        {/* Status Filter Pills */}
        <View className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {statuses.map((s) => {
              const isSelected = statusFilter === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setStatusFilter(s.id)}
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
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Orders Table / Cards */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-xs text-slate-400 mt-3">Loading order history...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-xl p-12 items-center text-center">
            <Package size={42} color="#64748b" className="mb-3" />
            <Text className="text-base font-bold text-white mb-1">
              No Orders Found
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm text-center">
              No orders match the selected brand or workflow status criteria.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                activeOpacity={0.8}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 flex-row items-center justify-between flex-wrap gap-4"
              >
                <View className="flex-1 min-w-[200px]">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Text className="text-sm font-black text-white font-mono">
                      {order.order_number}
                    </Text>
                    <View className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      <Text className="text-[10px] font-bold text-emerald-400">
                        {order.brand?.name}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400">
                    Ordered by: <Text className="text-slate-200 font-semibold">{order.placed_by?.company_name || order.placed_by?.full_name}</Text> ({order.user_role_at_order.toUpperCase()})
                  </Text>
                  <Text className="text-[11px] text-slate-500 mt-0.5">
                    Placed: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Status Badge */}
                <View className="items-start sm:items-center">
                  <OrderStatusBadge status={order.status} />
                  {order.tracking_number && (
                    <Text className="text-[11px] font-mono text-purple-400 mt-1">
                      Tracking: {order.tracking_number}
                    </Text>
                  )}
                </View>

                {/* Total & Action */}
                <View className="flex-row items-center gap-4">
                  <View className="items-end">
                    <Text className="text-[11px] text-slate-400">Order Value</Text>
                    <Text className="text-base font-extrabold text-white">
                      ${Number(order.total_amount).toFixed(2)}
                    </Text>
                  </View>

                  <View className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                    <Eye size={16} color="#94a3b8" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          visible={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.order_number}`}
          subtitle={`Brand: ${selectedOrder.brand?.name} • Placed by ${selectedOrder.placed_by?.company_name || selectedOrder.placed_by?.full_name}`}
        >
          <View className="space-y-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-xs font-bold text-slate-600">Current Status:</Text>
              <OrderStatusBadge status={selectedOrder.status} />
            </View>

            {/* Approval remarks if present */}
            {selectedOrder.stage1_remarks && (
              <View className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <Text className="text-xs font-bold text-slate-700">
                  Stage-1 Reviewer Remarks:
                </Text>
                <Text className="text-xs text-slate-600 mt-0.5">
                  {selectedOrder.stage1_remarks}
                </Text>
                {selectedOrder.approved_at && (
                  <Text className="text-[10px] text-slate-400 mt-1">
                    Reviewed: {new Date(selectedOrder.approved_at).toLocaleString()}
                  </Text>
                )}
              </View>
            )}

            {/* Items */}
            <View>
              <Text className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Order Items
              </Text>
              {selectedOrder.order_items?.map((item) => (
                <View
                  key={item.id}
                  className="flex-row justify-between py-2 border-b border-slate-100"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-slate-900">
                      {item.product?.name || 'Product'}
                    </Text>
                    <Text className="text-[11px] text-slate-500">
                      SKU: {item.product?.sku} • {item.quantity} units × ${Number(item.unit_price).toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-900">
                    ${Number(item.subtotal).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Shipping Address */}
            <View className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Text className="text-xs font-bold text-slate-700 mb-1">
                Dispatch Destination:
              </Text>
              <Text className="text-xs text-slate-600">
                {selectedOrder.shipping_address?.street || 'Warehouse St.'}, {selectedOrder.shipping_address?.city || 'City'}, {selectedOrder.shipping_address?.state || 'State'} {selectedOrder.shipping_address?.zip || ''}
              </Text>
            </View>

            {/* Total */}
            <View className="flex-row justify-between items-center pt-2 border-t border-slate-200">
              <Text className="text-sm font-bold text-slate-900">Total B2B Invoice:</Text>
              <Text className="text-lg font-black text-emerald-600">
                ${Number(selectedOrder.total_amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
