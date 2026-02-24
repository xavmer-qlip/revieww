import { getResend } from '@/lib/resend';
import { APP_URL } from '@/lib/constants';

interface PrizeWonEmailParams {
  to: string;
  businessName: string;
  prizeEmoji: string;
  prizeLabel: string;
  promoCode?: string | null;
  validationCode?: string | null;
}

export async function sendPrizeWonEmail({
  to,
  businessName,
  prizeEmoji,
  prizeLabel,
  promoCode,
  validationCode,
}: PrizeWonEmailParams) {
  const resend = getResend();

  const promoSection = promoCode
    ? `<div style="background:#f0fdf4;border:2px dashed #10B981;border-radius:12px;padding:16px;text-align:center;margin-top:16px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">Votre code promo</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#10B981;letter-spacing:2px;">${promoCode}</p>
      </div>`
    : '';

  const validationSection = validationCode
    ? `<div style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:12px;padding:16px;text-align:center;margin-top:16px;">
        <p style="margin:0;font-size:12px;color:#6b7280;">Code de validation</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:bold;color:#1D4ED8;letter-spacing:3px;">${validationCode}</p>
        <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">Presentez ce code en caisse &middot; Valable 7 jours</p>
        <a href="${APP_URL}/validate/${validationCode}" style="display:inline-block;margin-top:12px;padding:8px 20px;background:#3B82F6;color:white;text-decoration:none;border-radius:8px;font-size:13px;font-weight:bold;">Voir mon lot</a>
      </div>`
    : '';

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:48px;">${prizeEmoji}</span>
      </div>
      <h1 style="font-size:24px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
        Felicitations !
      </h1>
      <p style="font-size:16px;text-align:center;color:#6b7280;margin:0 0 24px;">
        Merci pour votre avis chez <strong style="color:#1A1A2E;">${businessName}</strong>
      </p>
      <div style="background:#FFF7ED;border:1px solid #FF6B35;border-radius:16px;padding:24px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Vous avez gagne</p>
        <p style="margin:8px 0 0;font-size:22px;font-weight:bold;color:#FF6B35;">
          ${prizeEmoji} ${prizeLabel}
        </p>
      </div>
      ${promoSection}
      ${validationSection}
      <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:24px;">
        Presentez ce code en caisse pour recuperer votre cadeau.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:11px;color:#9ca3af;text-align:center;">
        Envoye par <a href="https://revieww.ch" style="color:#FF6B35;text-decoration:none;">revieww.ch</a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: `${businessName} via revieww <hello@revieww.ch>`,
      to,
      subject: `${prizeEmoji} Votre cadeau chez ${businessName}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send prize email:', error);
  }
}
