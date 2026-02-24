# revieww — Checklist de test E2E

## Personas de test

### Persona 1 : Marie (Commercante)
- **Email** : `marie.test@revieww.ch`
- **Mot de passe** : `Test1234!`
- **Commerce** : Cafe du Marche
- **Role** : Proprietaire, gere le dashboard, valide les lots

### Persona 2 : Lucas (Client)
- **Email** : `lucas.test@revieww.ch`
- **Role** : Client qui scanne le QR, laisse un avis, tourne la roue

### Persona 3 : Sophie (2eme commercante)
- **Email** : `sophie.test@revieww.ch`
- **Mot de passe** : `Test1234!`
- **Commerce** : Boulangerie du Lac
- **Role** : Teste l'isolation entre commerces (ne doit pas pouvoir valider les lots de Marie)

---

## 1. Inscription + Onboarding

### 1.1 Inscription Marie
- [ ] Aller sur `/signup`
- [ ] Remplir : "Cafe du Marche", `marie.test@revieww.ch`, `Test1234!`
- [ ] Accepter les CGU, cliquer "Creer mon compte"
- [ ] **Attendu** : Ecran "Verifiez votre email" avec l'adresse affichee
- [ ] Verifier l'email de confirmation recu
- [ ] **Attendu** : Le bouton dans l'email redirige vers `{APP_URL}/auth/callback?next=/onboarding` (PAS localhost)
- [ ] Cliquer le lien de confirmation
- [ ] **Attendu** : Redirection vers `/onboarding` avec session active

### 1.2 Onboarding
- [ ] Etape 1 : Rechercher "Cafe du Marche" dans Google Places (ou mode manuel)
- [ ] Selectionner le commerce, verifier que le lien Google Review est configure
- [ ] Cliquer "Suivant"
- [ ] Etape 2 : Selectionner au moins 3 lots (ex: Cafe offert, -10%, Perdu, Dessert offert, Pas de chance)
- [ ] Cliquer "Terminer"
- [ ] **Attendu** : Redirection vers `/dashboard`

### 1.3 Inscription deja existante
- [ ] Re-tenter signup avec `marie.test@revieww.ch`
- [ ] **Attendu** : "Cette adresse email est deja utilisee. Essayez de vous connecter."

---

## 2. Dashboard merchant

### 2.1 Vue d'ensemble
- [ ] `/dashboard` affiche les stats (0 spins, 0 contacts)
- [ ] Sidebar navigation fonctionne

### 2.2 QR Code
- [ ] `/dashboard/qrcode` genere un QR code
- [ ] Le QR pointe vers `/play/{slug}` ou `play.revieww.ch/{slug}`

### 2.3 Configuration roue
- [ ] `/dashboard/wheel` affiche les segments configures
- [ ] Modifier un segment, sauvegarder
- [ ] **Attendu** : Modification persistee

---

## 3. Flow client (play)

### 3.1 Page play
- [ ] Aller sur `/play/{slug}` (slug du Cafe du Marche)
- [ ] **Attendu** : Page d'accueil avec logo/nom du commerce, bouton "Laisser un avis Google"

### 3.2 Laisser un avis
- [ ] Cliquer "Laisser un avis Google"
- [ ] **Attendu** : Ouverture de Google Review dans un nouvel onglet
- [ ] Revenir sur la page apres >15 secondes
- [ ] **Attendu** : Page verification etoiles

### 3.3 Selection etoiles + email
- [ ] Selectionner 5 etoiles, cliquer "J'ai laisse mon avis"
- [ ] Entrer `lucas.test@revieww.ch`, cocher opt-in, cliquer "Tourner la roue"
- [ ] **Attendu** : Animation de la roue

### 3.4 Resultat + code de validation
- [ ] **Si gagnant** :
  - [ ] Affiche le lot gagne avec emoji
  - [ ] Affiche un code **RW-XXXX** en gros
  - [ ] Affiche un QR code scannable
  - [ ] Le QR code pointe vers `/validate/RW-XXXX`
  - [ ] Texte "Presentez ce code en caisse"
  - [ ] "Valable 7 jours"
- [ ] **Si perdant** :
  - [ ] Affiche "Pas de chance cette fois !"
  - [ ] Pas de code de validation

### 3.5 Anti-triche
- [ ] Recharger `/play/{slug}`
- [ ] **Attendu** : "Vous avez deja participe recemment !"

### 3.6 Email de lot
- [ ] Verifier que `lucas.test@revieww.ch` a recu un email
- [ ] **Attendu** : Email contient le lot, le code RW-XXXX, un bouton "Voir mon lot"
- [ ] Le bouton pointe vers `/validate/RW-XXXX` (PAS localhost)

---

## 4. Validation du lot

### 4.1 Page validation (non connecte)
- [ ] Aller sur `/validate/RW-XXXX` (sans etre connecte)
- [ ] **Attendu** : Affiche le lot, l'email, la date
- [ ] **Attendu** : Bouton "Se connecter" (pas de bouton "Marquer comme reclame")

### 4.2 Login depuis validation
- [ ] Cliquer "Se connecter"
- [ ] **Attendu** : Redirection vers `/login?redirect=/validate/RW-XXXX`
- [ ] Se connecter avec `marie.test@revieww.ch`
- [ ] **Attendu** : Redirection vers `/validate/RW-XXXX`

### 4.3 Validation par proprietaire
- [ ] Marie est connectee, page `/validate/RW-XXXX`
- [ ] **Attendu** : Bouton "Marquer comme reclame" visible
- [ ] Cliquer "Marquer comme reclame"
- [ ] **Attendu** : Succes, affiche "Lot deja reclame" avec date

### 4.4 Double validation
- [ ] Recharger `/validate/RW-XXXX`
- [ ] **Attendu** : Affiche "Lot deja reclame" avec date, pas de bouton

### 4.5 Validation par mauvais proprietaire
- [ ] Se connecter avec `sophie.test@revieww.ch`
- [ ] Aller sur `/validate/RW-XXXX` (lot du Cafe du Marche)
- [ ] **Attendu** : "Vous n'etes pas le proprietaire de ce commerce"

### 4.6 Code invalide
- [ ] Aller sur `/validate/RW-ZZZZ` (code inexistant)
- [ ] **Attendu** : "Code introuvable"

### 4.7 Lot expire
- [ ] (Manuellement) Modifier `created_at` d'un spin a -8 jours dans Supabase
- [ ] Aller sur `/validate/RW-XXXX`
- [ ] **Attendu** : "Ce lot a expire"

---

## 5. Dashboard — clients table

### 5.1 Colonne code
- [ ] Aller sur `/dashboard/clients`
- [ ] **Attendu** : Colonne "Code" dans le tableau
- [ ] Le code RW-XXXX de Lucas est affiche
- [ ] Le toggle "Reclame" est ON pour le lot valide

### 5.2 Export CSV
- [ ] Cliquer "Export CSV"
- [ ] **Attendu** : Le CSV contient la colonne "Code" avec les RW-XXXX

---

## 6. Configuration Supabase (manuelle)

> Ces etapes doivent etre faites dans le dashboard Supabase :

- [ ] **Site URL** : `https://www.revieww.ch` (pas localhost)
- [ ] **Redirect URLs** : ajouter `https://www.revieww.ch/auth/callback`
- [ ] **Email templates** : verifier que les liens de confirmation utilisent `{{ .SiteURL }}`

---

## 7. Regression tests

- [ ] Landing page `/` charge correctement
- [ ] Login/logout fonctionne
- [ ] Dashboard charge avec donnees
- [ ] `npm run build` passe sans erreur
