import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Mail, Lock, ArrowRight, Building2 } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your business email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Router will automatically redirect based on AuthContext & approval state
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      className="bg-slate-950 p-6"
    >
      <View className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
        {/* Brand Header */}
        <View className="items-center mb-6">
          <View className="w-14 h-14 bg-emerald-600 rounded-2xl items-center justify-center mb-3 shadow-lg shadow-emerald-950">
            <ShieldCheck size={32} color="#ffffff" />
          </View>
          <Text className="text-2xl font-black text-white tracking-tight">
            NEXUS B2B
          </Text>
          <Text className="text-xs text-slate-400 mt-1 text-center font-medium">
            Multi-Brand Warehouse & Order Management System
          </Text>
        </View>

        {errorMessage ? (
          <View className="bg-rose-950/60 border border-rose-800 p-3 rounded-lg mb-4">
            <Text className="text-xs text-rose-300 font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <Input
          label="Corporate Email"
          placeholder="name@business.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Mail size={16} color="#94a3b8" />}
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<Lock size={16} color="#94a3b8" />}
        />

        <View className="flex-row justify-end mb-5">
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="text-xs font-semibold text-emerald-400">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Sign In to Partner Portal"
          onPress={handleSignIn}
          loading={loading}
          variant="primary"
          size="lg"
          className="bg-emerald-600 border-emerald-600 active:bg-emerald-700"
        />

        {/* Register footer */}
        <View className="mt-6 pt-5 border-t border-slate-800 items-center">
          <Text className="text-xs text-slate-400 mb-2">
            New Distributor, Dealer, or Partner?
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            className="flex-row items-center"
          >
            <Text className="text-xs font-bold text-emerald-400 mr-1">
              Apply for Partner Account & Upload KYC
            </Text>
            <ArrowRight size={14} color="#34d399" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
