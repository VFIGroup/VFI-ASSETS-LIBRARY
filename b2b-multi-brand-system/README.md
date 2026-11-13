# NEXUS B2B Multi-Brand Data Warehouse & Order Management System

A production-ready, universal, cross-platform B2B enterprise platform engineered with **React Native (Expo + Expo Router)** and **Supabase (PostgreSQL, Auth, Storage, Edge Functions)**. Runs natively from a single codebase across **Web**, **iOS**, and **Android**.

---

## 1. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|               UNIVERSAL CROSS-PLATFORM CLIENT (EXPO + REACT NATIVE)               |
|                                                                                   |
|  +--------------------+  +---------------------+  +----------------------------+  |
|  | Web (Desktop/Tab)  |  |  iOS (iPhone/iPad)  |  |  Android (Phone/Tablet)    |  |
|  +--------------------+  +---------------------+  +----------------------------+  |
|         | NativeWind (Tailwind CSS) | Expo Router v3 | Zustand & TanStack Query   |
+------------------------------------------+----------------------------------------+
                                           |
                                           | HTTPS / WSS (Supabase Client)
                                           v
+-----------------------------------------------------------------------------------+
|                        SUPABASE BACKEND INFRASTRUCTURE                            |
|                                                                                   |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  |   Supabase Auth   |  | PostgreSQL + RLS   |  | Private Storage Buckets      | |
|  | (Custom Gmail     |  | (Strict Brand &    |  | - brand-assets (100MB max)    | |
|  |  SMTP Delivery)   |  |  Role Isolation)   |  | - kyc-documents (15MB private)| |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|            |                      |                            |                  |
|            +----------------------+----------------------------+                  |
|                                   |                                               |
|                    Supabase Edge Runtime (Deno)                                   |
|   +--------------------------------------------------------------------------+    |
|   | Edge Function: send-transactional-email (Nodemailer + Gmail TLS)        |    |
|   | Edge Function: order-stage-notifier (Database Webhook Listener)          |    |
|   +--------------------------------------------------------------------------+    |
+------------------------------------------+----------------------------------------+
                                           |
                                           | SMTP (Port 465 SSL / 587 TLS)
                                           v
                    +----------------------------------------------+
                    | Google Gmail Custom SMTP (App Passwords)     |
                    | - Account Verification                       |
                    | - KYC Review Decisions                       |
                    | - Stage-1 Order Approval Alerts              |
                    | - Order Dispatched & Tracking                |
                    | - Password Resets                            |
                    +----------------------------------------------+
```

### Core Technologies
- **Universal Frontend:** Expo SDK 51, Expo Router v3 (file-system based navigation), NativeWind v2 (Tailwind CSS), Lucide React Native.
- **Backend & Database:** Supabase PostgreSQL with strict Row Level Security (RLS) policies and security-definer helper functions.
- **Storage:** Supabase Storage with signed download URLs for private KYC documents and brand assets.
- **Edge Computing & Email:** Supabase Edge Functions with Nodemailer over TLS connecting to Google's Custom SMTP service.
- **State Management:** Zustand (Cart, Active Brand Scope) + TanStack React Query (server cache, optimistic updates).

---

## 2. Role-Based Hierarchy & Access Control Matrix (RBAC + RLS)

| Role | Brand Assets | Product Catalog | Direct B2B Ordering | Order Management | KYC & User Approvals |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Full CRUD (All Brands) | Full CRUD (All Brands) | Yes (All Brands) | Global Oversight & Stage-1 Approvals | Full Approval / Rejection |
| **Management** | Full CRUD (Assigned Brands) | Full CRUD (Assigned Brands) | Yes (Assigned Brands) | Stage-1 Review & Approval | Review & Brand Assignment |
| **Distributor** | View/Download (Assigned) | View (Distributor Price Tier) | Bulk B2B Orders | View Own Orders & Tracking | Self-Submission |
| **Dealer** | View/Download (Assigned) | View (Dealer Price Tier) | Direct B2B Orders | View Own Orders & Tracking | Self-Submission |
| **Salesperson**| View/Download (Assigned) | View (Pricing Ranges) | View Only (Configurable) | Track Mapped Dealers' Orders | View Only |
| **Employee** | View/Download (Collateral) | View (Marketing View) | Restricted | Restricted | N/A |

---

## 3. Database Schema Overview

The database migration is located at:
`supabase/migrations/20261113000000_complete_b2b_schema.sql`

### Key Entities
1. **`brands`**: Enterprise entities (id, name, code, logo_url, description, status).
2. **`profiles`**: Extends `auth.users` with `company_name`, `role`, `approval_status`, `kyc_status`, `assigned_brands` (UUID[] array).
3. **`kyc_documents`**: Private compliance records (`gst_certificate`, `pan_card`, `business_registration`, `id_proof`).
4. **`brand_assets`**: Digital asset warehouse table (`marketing_kit`, `product_catalog_pdf`, `high_res_image`, `video`, `spec_sheet`, `price_list`) with `allowed_roles` filtering.
5. **`products`**: Catalog items with multi-tier pricing (`min_price`, `max_price`, `dealer_price`, `distributor_price`, `stock_qty`).
6. **`orders`**: Stage-1 workflow orders (`order_number`, `brand_id`, `placed_by_user_id`, `total_amount`, `status`, `stage1_approved_by`, `stage1_remarks`).
7. **`order_items`**: Line items linked to orders with locked unit prices and subtotals.

---

## 4. Gmail Custom SMTP Setup Guide

To send all system emails (account verification, password reset, KYC approval, Stage-1 order reviews) strictly through your Google Workspace / Gmail account:

### Step 1: Generate a 16-Character Google App Password
1. Navigate to [Google Account Security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Under "2-Step Verification", select **App passwords** (or search "App passwords" in the search box).
4. Enter an app name e.g., `Nexus B2B System` and click **Create**.
5. Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).

### Step 2: Configure Supabase Auth SMTP
1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Project Settings > Authentication > SMTP Settings**.
2. Toggle **Enable Custom SMTP** to `ON`.
3. Configure the fields:
   - **Sender Email:** `your-business-email@gmail.com`
   - **Sender Name:** `NEXUS B2B Partner Portal`
   - **Host:** `smtp.gmail.com`
   - **Port:** `465` (SSL) or `587` (TLS)
   - **Username:** `your-business-email@gmail.com`
   - **Password:** `<16-character Google App Password>`
4. Click **Save Changes**. Supabase Auth will now route signup verifications and password reset emails through your Gmail account.

### Step 3: Configure Edge Function Secrets
For transactional emails (KYC approvals, Stage-1 order notifications), set the secrets in your Supabase CLI or project dashboard:
```bash
supabase secrets set GMAIL_SMTP_USER="your-business-email@gmail.com"
supabase secrets set GMAIL_SMTP_APP_PASSWORD="abcd efgh ijkl mnop"
supabase secrets set GMAIL_SMTP_HOST="smtp.gmail.com"
supabase secrets set GMAIL_SMTP_PORT="465"
supabase secrets set GMAIL_SENDER_NAME="NEXUS B2B Enterprise"
supabase secrets set ADMIN_ALERT_EMAIL="admin@yourbusiness.com"
```

### Step 4: Deploy the Edge Functions
```bash
supabase functions deploy send-transactional-email --no-verify-jwt
supabase functions deploy order-stage-notifier --no-verify-jwt
```

---

## 5. Core Operational Workflows

### A. Onboarding & KYC Approval Gate
1. **Self-Registration:** Partner registers at `/(auth)/register`, providing company details, requested role (Dealer/Distributor), and requested brand access.
2. **KYC Upload:** Mandatory 4-document upload (`/(auth)/kyc-upload`) stored in private Supabase Storage bucket `kyc-documents/{user_id}/`.
3. **Pending Gate:** Partner is placed in `pending_approval` status (`/(auth)/pending-approval`).
4. **Admin Review:** Super Admin logs into `/(app)/admin/kyc-verification`, inspects documents via signed URLs, selects authorized brands, and clicks **Approve Account** or **Reject** with remarks.
5. **Notification:** Gmail SMTP dispatches an automated approval welcome email.

### B. Multi-Brand Data Warehouse
1. Assets are organized by **Brand** and **Category** (Marketing Kits, Spec Sheets, Videos, Hi-Res Images).
2. Strict brand isolation ensures partners only see assets matching their assigned brands and role permissions.
3. Downloads are served via secure time-limited **Signed URLs** from Supabase Storage.

### C. Product Catalog & Tiered Pricing
1. **Distributors** automatically see wholesale distributor-tier pricing.
2. **Dealers** see dealer partner-tier pricing.
3. **Super Admin / Management** can inspect full MSRP ranges and edit prices.
4. Integrated search by SKU, keywords, and category.

### D. B2B Cart & Stage-1 Order Approval System
1. **Cart & Submit:** Approved Dealers & Distributors add products and click **Submit Order for Stage-1 Approval**.
2. **Stage 1 (Pending Approval):** Order enters `pending_approval` status, and an email alert is sent to Management.
3. **Stage 2 (Management Review):** Super Admin or Management reviews stock, credit limits, and quantities in `/(app)/orders/approval`, then clicks **Approve** or **Reject** (with audit remarks).
4. **Stage 3 (Fulfillment):** Approved order advances to `confirmed`, then `dispatched` (with tracking number), and `delivered`, notifying the ordering partner via Gmail SMTP at each stage.

---

## 6. Build & Deployment Manual

### A. Universal Web Deployment (Vercel / Netlify)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Export the static web bundle:
   ```bash
   npm run build:web
   ```
   This generates an optimized static export in the `dist/` folder.
3. Deploy to **Vercel**:
   ```bash
   npx vercel --prod
   ```
   Set environment variables in Vercel:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### B. Android Build (APK & Play Store AAB via EAS)
1. Install the EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Build standalone APK for internal distribution/testing:
   ```bash
   eas build --platform android --profile preview
   ```
4. Build Google Play Store Production App Bundle (`.aab`):
   ```bash
   eas build --platform android --profile production
   ```

### C. iOS Build (IPA & TestFlight via EAS)
1. Configure iOS credentials (Apple Developer Account required):
   ```bash
   eas credentials
   ```
2. Build internal test IPA:
   ```bash
   eas build --platform ios --profile preview
   ```
3. Build Production IPA for App Store / TestFlight submission:
   ```bash
   eas build --platform ios --profile production
   ```
