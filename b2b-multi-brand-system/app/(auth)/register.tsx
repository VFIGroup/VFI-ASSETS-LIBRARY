import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Brand, UserRole } from '../../lib/types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, User, Mail, Lock, Building, Phone, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<UserRole>('dealer');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active brands for multi-brand selection during onboarding
  useEffect(() => {
    async function loadBrands() {
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('status', 'active');
      if (data) setAvailableBrands(data as Brand[]);
    }
    loadBrands();
  }, []);

  const toggleBrand = (brandId: string) => {
    if (selectedBrands.includes(brandId)) {
      setSelectedBrands(selectedBrands.filter((id) => id !== brandId));
    } else {
      setSelectedBrands([...selectedBrands, brandId]);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !companyName.trim()) {
      setErrorMessage('Please fill in all mandatory profile fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (selectedBrands.length === 0) {
      setErrorMessage('Please select at least one brand you are applying to represent.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      // Sign up with Supabase Auth passing custom metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
            phone: phone.trim(),
            role: role,
            assigned_brands: selectedBrands,
          },
          emailRedirectTo: 'https://b2bportal.yourdomain.com/auth/callback',
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Next step: mandatory KYC document upload
      router.replace('/(auth)/kyc-upload');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="bg-slate-950 p-6">
      <View className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl my-6">
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <ArrowLeft size={16} color="#94a3b8" />
          <Text className="text-xs text-slate-400 font-semibold ml-1.5">
            Back to Login
          </Text>
        </TouchableOpacity>

        <View className="items-center mb-6">
          <View className="w-12 h-12 bg-emerald-600 rounded-xl items-center justify-center mb-2 shadow-lg">
            <Building size={26} color="#ffffff" />
          </View>
          <Text className="text-xl font-extrabold text-white">
            B2B Partner Registration
          </Text>
          <Text className="text-xs text-slate-400 mt-1 text-center">
            Apply for Dealer, Distributor, or Sales Access across authorized brands
          </Text>
        </View>

        {errorMessage ? (
          <View className="bg-rose-950/60 border border-rose-800 p-3 rounded-lg mb-4">
            <Text className="text-xs text-rose-300 font-medium">{errorMessage}</Text>
          </View>
        ) : null}

        {/* Profile Inputs */}
        <Input
          label="Full Legal Name *"
          placeholder="Johnathan Doe"
          value={fullName}
          onChangeText={setFullName}
          leftIcon={<User size={16} color="#94a3b8" />}
        />

        <Input
          label="Company / Enterprise Name *"
          placeholder="Acme Distribution Corp."
          value={companyName}
          onChangeText={setCompanyName}
          leftIcon={<Building size={16} color="#94a3b8" />}
        />

        <Input
          label="Corporate Email *"
          placeholder="contact@acmedist.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Mail size={16} color="#94a3b8" />}
        />

        <Input
          label="Direct Phone Number"
          placeholder="+1 (555) 234-5678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon={<Phone size={16} color="#94a3b8" />}
        />

        <Input
          label="Password (min 8 chars) *"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<Lock size={16} color="#94a3b8" />}
        />

        {/* Role Selection */}
        <View className="mb-5">
          <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Your Requested Partner Role *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              { id: 'dealer', label: 'Dealer', desc: 'Dealer Pricing & Direct Orders' },
              { id: 'distributor', label: 'Distributor', desc: 'Bulk Distributor Tier' },
              { id: 'salesperson', label: 'Salesperson', desc: 'Assigned Client Tracking' },
              { id: 'employee', label: 'Employee', desc: 'Collateral & Asset Warehouse' },
            ].map((r) => {
              const isSelected = role === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id as UserRole)}
                  className={`border rounded-xl p-3 flex-1 min-w-[130px] ${
                    isSelected
                      ? 'bg-emerald-950 border-emerald-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      isSelected ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {r.label}
                  </Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">
                    {r.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Brand Association Selection */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Requested Brand Access *
          </Text>
          <View className="space-y-2">
            {availableBrands.map((brand) => {
              const isChecked = selectedBrands.includes(brand.id);
              return (
                <TouchableOpacity
                  key={brand.id}
                  onPress={() => toggleBrand(brand.id)}
                  className={`flex-row items-center justify-between p-3 rounded-xl border ${
                    isChecked
                      ? 'bg-emerald-950 border-emerald-500'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-white">
                      {brand.name}
                    </Text>
                    <Text className="text-[11px] text-slate-400">{brand.code}</Text>
                  </View>
                  <View
                    className={`w-5 h-5 rounded items-center justify-center border ${
                      isChecked ? 'bg-emerald-500 border-emerald-400' : 'border-slate-500'
                    }`}
                  >
                    {isChecked && <Text className="text-slate-950 font-black text-xs">✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Create Account & Proceed to KYC"
          onPress={handleRegister}
          loading={loading}
          variant="primary"
          size="lg"
          className="bg-emerald-600 border-emerald-600 active:bg-emerald-700"
        />
      </View>
    </ScrollView>
  );
}
