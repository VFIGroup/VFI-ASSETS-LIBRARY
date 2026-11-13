import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your registered corporate email.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://b2bportal.yourdomain.com/auth/reset-password',
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send reset password email');
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-5"
        >
          <ArrowLeft size={16} color="#94a3b8" />
          <Text className="text-xs text-slate-400 font-semibold ml-1.5">
            Back to Sign In
          </Text>
        </TouchableOpacity>

        {submitted ? (
          <View className="items-center py-4">
            <View className="w-14 h-14 bg-emerald-950 border border-emerald-700 rounded-full items-center justify-center mb-4">
              <CheckCircle2 size={32} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-white text-center mb-2">
              Password Reset Link Sent
            </Text>
            <Text className="text-xs text-slate-400 text-center leading-relaxed mb-6">
              A recovery link routed via our enterprise Gmail SMTP server has been delivered to{' '}
              <Text className="text-emerald-400 font-semibold">{email}</Text>. Please check your inbox and spam folder.
            </Text>
            <Button
              title="Return to Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="secondary"
              className="w-full"
            />
          </View>
        ) : (
          <View>
            <View className="items-center mb-6">
              <View className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl items-center justify-center mb-2">
                <KeyRound size={24} color="#10b981" />
              </View>
              <Text className="text-xl font-black text-white">Reset Password</Text>
              <Text className="text-xs text-slate-400 mt-1 text-center">
                Enter your company email to receive a secure recovery email.
              </Text>
            </View>

            {errorMessage ? (
              <View className="bg-rose-950/60 border border-rose-800 p-3 rounded-lg mb-4">
                <Text className="text-xs text-rose-300 font-medium">{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Corporate Email Address"
              placeholder="name@business.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={16} color="#94a3b8" />}
            />

            <Button
              title="Send Recovery Email"
              onPress={handleReset}
              loading={loading}
              variant="primary"
              size="lg"
              className="bg-emerald-600 border-emerald-600 active:bg-emerald-700"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
