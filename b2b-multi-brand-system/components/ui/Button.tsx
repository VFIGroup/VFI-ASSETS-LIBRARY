import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const baseStyle = 'flex-row items-center justify-center rounded-lg font-semibold';

  const sizeStyles = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const variantStyles = {
    primary: 'bg-slate-900 border border-slate-900 active:bg-slate-800',
    secondary: 'bg-slate-100 border border-slate-200 active:bg-slate-200',
    outline: 'bg-transparent border border-slate-300 active:bg-slate-50',
    danger: 'bg-rose-600 border border-rose-600 active:bg-rose-700',
    success: 'bg-emerald-600 border border-emerald-600 active:bg-emerald-700',
  };

  const textStyles = {
    primary: 'text-white font-medium',
    secondary: 'text-slate-800 font-medium',
    outline: 'text-slate-700 font-medium',
    danger: 'text-white font-medium',
    success: 'text-white font-medium',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'outline' ? '#0f172a' : '#ffffff'}
        />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`${textSizes[size]} ${textStyles[variant]}`}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
