// Supabase Edge Function: order-stage-notifier
// Triggered by Database Webhooks on orders insert or update
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_ALERT_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") || Deno.env.get("GMAIL_SMTP_USER");

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (type === "INSERT") {
      // Fetch details about user and brand
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email, company_name, role")
        .eq("id", record.placed_by_user_id)
        .single();

      const { data: brand } = await supabase
        .from("brands")
        .select("name")
        .eq("id", record.brand_id)
        .single();

      // Trigger Stage-1 admin notification email
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          to: ADMIN_ALERT_EMAIL,
          type: "ORDER_SUBMITTED_STAGE1_ALERT",
          recipientName: userProfile?.company_name || userProfile?.full_name || "Partner",
          data: {
            orderNumber: record.order_number,
            brandName: brand?.name || "B2B Brand",
            role: userProfile?.role,
            totalAmount: record.total_amount,
            approvalUrl: `${SUPABASE_URL}/admin/orders/approval`,
          },
        },
      });
    } else if (type === "UPDATE" && record.status !== old_record?.status) {
      // Order status has changed
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", record.placed_by_user_id)
        .single();

      const { data: brand } = await supabase
        .from("brands")
        .select("name")
        .eq("id", record.brand_id)
        .single();

      if (!userProfile?.email) {
        return new Response(JSON.stringify({ skipped: "No user email found" }), { status: 200 });
      }

      if (record.status === "stage1_approved") {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            to: userProfile.email,
            type: "ORDER_STAGE1_APPROVED",
            recipientName: userProfile.full_name,
            data: {
              orderNumber: record.order_number,
              brandName: brand?.name || "B2B Brand",
              remarks: record.stage1_remarks,
            },
          },
        });
      } else if (record.status === "rejected") {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            to: userProfile.email,
            type: "ORDER_STAGE1_REJECTED",
            recipientName: userProfile.full_name,
            data: {
              orderNumber: record.order_number,
              remarks: record.stage1_remarks,
            },
          },
        });
      } else if (record.status === "dispatched") {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            to: userProfile.email,
            type: "ORDER_DISPATCHED",
            recipientName: userProfile.full_name,
            data: {
              orderNumber: record.order_number,
              trackingNumber: record.tracking_number || "TRK-LOCAL-EXP",
            },
          },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
