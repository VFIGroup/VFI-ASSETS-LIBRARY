import React from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  rightAction,
  className = '',
}) => {
  return (
    <View className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm ${className}`}>
      {(title || rightAction) && (
        <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <View className="flex-1 mr-2">
            {title && <Text className="text-base font-bold text-slate-900">{title}</Text>}
            {subtitle && <Text className="text-xs text-slate-500 mt-0.5">{subtitle}</Text>}
          </View>
          {rightAction && <View>{rightAction}</View>}
        </View>
      )}
      {children}
    </View>
  );
};
