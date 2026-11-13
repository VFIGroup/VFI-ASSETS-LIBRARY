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
import { Order } from '../../../lib/types';
import { Stage1ApprovalModal } from '../../../components/orders/Stage1ApprovalModal';
import { Button } from '../../../components/ui/Button';
import { FileCheck2, AlertCircle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react-native';

export default function OrderApprovalScreen() {
  const { profile } = useAuth();
  const { selectedBrandId } = useBrandStore();
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  const isManagementOrAdmin =
    profile?.role === 'super_admin' || profile?.role === 'management';

  const {
    data: pendingOrders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['stage1-pending-orders', selectedBrandId],
    queryFn: async () => {
      return await ordersApi.fetchOrders({
        brandId: selectedBrandId,
        status: 'pending_approval',
      });
    },
    enabled: isManagementOrAdmin,
  });

  if (!isManagementOrAdmin) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6 text-center">
        <AlertCircle size={48} color="#f43f5e" className="mb-3" />
        <Text className="text-xl font-bold text-white mb-2">Access Denied</Text>
        <Text className="text-xs text-slate-400 max-w-sm text-center">
          Stage-1 Order Review is restricted to Management Approvers and Super Administrators.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <View className="flex-row items-center">
              <FileCheck2 size={24} color="#f59e0b" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                Stage-1 Order Approval Console
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              Verify partner credit, order volume allocations, and authorize fulfillment pipeline
            </Text>
          </View>
        </View>

        {/* List of Pending Stage-1 Orders */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-xs text-slate-400 mt-3">Loading pending orders...</Text>
          </View>
        ) : pendingOrders.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-xl p-12 items-center text-center">
            <CheckCircle2 size={48} color="#10b981" className="mb-3" />
            <Text className="text-lg font-bold text-white mb-1">
              All Orders Reviewed!
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm text-center">
              No orders are currently awaiting Stage-1 approval for your brand scope.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {pendingOrders.map((order) => (
              <View
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex-row items-center justify-between flex-wrap gap-4"
              >
                <View className="flex-1 min-w-[240px]">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Text className="text-base font-black text-white font-mono">
                      {order.order_number}
                    </Text>
                    <View className="bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-amber-400">
                        STAGE-1 REVIEW PENDING
                      </Text>
                    </View>
                    <View className="bg-slate-800 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-emerald-400">
                        {order.brand?.name}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm font-bold text-slate-200">
                    {order.placed_by?.company_name || order.placed_by?.full_name}
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {order.placed_by?.email} • Tier: <Text className="text-emerald-400 font-semibold">{order.user_role_at_order.toUpperCase()}</Text>
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Items: {order.order_items?.length || 0} line items • Placed on {new Date(order.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Amount & Review Action Button */}
                <View className="flex-row items-center gap-5">
                  <View className="items-end">
                    <Text className="text-xs text-slate-400 font-medium">Order Value</Text>
                    <Text className="text-xl font-black text-emerald-400">
                      ${Number(order.total_amount).toFixed(2)}
                    </Text>
                  </View>

                  <Button
                    title="Review & Decide"
                    onPress={() => setSelectedOrderForReview(order)}
                    variant="primary"
                    className="bg-amber-500 border-amber-500 active:bg-amber-600"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Stage-1 Approval Modal */}
      <Stage1ApprovalModal
        order={selectedOrderForReview}
        visible={!!selectedOrderForReview}
        onClose={() => setSelectedOrderForReview(null)}
        onSuccess={() => refetch()}
      />
    </ScrollView>
  );
}
