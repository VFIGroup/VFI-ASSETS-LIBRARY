export type UserRole =
  | 'super_admin'
  | 'management'
  | 'distributor'
  | 'dealer'
  | 'salesperson'
  | 'employee';

export type UserApprovalStatus =
  | 'pending_verification'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type KycStatus =
  | 'not_submitted'
  | 'pending_review'
  | 'verified'
  | 'rejected';

export type KycDocumentType =
  | 'gst_certificate'
  | 'pan_card'
  | 'business_registration'
  | 'id_proof'
  | 'other';

export type AssetCategory =
  | 'marketing_kit'
  | 'product_catalog_pdf'
  | 'high_res_image'
  | 'video'
  | 'spec_sheet'
  | 'price_list'
  | 'brochure';

export type OrderStatus =
  | 'pending_approval'
  | 'stage1_approved'
  | 'rejected'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Brand {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  role: UserRole;
  approval_status: UserApprovalStatus;
  kyc_status: KycStatus;
  assigned_brands: string[];
  assigned_salesperson_id: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: KycDocumentType;
  document_number: string | null;
  file_path: string;
  file_name: string;
  file_size_bytes: number | null;
  status: KycStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  category: AssetCategory;
  file_path: string;
  file_url: string | null;
  file_type: string;
  file_size_bytes: number | null;
  allowed_roles: UserRole[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface Product {
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
  brand?: Brand;
}

export interface Order {
  id: string;
  order_number: string;
  brand_id: string;
  placed_by_user_id: string;
  user_role_at_order: UserRole;
  total_amount: number;
  status: OrderStatus;
  stage1_approved_by: string | null;
  stage1_remarks: string | null;
  approved_at: string | null;
  notes: string | null;
  shipping_address: Record<string, any>;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  placed_by?: UserProfile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
