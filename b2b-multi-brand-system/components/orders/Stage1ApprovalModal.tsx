import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Modal } from '../ui/Modal';
import { Order } from '../../lib/types';
import { ordersApi } from '../../lib/api/orders';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';

interface Stage1ApprovalModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const Stage1ApprovalModal: React.FC<Stage1ApprovalModalProps> = ({
  order,
  visible,
  onClose,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  if (!order) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await ordersApi.stage1ApproveOrder(
        order.id,
        remarks.trim() || 'Stage-1 Order Review: Approved for fulfillment.'
      );
      Alert.alert('Order Approved', `Order ${order.order_number} has been approved.`);
      setRemarks('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed to approve order');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      Alert.alert('Remarks Required', 'Please enter remarks explaining why the order is rejected.');
      return;
    }

    try {
      setLoading(true);
      await ordersApi.stage1RejectOrder(order.id, remarks.trim());
      Alert.alert('Order Rejected', `Order ${order.order_number} has been rejected.`);
      setRemarks('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Rejection Error', err.message || 'Failed to reject order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Stage-1 Review: ${order.order_number}`}
      subtitle={`Brand: ${order.brand?.name || 'Assigned Brand'} | Total: $${Number(order.total_amount).toFixed(2)}`}
    >
      <View className="space-y-4">
        {/* Partner Details */}
        <View className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ordering Partner
          </Text>
          <Text className="text-sm font-bold text-slate-900">
            {order.placed_by?.company_name || order.placed_by?.full_name}
          </Text>
          <Text className="text-xs text-slate-600">
            {order.placed_by?.email} • Role: {order.user_role_at_order.toUpperCase()}
          </Text>
        </View>

        {/* Order Items Summary */}
        <View>
          <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Items Ordered ({order.order_items?.length || 0})
          </Text>
          {order.order_items?.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-2 border-b border-slate-100"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-800">
                  {item.product?.name || 'Product'}
                </Text>
                <Text className="text-[11px] text-slate-500">
                  SKU: {item.product?.sku} | Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-900">
                ${Number(item.subtotal).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes from Partner if present */}
        {order.notes && (
          <View className="bg-amber-50/60 border border-amber-200 p-3 rounded-lg">
            <Text className="text-xs font-bold text-amber-900 mb-0.5">Partner Order Notes:</Text>
            <Text className="text-xs text-amber-800">{order.notes}</Text>
          </View>
        )}

        {/* Remarks Input */}
        <View>
          <Text className="text-xs font-semibold text-slate-700 mb-1.5">
            Stage-1 Reviewer Remarks / Instructions:
          </Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="e.g. Allocation verified. Ready for warehouse dispatch."
            value={remarks}
            onChangeText={setRemarks}
            className="border border-slate-300 rounded-lg p-3 text-xs text-slate-900 bg-white"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-end space-x-3 pt-3 border-t border-slate-200">
          <TouchableOpacity
            onPress={handleReject}
            disabled={loading}
            className="flex-row items-center bg-rose-600 active:bg-rose-700 px-4 py-2.5 rounded-lg"
          >
            {loading && actionType === 'reject' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <XCircle size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white ml-1.5">Reject Order</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApprove}
            disabled={loading}
            className="flex-row items-center bg-emerald-600 active:bg-emerald-700 px-5 py-2.5 rounded-lg ml-2"
          >
            {loading && actionType === 'approve' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <CheckCircle2 size={16} color="#ffffff" />
                <Text className="text-xs font-bold text-white ml-1.5">Approve Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
