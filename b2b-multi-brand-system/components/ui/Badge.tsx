import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'slate' | 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantMap = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeMap = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <View
      className={`border rounded-full self-start flex-row items-center ${
        variantMap[variant]
      } ${sizeMap[size]} ${className}`}
    >
      <Text className={`font-semibold capitalize ${variantMap[variant].split(' ')[1]}`}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};
