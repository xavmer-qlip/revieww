# Templates email Supabase — woopla

> Copier-coller le HTML dans Supabase > Authentication > Email Templates
> Chaque section = un onglet dans Supabase
>
> Variables disponibles :
> `{{ .ConfirmationURL }}` `{{ .Token }}` `{{ .TokenHash }}` `{{ .SiteURL }}` `{{ .Email }}` `{{ .Data }}` `{{ .RedirectTo }}`

---

## 1. Confirm sign up

**Subject:** `Confirmez votre compte woopla`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Bienvenue !
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    Confirmez votre adresse <strong style="color:#1A1A2E;">{{ .Email }}</strong> pour activer votre compte.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:#F88379;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:bold;">
      Confirmer mon compte
    </a>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous n'avez pas cree de compte sur woopla, ignorez cet email.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```

---

## 2. Invite user

**Subject:** `Vous etes invite sur woopla`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Vous etes invite !
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    On vous a invite a rejoindre woopla avec l'adresse <strong style="color:#1A1A2E;">{{ .Email }}</strong>. Cliquez ci-dessous pour creer votre compte.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:#F88379;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:bold;">
      Accepter l'invitation
    </a>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous ne connaissez pas woopla, ignorez cet email.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```

---

## 3. Magic link

**Subject:** `Votre lien de connexion woopla`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Votre lien de connexion
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    Connexion demandee pour <strong style="color:#1A1A2E;">{{ .Email }}</strong>. Ce lien expire dans 1 heure.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:#F88379;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:bold;">
      Se connecter
    </a>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous n'avez pas demande ce lien, ignorez cet email. Votre compte est en securite.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```

---

## 4. Change email address

**Subject:** `Confirmez votre nouvelle adresse email`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Changement d'email
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    Confirmez le changement vers <strong style="color:#1A1A2E;">{{ .NewEmail }}</strong>.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:#F88379;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:bold;">
      Confirmer le changement
    </a>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous n'avez pas demande ce changement, securisez votre compte immediatement.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```

---

## 5. Reset password

**Subject:** `Reinitialiser votre mot de passe woopla`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Mot de passe oublie ?
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    Demande de reinitialisation pour <strong style="color:#1A1A2E;">{{ .Email }}</strong>. Ce lien expire dans 1 heure.
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 32px;background:#F88379;color:white;text-decoration:none;border-radius:12px;font-size:15px;font-weight:bold;">
      Nouveau mot de passe
    </a>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne changera pas.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```

---

## 6. Reauthentication

**Subject:** `Code de verification woopla`

```html
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:800;color:#1A1A2E;letter-spacing:-0.5px;">woopla</span>
  </div>
  <h1 style="font-size:22px;font-weight:bold;text-align:center;color:#1A1A2E;margin:0 0 8px;">
    Verification requise
  </h1>
  <p style="font-size:15px;text-align:center;color:#6b7280;margin:0 0 24px;line-height:1.5;">
    Entrez ce code pour confirmer votre identite (<strong style="color:#1A1A2E;">{{ .Email }}</strong>).
  </p>
  <div style="text-align:center;margin:24px 0;">
    <div style="display:inline-block;padding:16px 40px;background:#f3f4f6;border:2px solid #e5e7eb;border-radius:12px;">
      <span style="font-size:32px;font-weight:bold;color:#1A1A2E;letter-spacing:6px;">{{ .Token }}</span>
    </div>
  </div>
  <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;line-height:1.5;">
    Si vous n'avez pas initie cette action, securisez votre compte immediatement.
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    Envoye par <a href="{{ .SiteURL }}" style="color:#F88379;text-decoration:none;">woopla.ch</a>
  </p>
</div>
```
