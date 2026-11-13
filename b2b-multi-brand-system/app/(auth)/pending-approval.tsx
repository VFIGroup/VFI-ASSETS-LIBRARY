import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/ui/Button';
import { Clock, ShieldAlert, CheckCircle, RefreshCw, LogOut, XCircle } from 'lucide-react-native';

export default function PendingApprovalScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const isRejected = profile?.approval_status === 'rejected';

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      className="bg-slate-950 p-6"
    >
      <View className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl text-center">
        {/* Status Icon */}
        <View className="items-center mb-5">
          {isRejected ? (
            <View className="w-16 h-16 bg-rose-950/80 border border-rose-800 rounded-2xl items-center justify-center mb-3">
              <XCircle size={36} color="#f43f5e" />
            </View>
          ) : (
            <View className="w-16 h-16 bg-amber-950/80 border border-amber-800 rounded-2xl items-center justify-center mb-3">
              <Clock size={36} color="#f59e0b" />
            </View>
          )}

          <Text className="text-xl font-black text-white text-center">
            {isRejected ? 'Application Requires Revision' : 'Verification Under Review'}
          </Text>

          <Text className="text-xs text-slate-400 mt-1.5 text-center leading-relaxed">
            {isRejected
              ? 'Our compliance and verification team reviewed your business documents and requested corrections before account activation.'
              : 'Your B2B Partner registration and KYC documents have been submitted securely to our Super Admin and Compliance team.'}
          </Text>
        </View>

        {/* User & Role Details */}
        <View className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 mb-5">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-slate-400">Company Name:</Text>
            <Text className="text-xs font-bold text-white">
              {profile?.company_name || 'N/A'}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-slate-400">Requested Role:</Text>
            <Text className="text-xs font-bold text-emerald-400 uppercase">
              {profile?.role}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-400">KYC Status:</Text>
            <Text className="text-xs font-bold text-amber-400 capitalize">
              {profile?.kyc_status.replace('_', ' ')}
            </Text>
          </View>

          {isRejected && profile?.rejection_reason && (
            <View className="mt-3 pt-3 border-t border-slate-700">
              <Text className="text-xs font-bold text-rose-400 mb-1">
                Admin Notes:
              </Text>
              <Text className="text-xs text-slate-300">
                {profile.rejection_reason}
              </Text>
            </View>
          )}
        </View>

        {isRejected ? (
          <Button
            title="Re-Upload KYC Documents"
            onPress={() => router.push('/(auth)/kyc-upload')}
            variant="primary"
            className="bg-emerald-600 border-emerald-600 mb-3"
          />
        ) : (
          <Button
            title="Check Approval Status"
            onPress={handleRefresh}
            loading={refreshing}
            variant="secondary"
            icon={<RefreshCw size={15} color="#0f172a" />}
            className="mb-3"
          />
        )}

        <TouchableOpacity
          onPress={signOut}
          className="flex-row items-center justify-center py-2"
        >
          <LogOut size={14} color="#94a3b8" />
          <Text className="text-xs font-medium text-slate-400 ml-1.5">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
