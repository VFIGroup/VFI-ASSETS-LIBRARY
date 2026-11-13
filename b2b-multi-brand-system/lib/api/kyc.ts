import { supabase } from '../supabase';
import { KycDocument, KycDocumentType } from '../types';

export const kycApi = {
  uploadKycDocument: async ({
    documentType,
    documentNumber,
    file,
  }: {
    documentType: KycDocumentType;
    documentNumber?: string;
    file: { uri: string; name: string; type: string; size?: number; blob?: Blob };
  }) => {
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) throw new Error('Not authenticated');

    const userId = userAuth.user.id;
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${userId}/${Date.now()}_${documentType}_${cleanName}`;

    let uploadBody: any;
    if (file.blob) {
      uploadBody = file.blob;
    } else {
      const res = await fetch(file.uri);
      uploadBody = await res.blob();
    }

    // 1. Upload to private 'kyc-documents' bucket
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(storagePath, uploadBody, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Insert into kyc_documents table
    const { data: docRecord, error: docError } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        document_number: documentNumber || null,
        file_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size || null,
        status: 'pending_review',
      })
      .select()
      .single();

    if (docError) throw docError;

    // 3. Update profile kyc_status to 'pending_review'
    await supabase
      .from('profiles')
      .update({ kyc_status: 'pending_review' })
      .eq('id', userId);

    return docRecord as KycDocument;
  },

  fetchUserKycDocuments: async (userId?: string) => {
    let targetId = userId;
    if (!targetId) {
      const { data: userAuth } = await supabase.auth.getUser();
      targetId = userAuth.user?.id;
    }
    if (!targetId) return [];

    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as KycDocument[];
  },

  getKycSignedUrl: async (filePath: string, expiresIn = 1800): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  fetchAllPendingKycUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        kyc_documents(*)
      `)
      .in('approval_status', ['pending_approval', 'pending_verification'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  approveUserProfile: async (userId: string, assignedBrands: string[]) => {
    const { data: userAuth } = await supabase.auth.getUser();

    // 1. Update profile to approved
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        approval_status: 'approved',
        kyc_status: 'verified',
        assigned_brands: assignedBrands,
        approved_by: userAuth.user?.id || null,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // 2. Mark user's KYC documents as verified
    await supabase
      .from('kyc_documents')
      .update({
        status: 'verified',
        verified_by: userAuth.user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // 3. Trigger approval email via Edge Function
    if (profile?.email) {
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            to: profile.email,
            type: 'KYC_APPROVED',
            recipientName: profile.full_name,
            data: {
              role: profile.role,
              brands: 'All Assigned Brands',
              loginUrl: 'https://b2bportal.yourdomain.com',
            },
          },
        });
      } catch (mailErr) {
        console.warn('[KycApi] Failed to trigger approval email:', mailErr);
      }
    }

    return profile;
  },

  rejectUserProfile: async (userId: string, reason: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        approval_status: 'rejected',
        kyc_status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('kyc_documents')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('user_id', userId);

    // Trigger rejection email
    if (profile?.email) {
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            to: profile.email,
            type: 'KYC_REJECTED',
            recipientName: profile.full_name,
            data: {
              rejectionReason: reason,
            },
          },
        });
      } catch (mailErr) {
        console.warn('[KycApi] Failed to trigger rejection email:', mailErr);
      }
    }

    return profile;
  },
};
