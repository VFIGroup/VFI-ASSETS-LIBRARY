-- ==============================================================================
-- B2B MULTI-BRAND DATA WAREHOUSE & ORDER MANAGEMENT SYSTEM
-- PostgreSQL + Supabase Complete Schema, RBAC, Triggers & Strict RLS Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'management',
        'distributor',
        'dealer',
        'salesperson',
        'employee'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_approval_status AS ENUM (
        'pending_verification',
        'pending_approval',
        'approved',
        'rejected',
        'suspended'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM (
        'not_submitted',
        'pending_review',
        'verified',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_document_type AS ENUM (
        'gst_certificate',
        'pan_card',
        'business_registration',
        'id_proof',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE asset_category AS ENUM (
        'marketing_kit',
        'product_catalog_pdf',
        'high_res_image',
        'video',
        'spec_sheet',
        'price_list',
        'brochure'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending_approval',  -- Stage 1: Order Submitted, awaiting review
        'stage1_approved',   -- Stage 2: Approved by Admin/Management
        'rejected',          -- Stage 2: Rejected with remarks
        'confirmed',         -- Stage 3: Inventory booked / PI generated
        'dispatched',        -- Stage 3: In transit with tracking number
        'delivered',         -- Stage 3: Order fulfilled
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES DEFINITION

-- A. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. User Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'dealer',
    approval_status user_approval_status NOT NULL DEFAULT 'pending_approval',
    kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
    assigned_brands UUID[] NOT NULL DEFAULT '{}',
    assigned_salesperson_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- C. KYC Documents Table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type kyc_document_type NOT NULL,
    document_number VARCHAR(100),
    file_path TEXT NOT NULL, -- Stored inside private 'kyc-documents' bucket
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    status kyc_status NOT NULL DEFAULT 'pending_review',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. Brand Assets (Data Warehouse) Table
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category asset_category NOT NULL,
    file_path TEXT NOT NULL, -- Stored inside 'brand-assets' bucket
    file_url TEXT,
    file_type VARCHAR(100) NOT NULL, -- MIME type
    file_size_bytes BIGINT,
    allowed_roles user_role[] DEFAULT '{super_admin,management,distributor,dealer,salesperson,employee}',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. Brand-Wise Products Table with Tiered Pricing
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    image_url TEXT,
    min_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    dealer_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    distributor_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    min_order_qty INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. B2B Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
    placed_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    user_role_at_order user_role NOT NULL,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status order_status NOT NULL DEFAULT 'pending_approval',
    stage1_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    stage1_remarks TEXT,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    tracking_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- G. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_brands ON public.profiles USING GIN (assigned_brands);
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand ON public.brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON public.brand_assets(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_placed_by ON public.orders(placed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand ON public.orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 5. HELPER SECURITY DEFINER FUNCTIONS (FOR RLS POLICIES)

-- Current user profile lookup
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
DECLARE
    profile_record public.profiles;
BEGIN
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN profile_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is Management or Super Admin
CREATE OR REPLACE FUNCTION public.is_management_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'management')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has access to a specific brand
CREATE OR REPLACE FUNCTION public.has_brand_access(check_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u_role user_role;
    u_status user_approval_status;
    u_brands UUID[];
BEGIN
    SELECT role, approval_status, assigned_brands
    INTO u_role, u_status, u_brands
    FROM public.profiles
    WHERE id = auth.uid();

    IF u_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    IF u_status <> 'approved' THEN
        RETURN FALSE;
    END IF;

    RETURN check_brand_id = ANY(u_brands);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is eligible to order for brand (Dealers & Distributors only, Approved)
CREATE OR REPLACE FUNCTION public.can_place_order(check_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u_role user_role;
    u_status user_approval_status;
    u_brands UUID[];
BEGIN
    SELECT role, approval_status, assigned_brands
    INTO u_role, u_status, u_brands
    FROM public.profiles
    WHERE id = auth.uid();

    IF u_status <> 'approved' THEN
        RETURN FALSE;
    END IF;

    IF u_role NOT IN ('dealer', 'distributor') THEN
        RETURN FALSE;
    END IF;

    RETURN check_brand_id = ANY(u_brands);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. AUTOMATED TRIGGERS

-- Trigger: auto-generate order number e.g., 'ORD-20261113-1001'
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_val BIGINT;
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        date_part := to_char(timezone('utc'::text, now()), 'YYYYMMDD');
        seq_val := nextval('order_number_seq');
        NEW.order_number := 'ORD-' || date_part || '-' || seq_val;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Trigger: updated_at updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_kyc_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_brand_assets_updated_at BEFORE UPDATE ON public.brand_assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: On auth.users insert, auto-create profile from metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role user_role := 'dealer';
    initial_brands UUID[] := '{}';
    company_txt TEXT := '';
    full_name_txt TEXT := '';
    phone_txt TEXT := '';
BEGIN
    -- Extract metadata if passed during signup
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        requested_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;

    IF NEW.raw_user_meta_data->'assigned_brands' IS NOT NULL THEN
        SELECT ARRAY(
            SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'assigned_brands')::uuid
        ) INTO initial_brands;
    END IF;

    full_name_txt := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    company_txt := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
    phone_txt := COALESCE(NEW.raw_user_meta_data->>'phone', '');

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        company_name,
        role,
        approval_status,
        kyc_status,
        assigned_brands
    ) VALUES (
        NEW.id,
        full_name_txt,
        NEW.email,
        phone_txt,
        company_txt,
        requested_role,
        'pending_approval',
        'not_submitted',
        initial_brands
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. BRANDS POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin has full control
CREATE POLICY "super_admin_all_brands" ON public.brands
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Approved users can view active brands assigned to them, or signup users can read all active brands for selection
CREATE POLICY "users_read_brands" ON public.brands
    FOR SELECT
    TO authenticated
    USING (
        status = 'active' AND (
            public.is_super_admin() OR
            public.has_brand_access(id) OR
            -- Allow new registrations to see brand choices
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.approval_status = 'pending_approval'
            )
        )
    );

-- ------------------------------------------------------------------------------
-- B. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin has full CRUD on all profiles
CREATE POLICY "super_admin_manage_profiles" ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Management can read profiles sharing their brands
CREATE POLICY "management_read_profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        public.is_management_or_admin()
    );

-- Management can approve/update profiles within their assigned brands
CREATE POLICY "management_update_profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        public.is_management_or_admin() AND
        role NOT IN ('super_admin', 'management')
    )
    WITH CHECK (
        public.is_management_or_admin() AND
        role NOT IN ('super_admin', 'management')
    );

-- Users can read and update their own profile
CREATE POLICY "users_read_own_profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        -- Users cannot escalate their own role or approval status directly
        role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) AND
        approval_status = (SELECT p.approval_status FROM public.profiles p WHERE p.id = auth.uid())
    );

-- Salespersons can read profiles of mapped dealers/distributors
CREATE POLICY "salesperson_read_assigned_dealers" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        assigned_salesperson_id = auth.uid()
    );

-- ------------------------------------------------------------------------------
-- C. KYC DOCUMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin and Management can view and verify all KYC documents
CREATE POLICY "admin_management_kyc_all" ON public.kyc_documents
    FOR ALL
    TO authenticated
    USING (public.is_management_or_admin())
    WITH CHECK (public.is_management_or_admin());

-- Users can view their own KYC docs
CREATE POLICY "users_view_own_kyc" ON public.kyc_documents
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own KYC docs during onboarding
CREATE POLICY "users_insert_own_kyc" ON public.kyc_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their KYC docs only if rejected or pending_review
CREATE POLICY "users_update_own_pending_kyc" ON public.kyc_documents
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND status IN ('pending_review', 'rejected'))
    WITH CHECK (user_id = auth.uid() AND status = 'pending_review');

-- ------------------------------------------------------------------------------
-- D. BRAND ASSETS (DATA WAREHOUSE) POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin & Management have full CRUD
CREATE POLICY "admin_management_assets" ON public.brand_assets
    FOR ALL
    TO authenticated
    USING (public.is_management_or_admin())
    WITH CHECK (public.is_management_or_admin());

-- All other roles can select assets if:
-- 1. User has access to the brand
-- 2. User's role is in allowed_roles
CREATE POLICY "users_read_brand_assets" ON public.brand_assets
    FOR SELECT
    TO authenticated
    USING (
        public.has_brand_access(brand_id) AND (
            allowed_roles IS NULL OR
            (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = ANY(allowed_roles)
        )
    );

-- ------------------------------------------------------------------------------
-- E. PRODUCTS & CATALOG POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin & Management can manage all products
CREATE POLICY "admin_management_products" ON public.products
    FOR ALL
    TO authenticated
    USING (public.is_management_or_admin())
    WITH CHECK (public.is_management_or_admin());

-- Dealers, Distributors, Salespersons & Employees can read active products for assigned brands
CREATE POLICY "users_read_brand_products" ON public.products
    FOR SELECT
    TO authenticated
    USING (
        status = 'active' AND
        public.has_brand_access(brand_id)
    );

-- ------------------------------------------------------------------------------
-- F. B2B ORDERS POLICIES
-- ------------------------------------------------------------------------------
-- Super Admin can manage all orders
CREATE POLICY "super_admin_manage_orders" ON public.orders
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Management can read and stage-1 approve orders for their brands
CREATE POLICY "management_orders_access" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        public.is_management_or_admin() AND
        public.has_brand_access(brand_id)
    );

CREATE POLICY "management_update_order_stage" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        public.is_management_or_admin() AND
        public.has_brand_access(brand_id)
    )
    WITH CHECK (
        public.is_management_or_admin() AND
        public.has_brand_access(brand_id)
    );

-- Dealers and Distributors can place orders for their assigned brands
CREATE POLICY "dealers_distributors_place_orders" ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (
        placed_by_user_id = auth.uid() AND
        public.can_place_order(brand_id)
    );

-- Dealers and Distributors can view their own placed orders
CREATE POLICY "users_view_own_orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (placed_by_user_id = auth.uid());

-- Salespersons can view orders placed by their assigned dealers/distributors
CREATE POLICY "salespersons_view_client_orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = orders.placed_by_user_id
              AND p.assigned_salesperson_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- G. ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
-- Inherit access from parent order
CREATE POLICY "super_admin_manage_order_items" ON public.order_items
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "users_read_order_items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
        )
    );

CREATE POLICY "users_insert_order_items" ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND o.placed_by_user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 8. SUPABASE STORAGE BUCKETS & STORAGE RLS POLICIES
-- ==============================================================================

-- Create buckets via SQL (Supabase storage schema)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('kyc-documents', 'kyc-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('brand-assets', 'brand-assets', false, 104857600, NULL) -- 100MB max per asset
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies for 'kyc-documents'
-- 1. Users can upload to their own user folder: kyc-documents/{user_id}/*
CREATE POLICY "users_upload_own_kyc_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Users can read their own uploaded files
CREATE POLICY "users_read_own_kyc_files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'kyc-documents' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.is_management_or_admin()
    )
);

-- Storage Policies for 'brand-assets'
-- 1. Admin and Management can upload and manage brand assets: brand-assets/{brand_id}/*
CREATE POLICY "admin_management_upload_brand_assets"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'brand-assets' AND
    public.is_management_or_admin()
)
WITH CHECK (
    bucket_id = 'brand-assets' AND
    public.is_management_or_admin()
);

-- 2. Approved users with brand access can download/read assets
CREATE POLICY "authorized_users_read_brand_assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'brand-assets' AND
    (
        public.is_super_admin() OR
        public.has_brand_access((storage.foldername(name))[1]::uuid)
    )
);

-- ==============================================================================
-- 9. SEED DATA FOR INITIAL SETUP
-- ==============================================================================
-- Insert 3 initial brands
INSERT INTO public.brands (id, name, code, description, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Aura Audio Systems', 'AURA-AUDIO', 'High-fidelity commercial sound and acoustics', 'active'),
    ('b0000000-0000-0000-0000-000000000002', 'Lumina Lighting Labs', 'LUMINA-PRO', 'Architectural and smart industrial illumination', 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'Apex Automation Hub', 'APEX-AUTO', 'Industrial IoT control panels & telemetry gateways', 'active')
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Products for Aura Audio
INSERT INTO public.products (brand_id, sku, name, description, category, min_price, max_price, dealer_price, distributor_price, stock_qty, min_order_qty, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'AURA-SPK-PRO8', 'Aura Pro 8-inch Wall Mount Speaker', 'Weatherproof commercial enclosure with multi-tap 70V/100V transformer.', 'Commercial Audio', 220.00, 260.00, 185.00, 145.00, 320, 4, 'active'),
    ('a0000000-0000-0000-0000-000000000001', 'AURA-AMP-4CH', 'Aura 4x500W Dante Power Amplifier', 'Dante-enabled Class-D quad power amplifier with DSP network management.', 'Amplification', 890.00, 990.00, 750.00, 620.00, 85, 1, 'active'),
    ('b0000000-0000-0000-0000-000000000002', 'LUM-BAY-150W', 'Lumina High-Bay Industrial LED 150W', '19,500 lumens, IP65 rated, 0-10V dimmable warehouse fixture.', 'Industrial Fixtures', 140.00, 175.00, 115.00, 88.00, 500, 10, 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'APX-GATE-4G', 'Apex Edge Telemetry Gateway 4G/LTE', 'Dual SIM Modbus to MQTT industrial gateway with optical isolation.', 'Gateways & Controllers', 350.00, 420.00, 290.00, 230.00, 120, 2, 'active')
ON CONFLICT (sku) DO NOTHING;
