import { getResend, EMAIL_FROM } from '@/lib/resend';

interface TrialExpiringEmailParams {
  to: string;
  businessName: string;
  daysLeft: number;
}

export async function sendTrialExpiringEmail({
  to,
  businessName,
  daysLeft,
}: TrialExpiringEmailParams) {
  const resend = getResend();

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">⏰</span>
      </div>
      <h1 style="font-size:24px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
        Votre essai se termine bientot
      </h1>
      <p style="font-size:16px;text-align:center;color:#6b7280;margin:0 0 24px;">
        Il reste <strong style="color:#FF6B35;">${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> d&apos;essai pour <strong style="color:#1A1A2E;">${businessName}</strong>
      </p>
      <div style="background:#FFF7ED;border:1px solid #FFEDD5;border-radius:16px;padding:24px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#6b7280;">
          Pour continuer a animer votre commerce et faire tourner la roue, choisissez un plan.
        </p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://revieww.ch/dashboard/billing" style="display:inline-block;background:#FF6B35;color:white;font-weight:bold;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:14px;">
          Choisir mon plan
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:11px;color:#9ca3af;text-align:center;">
        <a href="https://revieww.ch" style="color:#FF6B35;text-decoration:none;">revieww.ch</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `⏰ Votre essai revieww se termine dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send trial expiring email:', error);
  }
}
