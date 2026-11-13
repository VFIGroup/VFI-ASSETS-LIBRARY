export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          code: string;
          logo_url: string | null;
          description: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          logo_url?: string | null;
          description?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          logo_url?: string | null;
          description?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company_name: string | null;
          role: 'super_admin' | 'management' | 'distributor' | 'dealer' | 'salesperson' | 'employee';
          approval_status: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
          kyc_status: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          assigned_brands: string[];
          assigned_salesperson_id: string | null;
          rejection_reason: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          role?: 'super_admin' | 'management' | 'distributor' | 'dealer' | 'salesperson' | 'employee';
          approval_status?: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
          kyc_status?: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          assigned_brands?: string[];
          assigned_salesperson_id?: string | null;
          rejection_reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          role?: 'super_admin' | 'management' | 'distributor' | 'dealer' | 'salesperson' | 'employee';
          approval_status?: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';
          kyc_status?: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          assigned_brands?: string[];
          assigned_salesperson_id?: string | null;
          rejection_reason?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
        };
      };
      kyc_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: 'gst_certificate' | 'pan_card' | 'business_registration' | 'id_proof' | 'other';
          document_number: string | null;
          file_path: string;
          file_name: string;
          file_size_bytes: number | null;
          status: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          verified_by: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: 'gst_certificate' | 'pan_card' | 'business_registration' | 'id_proof' | 'other';
          document_number?: string | null;
          file_path: string;
          file_name: string;
          file_size_bytes?: number | null;
          status?: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          document_type?: 'gst_certificate' | 'pan_card' | 'business_registration' | 'id_proof' | 'other';
          document_number?: string | null;
          file_path?: string;
          file_name?: string;
          file_size_bytes?: number | null;
          status?: 'not_submitted' | 'pending_review' | 'verified' | 'rejected';
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
      };
      brand_assets: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          description: string | null;
          category: 'marketing_kit' | 'product_catalog_pdf' | 'high_res_image' | 'video' | 'spec_sheet' | 'price_list' | 'brochure';
          file_path: string;
          file_url: string | null;
          file_type: string;
          file_size_bytes: number | null;
          allowed_roles: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          description?: string | null;
          category: 'marketing_kit' | 'product_catalog_pdf' | 'high_res_image' | 'video' | 'spec_sheet' | 'price_list' | 'brochure';
          file_path: string;
          file_url?: string | null;
          file_type: string;
          file_size_bytes?: number | null;
          allowed_roles?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: 'marketing_kit' | 'product_catalog_pdf' | 'high_res_image' | 'video' | 'spec_sheet' | 'price_list' | 'brochure';
          file_path?: string;
          file_url?: string | null;
          file_type?: string;
          file_size_bytes?: number | null;
          allowed_roles?: string[];
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          sku: string;
          name: string;
          description: string | null;
          category: string;
          image_url: string | null;
          min_price: number;
          max_price: number;
          dealer_price: number;
          distributor_price: number;
          stock_qty: number;
          min_order_qty: number;
          status: 'active' | 'inactive' | 'out_of_stock';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          sku: string;
          name: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          min_price?: number;
          max_price?: number;
          dealer_price?: number;
          distributor_price?: number;
          stock_qty?: number;
          min_order_qty?: number;
          status?: 'active' | 'inactive' | 'out_of_stock';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: string;
          image_url?: string | null;
          min_price?: number;
          max_price?: number;
          dealer_price?: number;
          distributor_price?: number;
          stock_qty?: number;
          min_order_qty?: number;
          status?: 'active' | 'inactive' | 'out_of_stock';
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          brand_id: string;
          placed_by_user_id: string;
          user_role_at_order: string;
          total_amount: number;
          status: 'pending_approval' | 'stage1_approved' | 'rejected' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          stage1_approved_by: string | null;
          stage1_remarks: string | null;
          approved_at: string | null;
          notes: string | null;
          shipping_address: Json;
          tracking_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          brand_id: string;
          placed_by_user_id: string;
          user_role_at_order: string;
          total_amount?: number;
          status?: 'pending_approval' | 'stage1_approved' | 'rejected' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          stage1_approved_by?: string | null;
          stage1_remarks?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          shipping_address?: Json;
          tracking_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending_approval' | 'stage1_approved' | 'rejected' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
          stage1_approved_by?: string | null;
          stage1_remarks?: string | null;
          approved_at?: string | null;
          notes?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
    };
  };
}
