import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center border rounded-lg bg-white px-3 py-2.5 ${
          error ? 'border-rose-500' : 'border-slate-300 focus:border-slate-800'
        }`}
      >
        {leftIcon && <View className="mr-2 text-slate-400">{leftIcon}</View>}

        <TextInput
          placeholderTextColor="#94a3b8"
          className={`flex-1 text-slate-900 text-sm py-0 ${className}`}
          {...props}
        />

        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>

      {error ? (
        <Text className="text-xs text-rose-500 mt-1 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-slate-500 mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
};
