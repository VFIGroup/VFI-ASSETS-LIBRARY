import React from 'react';
import { View, Text } from 'react-native';
import { OrderStatus } from '../../lib/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<
    OrderStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    pending_approval: {
      label: 'Stage 1: Pending Approval',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    stage1_approved: {
      label: 'Stage 1 Approved',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
    },
    confirmed: {
      label: 'Confirmed / Invoiced',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
    },
    dispatched: {
      label: 'Dispatched / In Transit',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-300',
    },
    delivered: {
      label: 'Delivered',
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-400',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  };

  return (
    <View
      className={`border px-2.5 py-1 rounded-full self-start flex-row items-center ${config.bg} ${config.border}`}
    >
      <View
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'pending_approval'
            ? 'bg-amber-500'
            : status === 'stage1_approved'
            ? 'bg-blue-500'
            : status === 'rejected'
            ? 'bg-rose-500'
            : status === 'confirmed' || status === 'delivered'
            ? 'bg-emerald-500'
            : 'bg-purple-500'
        }`}
      />
      <Text className={`text-xs font-bold ${config.text}`}>{config.label}</Text>
    </View>
  );
};
