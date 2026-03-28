import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Diviner Media LMS <onboarding@resend.dev>';

export async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Reset your Diviner Media LMS password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to set a new one.</p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;">Diviner Media Intern Training Portal</p>
      </div>
    `,
  });
}

export async function sendInviteEmail(toEmail, inviteToken) {
  const registerUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register/${inviteToken}`;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "You're invited to Diviner Media LMS",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Welcome to Diviner Media</h2>
        <p>You've been invited to join the <strong>Diviner Media Intern Training Portal</strong>.</p>
        <p>Click the button below to create your account. This invite expires in <strong>7 days</strong>.</p>
        <a href="${registerUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Accept Invite
        </a>
        <p style="color:#888;font-size:13px;">If you weren't expecting this, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;">Diviner Media Intern Training Portal</p>
      </div>
    `,
  });
}
