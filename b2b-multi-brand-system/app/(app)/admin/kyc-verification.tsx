import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth-context';
import { useBrandStore } from '../../../lib/store/useBrandStore';
import { kycApi } from '../../../lib/api/kyc';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Building,
  User,
  Mail,
  Tag,
} from 'lucide-react-native';

export default function KycVerificationDashboard() {
  const { profile } = useAuth();
  const { availableBrands } = useBrandStore();

  const isManagementOrAdmin =
    profile?.role === 'super_admin' || profile?.role === 'management';

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all pending approval profiles
  const {
    data: pendingUsers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-pending-kyc'],
    queryFn: async () => {
      return await kycApi.fetchAllPendingKycUsers();
    },
    enabled: isManagementOrAdmin,
  });

  const handleOpenReview = (userProfile: any) => {
    setSelectedUser(userProfile);
    setSelectedBrandIds(userProfile.assigned_brands || []);
    setRejectionReason('');
  };

  const toggleBrandAssignment = (brandId: string) => {
    if (selectedBrandIds.includes(brandId)) {
      setSelectedBrandIds(selectedBrandIds.filter((id) => id !== brandId));
    } else {
      setSelectedBrandIds([...selectedBrandIds, brandId]);
    }
  };

  const handleOpenDocFile = async (filePath: string) => {
    try {
      const signedUrl = await kycApi.getKycSignedUrl(filePath, 1800);
      if (Platform.OS === 'web') {
        window.open(signedUrl, '_blank');
      } else {
        await Linking.openURL(signedUrl);
      }
    } catch (err: any) {
      Alert.alert('File View Error', err.message || 'Could not generate signed URL');
    }
  };

  const handleApproveUser = async () => {
    if (!selectedUser) return;
    if (selectedBrandIds.length === 0) {
      Alert.alert('Brand Assignment Required', 'Please assign at least one active brand to this partner.');
      return;
    }

    try {
      setActionLoading(true);
      await kycApi.approveUserProfile(selectedUser.id, selectedBrandIds);
      Alert.alert('Partner Approved', `${selectedUser.full_name} (${selectedUser.company_name}) has been approved.`);
      setSelectedUser(null);
      refetch();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed to approve partner');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a rejection reason to inform the user.');
      return;
    }

    try {
      setActionLoading(true);
      await kycApi.rejectUserProfile(selectedUser.id, rejectionReason.trim());
      Alert.alert('Partner Rejected', `Registration for ${selectedUser.full_name} marked rejected.`);
      setSelectedUser(null);
      refetch();
    } catch (err: any) {
      Alert.alert('Rejection Error', err.message || 'Failed to reject partner');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isManagementOrAdmin) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6 text-center">
        <ShieldAlert size={48} color="#f43f5e" className="mb-3" />
        <Text className="text-xl font-bold text-white mb-2">Access Denied</Text>
        <Text className="text-xs text-slate-400">
          KYC verification is restricted to Compliance Administrators.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-950 p-4 md:p-8">
      <View className="max-w-7xl w-full mx-auto">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <View className="flex-row items-center">
              <ShieldAlert size={24} color="#10b981" />
              <Text className="text-xl md:text-2xl font-black text-white ml-2">
                Partner KYC Verification & Onboarding
              </Text>
            </View>
            <Text className="text-xs md:text-sm text-slate-400 mt-1">
              Super Admin verification portal for business licenses, PAN, and brand allocation
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-xs text-slate-400 mt-3">Loading pending KYC registrations...</Text>
          </View>
        ) : pendingUsers.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-xl p-12 items-center text-center">
            <CheckCircle2 size={48} color="#10b981" className="mb-3" />
            <Text className="text-lg font-bold text-white mb-1">
              Zero Pending KYC Verifications
            </Text>
            <Text className="text-xs text-slate-400 max-w-sm text-center">
              All partner registrations and KYC documentation have been reviewed.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {pendingUsers.map((user) => (
              <View
                key={user.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-row items-center justify-between flex-wrap gap-4"
              >
                <View className="flex-1 min-w-[240px]">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Text className="text-base font-extrabold text-white">
                      {user.company_name || user.full_name}
                    </Text>
                    <View className="bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-emerald-400 uppercase">
                        {user.role}
                      </Text>
                    </View>
                    <View className="bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-amber-400">
                        PENDING KYC REVIEW
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-slate-400">
                    Contact: {user.full_name} ({user.email}) • Phone: {user.phone || 'N/A'}
                  </Text>
                  <Text className="text-[11px] text-slate-500 mt-1">
                    Uploaded Documents: {user.kyc_documents?.length || 0} files • Applied on {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Button
                  title="Inspect KYC & Decide"
                  onPress={() => handleOpenReview(user)}
                  variant="primary"
                  className="bg-emerald-600 border-emerald-600"
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Review Modal */}
      {selectedUser && (
        <Modal
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`KYC Inspection: ${selectedUser.company_name || selectedUser.full_name}`}
          subtitle={`Requested Role: ${selectedUser.role.toUpperCase()} • ${selectedUser.email}`}
        >
          <View className="space-y-4">
            {/* Uploaded Documents List */}
            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Submitted KYC Documents ({selectedUser.kyc_documents?.length || 0})
              </Text>
              {selectedUser.kyc_documents?.length === 0 ? (
                <Text className="text-xs text-rose-500 font-semibold">
                  No documents uploaded yet.
                </Text>
              ) : (
                selectedUser.kyc_documents?.map((doc: any) => (
                  <View
                    key={doc.id}
                    className="flex-row items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 mb-2"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold text-slate-800 capitalize">
                        {doc.document_type.replace(/_/g, ' ')}
                      </Text>
                      <Text className="text-[11px] text-slate-500">
                        {doc.file_name} • {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleOpenDocFile(doc.file_path)}
                      className="flex-row items-center bg-slate-900 px-3 py-1.5 rounded"
                    >
                      <ExternalLink size={12} color="#ffffff" />
                      <Text className="text-xs text-white font-bold ml-1.5">View Doc</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Brand Assignment */}
            <View>
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Authorize Brand Access *
              </Text>
              <View className="space-y-1.5">
                {availableBrands.map((brand) => {
                  const isAssigned = selectedBrandIds.includes(brand.id);
                  return (
                    <TouchableOpacity
                      key={brand.id}
                      onPress={() => toggleBrandAssignment(brand.id)}
                      className={`flex-row items-center justify-between p-2.5 rounded-lg border ${
                        isAssigned
                          ? 'bg-emerald-50 border-emerald-500'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className="text-xs font-bold text-slate-800">
                        {brand.name} ({brand.code})
                      </Text>
                      <View
                        className={`w-4 h-4 rounded items-center justify-center border ${
                          isAssigned ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                        }`}
                      >
                        {isAssigned && <Text className="text-white text-[10px] font-black">✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Rejection Remarks */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 mb-1">
                Rejection Remarks (Required if rejecting):
              </Text>
              <Input
                placeholder="e.g. GST certificate mismatch with company incorporation name."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
              />
            </View>

            {/* Decision Buttons */}
            <View className="flex-row items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <TouchableOpacity
                onPress={handleRejectUser}
                disabled={actionLoading}
                className="bg-rose-600 active:bg-rose-700 px-4 py-2.5 rounded-lg flex-row items-center"
              >
                <XCircle size={15} color="#ffffff" />
                <Text className="text-xs font-bold text-white ml-1.5">Reject Application</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApproveUser}
                disabled={actionLoading}
                className="bg-emerald-600 active:bg-emerald-700 px-5 py-2.5 rounded-lg flex-row items-center ml-2"
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle2 size={15} color="#ffffff" />
                    <Text className="text-xs font-bold text-white ml-1.5">Approve Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
