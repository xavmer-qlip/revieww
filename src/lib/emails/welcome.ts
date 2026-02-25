import { getResend, EMAIL_FROM } from '@/lib/resend';

interface WelcomeEmailParams {
  to: string;
  businessName: string;
}

export async function sendWelcomeEmail({
  to,
  businessName,
}: WelcomeEmailParams) {
  const resend = getResend();

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">🎉</span>
      </div>
      <h1 style="font-size:24px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
        Bienvenue sur woopla !
      </h1>
      <p style="font-size:16px;text-align:center;color:#6b7280;margin:0 0 24px;">
        <strong style="color:#1A1A2E;">${businessName}</strong> est pret a animer votre commerce
      </p>
      <div style="background:#f8f9fa;border-radius:16px;padding:24px;">
        <h2 style="font-size:16px;font-weight:bold;color:#1A1A2E;margin:0 0 16px;">
          Prochaines etapes
        </h2>
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-size:14px;"><strong>1.</strong> Telechargez votre QR code depuis le dashboard</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-size:14px;"><strong>2.</strong> Placez-le sur vos tables ou au comptoir</p>
        </div>
        <div>
          <p style="margin:0;font-size:14px;"><strong>3.</strong> Lancez votre première animation !</p>
        </div>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://woopla.ch/dashboard" style="display:inline-block;background:#FF6B35;color:white;font-weight:bold;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:14px;">
          Acceder au dashboard
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">
        Votre essai gratuit de 7 jours a commence. Profitez-en !
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:11px;color:#9ca3af;text-align:center;">
        <a href="https://woopla.ch" style="color:#FF6B35;text-decoration:none;">woopla.ch</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🎉 Bienvenue sur woopla, ${businessName} !`,
      html,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
