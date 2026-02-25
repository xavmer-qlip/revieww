import { getResend, EMAIL_FROM } from '@/lib/resend';

interface VerifyEmailParams {
  to: string;
  businessName: string;
  verificationLink: string;
}

export async function sendVerificationEmail({
  to,
  businessName,
  verificationLink,
}: VerifyEmailParams) {
  const resend = getResend();

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">✉️</span>
      </div>
      <h1 style="font-size:24px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
        Confirmez votre email
      </h1>
      <p style="font-size:16px;text-align:center;color:#6b7280;margin:0 0 24px;">
        Activez la page de <strong style="color:#1A1A2E;">${businessName}</strong> en un clic
      </p>
      <div style="background:#f8f9fa;border-radius:16px;padding:24px;text-align:center;">
        <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">
          Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre roue de la fortune.
        </p>
        <a href="${verificationLink}" style="display:inline-block;background:#FF6B35;color:white;font-weight:bold;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:15px;">
          Vérifier mon email
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size:12px;color:#9ca3af;text-align:center;word-break:break-all;">
        <a href="${verificationLink}" style="color:#FF6B35;text-decoration:none;">${verificationLink}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:11px;color:#9ca3af;text-align:center;">
        <a href="https://woopla.ch" style="color:#FF6B35;text-decoration:none;">woopla.ch</a>
      </p>
    </div>
  `;

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `✉️ Confirmez votre email — ${businessName}`,
    html,
  });
}
