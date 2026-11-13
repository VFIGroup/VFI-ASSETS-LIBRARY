import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View className="flex-1 bg-slate-950 items-center justify-center p-6 text-center">
        <Text className="text-4xl font-black text-white mb-2">404</Text>
        <Text className="text-base font-bold text-slate-300 mb-4">
          This portal screen does not exist.
        </Text>
        <Link href="/(app)/dashboard" asChild>
          <TouchableOpacity className="bg-emerald-600 px-5 py-2.5 rounded-lg">
            <Text className="text-white font-bold text-sm">Return to Dashboard</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
