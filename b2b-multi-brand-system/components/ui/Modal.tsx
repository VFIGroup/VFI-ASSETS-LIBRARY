import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-slate-950/60 justify-center items-center p-4">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90%] shadow-2xl overflow-hidden`}
              style={Platform.OS === 'web' ? { maxHeight: '85vh' } : {}}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-bold text-slate-900">{title}</Text>
                  {subtitle && <Text className="text-xs text-slate-500 mt-0.5">{subtitle}</Text>}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-200 active:bg-slate-200"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView className="p-6">{children}</ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
