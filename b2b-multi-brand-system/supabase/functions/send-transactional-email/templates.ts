// Professional HTML Email Templates for B2B Multi-Brand Warehouse & Order System

export type EmailType =
  | 'ACCOUNT_VERIFICATION'
  | 'KYC_SUBMITTED_ADMIN_ALERT'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'ORDER_SUBMITTED_STAGE1_ALERT'
  | 'ORDER_STAGE1_APPROVED'
  | 'ORDER_STAGE1_REJECTED'
  | 'ORDER_DISPATCHED'
  | 'PASSWORD_RESET';

export interface EmailPayload {
  to: string;
  type: EmailType;
  recipientName: string;
  data: Record<string, any>;
}

export function generateEmailHtml(payload: EmailPayload): { subject: string; html: string } {
  const brandPrimaryColor = '#0f172a';
  const brandAccentColor = '#16a34a';

  const baseHeader = `
    <div style="background-color: ${brandPrimaryColor}; padding: 28px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; letter-spacing: 0.5px;">
        B2B Multi-Brand Enterprise Network
      </h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Data Warehouse & Unified B2B Order Management</p>
    </div>
  `;

  const baseFooter = `
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px 0;">This is an automated notification from your B2B Partner Portal.</p>
      <p style="margin: 0;">Secured with end-to-end Row-Level Security & Role-Based Access Control.</p>
    </div>
  `;

  let subject = '';
  let content = '';

  switch (payload.type) {
    case 'ACCOUNT_VERIFICATION':
      subject = 'Verify Your B2B Partner Account';
      content = `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Welcome, ${payload.recipientName}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your registration request for role <strong>${payload.data.role?.toUpperCase()}</strong> has been initiated.
          Please verify your email address to proceed to KYC verification:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payload.data.verificationUrl}" style="background-color: ${brandAccentColor}; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
      `;
      break;

    case 'KYC_SUBMITTED_ADMIN_ALERT':
      subject = `[Action Required] New KYC Submission: ${payload.data.companyName || payload.recipientName}`;
      content = `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Pending KYC Verification Alert</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          A new user <strong>${payload.recipientName}</strong> (${payload.data.email}) from <strong>${payload.data.companyName || 'N/A'}</strong>
          has submitted their business KYC documents for the role of <strong>${payload.data.role?.toUpperCase()}</strong>.
        </p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #334155;">
          <p style="margin: 0 0 6px 0;"><strong>Requested Brands:</strong> ${payload.data.brands || 'All Requested'}</p>
          <p style="margin: 0;"><strong>Document Count:</strong> ${payload.data.docCount || 1}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.data.dashboardUrl || '#'}" style="background-color: ${brandPrimaryColor}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Review in Admin Dashboard
          </a>
        </div>
      `;
      break;

    case 'KYC_APPROVED':
      subject = 'Congratulations! Your B2B Partner Account is Approved';
      content = `
        <h2 style="color: #15803d; font-size: 18px; margin-top: 0;">KYC & Account Approved</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Dear ${payload.recipientName}, your business verification documents have been verified and your account is now fully active.
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #166534;">
          <p style="margin: 0 0 6px 0;"><strong>Assigned Role:</strong> ${payload.data.role?.toUpperCase()}</p>
          <p style="margin: 0;"><strong>Active Brand Access:</strong> ${payload.data.brands || 'Authorized Brands'}</p>
        </div>
        <p style="color: #475569; font-size: 14px;">You can now log in to view brand assets, access tiered product pricing, and place B2B orders.</p>
        <div style="text-align: center; margin: 26px 0;">
          <a href="${payload.data.loginUrl || '#'}" style="background-color: ${brandAccentColor}; color: #ffffff; padding: 12px 26px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Partner Portal
          </a>
        </div>
      `;
      break;

    case 'KYC_REJECTED':
      subject = 'Action Needed: Update Regarding Your KYC Submission';
      content = `
        <h2 style="color: #b91c1c; font-size: 18px; margin-top: 0;">KYC Verification Update</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Dear ${payload.recipientName}, your submitted KYC documentation could not be approved at this time.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #991b1b;">
          <strong>Super Admin Remarks:</strong>
          <p style="margin: 6px 0 0 0;">${payload.data.rejectionReason || 'Documents illegible or GST number mismatch. Please upload a clear copy.'}</p>
        </div>
        <p style="color: #475569; font-size: 14px;">Please re-upload your valid credentials to proceed.</p>
      `;
      break;

    case 'ORDER_SUBMITTED_STAGE1_ALERT':
      subject = `[New Order Review] ${payload.data.orderNumber} - ${payload.data.brandName}`;
      content = `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Stage-1 Approval Required</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          A new B2B order has been placed and requires Stage-1 review:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Order Number:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">${payload.data.orderNumber}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Brand:</td><td style="padding: 8px 0; font-weight: 600;">${payload.data.brandName}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Partner:</td><td style="padding: 8px 0;">${payload.recipientName} (${payload.data.role?.toUpperCase()})</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Total Value:</td><td style="padding: 8px 0; font-weight: bold; color: #16a34a;">$${Number(payload.data.totalAmount).toFixed(2)}</td></tr>
        </table>
        <div style="text-align: center; margin: 26px 0;">
          <a href="${payload.data.approvalUrl || '#'}" style="background-color: ${brandPrimaryColor}; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Open Stage-1 Review Console
          </a>
        </div>
      `;
      break;

    case 'ORDER_STAGE1_APPROVED':
      subject = `Order Approved (Stage-1): ${payload.data.orderNumber}`;
      content = `
        <h2 style="color: #15803d; font-size: 18px; margin-top: 0;">Order Stage-1 Approved</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your order <strong>${payload.data.orderNumber}</strong> for <strong>${payload.data.brandName}</strong>
          has passed Stage-1 management review and has moved to fulfillment booking.
        </p>
        <p style="color: #64748b; font-size: 13px;">Reviewer remarks: <em>"${payload.data.remarks || 'Approved for invoicing and warehouse packing.'}"</em></p>
      `;
      break;

    case 'ORDER_STAGE1_REJECTED':
      subject = `Update Regarding Order ${payload.data.orderNumber}`;
      content = `
        <h2 style="color: #b91c1c; font-size: 18px; margin-top: 0;">Order Not Approved</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your order <strong>${payload.data.orderNumber}</strong> could not be approved at this time.
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 6px; margin: 18px 0; font-size: 13px; color: #991b1b;">
          <strong>Management Reason:</strong>
          <p style="margin: 4px 0 0 0;">${payload.data.remarks || 'Credit limit exceeded or stock replenishment pending.'}</p>
        </div>
      `;
      break;

    case 'ORDER_DISPATCHED':
      subject = `Your Order ${payload.data.orderNumber} Has Been Dispatched!`;
      content = `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Shipment Dispatched</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Items for order <strong>${payload.data.orderNumber}</strong> are on their way to your registered facility.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Courier / Carrier:</strong> ${payload.data.carrier || 'Express Logistics'}</p>
          <p style="margin: 0;"><strong>Tracking Number:</strong> <span style="font-family: monospace; font-weight: bold;">${payload.data.trackingNumber}</span></p>
        </div>
      `;
      break;

    case 'PASSWORD_RESET':
      subject = 'Reset Your B2B Partner Portal Password';
      content = `
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Click the link below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payload.data.resetUrl}" style="background-color: ${brandPrimaryColor}; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      `;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 30px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); overflow: hidden;">
          ${baseHeader}
          <div style="padding: 32px 28px;">
            ${content}
          </div>
          ${baseFooter}
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}
