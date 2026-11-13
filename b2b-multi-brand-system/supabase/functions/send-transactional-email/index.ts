// Supabase Edge Function: send-transactional-email
// Uses Gmail Custom SMTP with Google App Password
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";
import { generateEmailHtml, EmailPayload } from "./templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: 'to' or 'type'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpUser = Deno.env.get("GMAIL_SMTP_USER");
    const smtpPass = Deno.env.get("GMAIL_SMTP_APP_PASSWORD");
    const smtpHost = Deno.env.get("GMAIL_SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = Number(Deno.env.get("GMAIL_SMTP_PORT") || 465);
    const senderName = Deno.env.get("GMAIL_SENDER_NAME") || "B2B Enterprise Portal";

    if (!smtpUser || !smtpPass) {
      console.error("Gmail SMTP credentials are not configured in environment variables.");
      return new Response(
        JSON.stringify({
          error: "Gmail SMTP not configured. Please set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure Nodemailer with Gmail SMTP credentials
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass, // 16-character Google App Password
      },
    });

    // Build template HTML and subject
    const { subject, html } = generateEmailHtml(payload);

    // Send Mail
    const info = await transporter.sendMail({
      from: `"${senderName}" <${smtpUser}>`,
      to: payload.to,
      subject: subject,
      html: html,
    });

    console.log(`Email sent successfully to ${payload.to}. MessageId: ${info.messageId}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        recipient: payload.to,
        type: payload.type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending email via Gmail SMTP:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
