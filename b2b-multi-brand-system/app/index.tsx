import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { View, ActivityIndicator } from 'react-native';

export default function IndexPage() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profile?.role === 'super_admin') {
    return <Redirect href="/(app)/dashboard" />;
  }

  if (profile?.kyc_status === 'not_submitted') {
    return <Redirect href="/(auth)/kyc-upload" />;
  }

  if (profile?.approval_status === 'pending_approval' || profile?.approval_status === 'rejected') {
    return <Redirect href="/(auth)/pending-approval" />;
  }

  return <Redirect href="/(app)/dashboard" />;
}
