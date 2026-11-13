import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../lib/auth-context';
import { kycApi } from '../../lib/api/kyc';
import { KycDocument, KycDocumentType } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import {
  ShieldAlert,
  Upload,
  CheckCircle2,
  FileCheck,
  FileText,
  Building,
  CreditCard,
  UserCheck,
} from 'lucide-react-native';

interface DocSlot {
  type: KycDocumentType;
  title: string;
  description: string;
  icon: any;
  mandatory: boolean;
}

export default function KycUploadScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [uploadedDocs, setUploadedDocs] = useState<KycDocument[]>([]);
  const [uploadingType, setUploadingType] = useState<KycDocumentType | null>(null);
  const [loading, setLoading] = useState(true);

  const docSlots: DocSlot[] = [
    {
      type: 'gst_certificate',
      title: 'GST / Tax Certificate',
      description: 'Official tax registration certificate verifying business legitimacy.',
      icon: <Building size={20} color="#10b981" />,
      mandatory: true,
    },
    {
      type: 'pan_card',
      title: 'Company PAN / Corporate ID',
      description: 'Federal tax identification card or legal entity registration ID.',
      icon: <CreditCard size={20} color="#3b82f6" />,
      mandatory: true,
    },
    {
      type: 'business_registration',
      title: 'Business Registration / Incorporation',
      description: 'Certificate of Incorporation or Partnership deed.',
      icon: <FileText size={20} color="#f59e0b" />,
      mandatory: true,
    },
    {
      type: 'id_proof',
      title: 'Authorized Signatory Photo ID',
      description: 'Passport, Driver’s License, or Government Photo ID of the proprietor.',
      icon: <UserCheck size={20} color="#8b5cf6" />,
      mandatory: true,
    },
  ];

  const loadExistingDocs = async () => {
    try {
      setLoading(true);
      const docs = await kycApi.fetchUserKycDocuments();
      setUploadedDocs(docs);
    } catch (err: any) {
      console.error('Failed to load KYC docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExistingDocs();
  }, []);

  const handlePickAndUpload = async (docType: KycDocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      setUploadingType(docType);

      // Upload via kycApi
      await kycApi.uploadKycDocument({
        documentType: docType,
        documentNumber: '',
        file: {
          uri: fileAsset.uri,
          name: fileAsset.name,
          type: fileAsset.mimeType || 'application/pdf',
          size: fileAsset.size,
        },
      });

      await loadExistingDocs();
      await refreshProfile();
      Alert.alert('Upload Successful', `${docType.replace('_', ' ')} uploaded for verification.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload document');
    } finally {
      setUploadingType(null);
    }
  };

  const isMandatoryComplete = docSlots
    .filter((s) => s.mandatory)
    .every((s) => uploadedDocs.some((d) => d.document_type === s.type));

  const handleProceed = () => {
    if (!isMandatoryComplete) {
      Alert.alert(
        'Mandatory Documents Missing',
        'Please upload all 4 mandatory KYC documents to submit your verification.'
      );
      return;
    }
    router.replace('/(auth)/pending-approval');
  };

  return (
    <ScrollView className="bg-slate-950 p-6">
      <View className="max-w-2xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl my-6">
        <View className="items-center mb-6">
          <View className="w-14 h-14 bg-emerald-600 rounded-2xl items-center justify-center mb-3">
            <ShieldAlert size={30} color="#ffffff" />
          </View>
          <Text className="text-2xl font-black text-white">KYC Business Verification</Text>
          <Text className="text-xs text-slate-400 mt-1 text-center max-w-md">
            To unlock wholesale catalog pricing, brand assets, and ordering privileges, upload your mandatory corporate verification documents.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" className="my-8" />
        ) : (
          <View className="space-y-4 mb-6">
            {docSlots.map((slot) => {
              const existing = uploadedDocs.find((d) => d.document_type === slot.type);
              const isUploading = uploadingType === slot.type;

              return (
                <View
                  key={slot.type}
                  className={`p-4 rounded-xl border ${
                    existing
                      ? 'bg-slate-850 border-emerald-500/40'
                      : 'bg-slate-800/80 border-slate-700'
                  } flex-row items-center justify-between`}
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 rounded-lg bg-slate-900 items-center justify-center mr-3 border border-slate-700">
                      {slot.icon}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold text-white mr-2">
                          {slot.title}
                        </Text>
                        {slot.mandatory && (
                          <Text className="text-[10px] text-rose-400 font-bold">REQUIRED</Text>
                        )}
                      </View>
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {existing ? `Uploaded: ${existing.file_name}` : slot.description}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handlePickAndUpload(slot.type)}
                    disabled={isUploading}
                    className={`px-3 py-2 rounded-lg flex-row items-center ${
                      existing
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-emerald-600 active:bg-emerald-700'
                    }`}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : existing ? (
                      <>
                        <CheckCircle2 size={14} color="#10b981" />
                        <Text className="text-xs font-semibold text-emerald-400 ml-1.5">
                          Replace
                        </Text>
                      </>
                    ) : (
                      <>
                        <Upload size={14} color="#ffffff" />
                        <Text className="text-xs font-bold text-white ml-1.5">
                          Upload
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <Button
          title="Submit KYC for Admin Review"
          onPress={handleProceed}
          variant="primary"
          size="lg"
          disabled={!isMandatoryComplete}
          className={`${
            isMandatoryComplete
              ? 'bg-emerald-600 border-emerald-600'
              : 'bg-slate-800 border-slate-700 opacity-60'
          }`}
        />

        <TouchableOpacity onPress={signOut} className="mt-4 items-center">
          <Text className="text-xs text-slate-500 font-medium">
            Sign out and return later
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
