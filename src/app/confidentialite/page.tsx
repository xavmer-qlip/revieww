import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata = {
  title: 'Politique de confidentialité — woopla',
  description: 'Politique de confidentialité de woopla.ch — qlip sàrl, Genève',
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-center pt-8 pb-4">
        <Link href="/"><Logo size="md" animate /></Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-3xl font-display font-bold text-text mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm font-body text-text-muted mb-8">
          Dernière mise à jour : 25 février 2026 — Version 1.0
        </p>

        <div className="font-body text-text-muted space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">1. Responsable du traitement</h2>
            <p className="mb-2">
              <strong className="text-text">qlip sàrl</strong><br />
              Rue du Grand-Bureau 11, 1227 Les Acacias, Suisse<br />
              Email : <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a>
            </p>
            <p>
              Pour les données des participants collectées via le Service pour le compte d&apos;un
              commerçant, celui-ci agit comme responsable du traitement et qlip sàrl comme sous-traitant
              (art. 9 LPD). Pour les données des comptes commerçants, qlip sàrl est responsable.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">2. Données collectées</h2>
            <p className="mb-2">Selon l&apos;utilisation, nous pouvons traiter :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text">Commerçants :</strong> nom, email, mot de passe (hashé), nom du commerce, adresse, téléphone, liens réseaux sociaux, logo, données de facturation (via Stripe).</li>
              <li><strong className="text-text">Participants (clients finaux) :</strong> email (obligatoire), téléphone (optionnel), date/heure de participation, lot attribué, code de validation, statut de remise.</li>
              <li><strong className="text-text">Données techniques :</strong> logs de sécurité (identifiants de session, actions de validation), données de navigation (via cookies nécessaires).</li>
              <li><strong className="text-text">Consentements :</strong> horodatage, version, préférences marketing.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">3. Finalités du traitement</h2>
            <p className="mb-2">Nous traitons vos données pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text">A) Fourniture du Service :</strong> gestion des comptes, configuration des animations, attribution des lots, envoi des emails transactionnels (code de validation, confirmation).</li>
              <li><strong className="text-text">B) Gestion de la participation :</strong> inscription au jeu, attribution du lot, notification, remise et validation.</li>
              <li><strong className="text-text">C) Sécurité et anti-fraude :</strong> journalisation des événements, contrôle d&apos;abus, détection de multi-participations, audit trail.</li>
              <li><strong className="text-text">D) Marketing (opt-in uniquement) :</strong> envoi d&apos;offres et nouveautés du commerçant, uniquement si le participant a coché l&apos;option dédiée (non pré-cochée).</li>
              <li><strong className="text-text">E) Statistiques :</strong> mesures d&apos;utilisation agrégées pour améliorer le Service.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">4. Consentement et marketing</h2>
            <p className="mb-2">
              <strong className="text-text">Participation.</strong> La participation au jeu nécessite
              le traitement des données pour les finalités A, B et C.
            </p>
            <p className="mb-2">
              <strong className="text-text">Marketing.</strong> Le marketing par email est optionnel et
              soumis à consentement explicite (opt-in, case non pré-cochée), conformément aux
              recommandations du PFPDT. Vous pouvez retirer votre consentement à tout moment via le
              lien de désinscription présent dans chaque email. L&apos;expéditeur est clairement identifié
              dans chaque communication.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">5. Destinataires</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text">Commerçant concerné :</strong> accès aux données de ses participants uniquement (besoin d&apos;en connaître).</li>
              <li><strong className="text-text">Sous-traitants techniques :</strong> hébergement (Supabase/AWS), emails transactionnels (Resend), paiements (Stripe), déploiement (Vercel). Ces prestataires sont soumis à des contrats et mesures de sécurité.</li>
              <li>Nous ne vendons ni ne louons vos données à des tiers.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">6. Transferts à l&apos;étranger</h2>
            <p>
              Certains sous-traitants peuvent traiter des données en dehors de la Suisse (notamment aux
              États-Unis). Dans ce cas, des garanties appropriées sont mises en place (clauses contractuelles
              types, certifications). La liste des pays ayant un niveau de protection adéquat est celle
              de l&apos;Annexe 1 OPDo.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">7. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text">Données de participation :</strong> 12 mois après la fin du jeu, puis suppression ou anonymisation.</li>
              <li><strong className="text-text">Données de validation (anti-fraude) :</strong> 12 mois.</li>
              <li><strong className="text-text">Marketing :</strong> jusqu&apos;au retrait du consentement + 3 mois de preuve du consentement.</li>
              <li><strong className="text-text">Logs de sécurité :</strong> 12 mois.</li>
              <li><strong className="text-text">Données du compte commerçant :</strong> durée du contrat + 30 jours après résiliation, sauf obligations légales de conservation (comptabilité : 10 ans).</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">8. Vos droits</h2>
            <p className="mb-2">
              Conformément à la LPD révisée, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li><strong className="text-text">Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles.</li>
              <li><strong className="text-text">Droit de rectification :</strong> corriger des données inexactes.</li>
              <li><strong className="text-text">Droit de suppression :</strong> demander l&apos;effacement de vos données (sous réserve d&apos;obligations légales de conservation).</li>
              <li><strong className="text-text">Droit de portabilité :</strong> recevoir vos données dans un format structuré.</li>
              <li><strong className="text-text">Droit d&apos;opposition :</strong> vous opposer au marketing direct à tout moment.</li>
            </ul>
            <p>
              Pour exercer vos droits, contactez-nous à{' '}
              <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a>.
              Nous pouvons demander une preuve d&apos;identité raisonnable. Délai de réponse : 30 jours.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">9. Cookies</h2>
            <p className="mb-2">
              <strong className="text-text">Cookies nécessaires :</strong> session d&apos;authentification,
              sécurité, préférences fonctionnelles. Ces cookies sont indispensables au fonctionnement du
              Service et ne requièrent pas de consentement.
            </p>
            <p>
              <strong className="text-text">Cookies d&apos;analyse :</strong> nous n&apos;utilisons
              actuellement pas de cookies de tracking ou d&apos;analyse tiers. Si cela devait changer,
              nous mettrons en place un mécanisme de gestion des préférences conformément au guide
              PFPDT sur les cookies.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">10. Sécurité</h2>
            <p className="mb-2">
              Nous appliquons des mesures techniques et organisationnelles adaptées au risque :
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Chiffrement en transit (HTTPS/TLS) et au repos</li>
              <li>Contrôle d&apos;accès basé sur les rôles (Row Level Security)</li>
              <li>Journalisation des événements critiques</li>
              <li>Mots de passe hashés (bcrypt)</li>
              <li>Hébergement sur des infrastructures certifiées</li>
            </ul>
            <p>
              Ces mesures sont conformes aux exigences de l&apos;OPDo et aux recommandations de
              l&apos;OFJ/DFJP en matière de sécurité des données.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">11. Violation de données</h2>
            <p>
              En cas de violation de la sécurité des données entraînant vraisemblablement un risque élevé
              pour les personnes concernées, nous notifions le Préposé fédéral à la protection des données
              et à la transparence (PFPDT) dans les meilleurs délais (art. 24 LPD). Si nécessaire, les
              personnes concernées sont également informées.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">12. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique. La version à jour est accessible depuis le site
              woopla.ch. Les modifications significatives sont communiquées par email ou via le Service.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">13. Contact et autorité de surveillance</h2>
            <p className="mb-2">
              Pour toute question relative à la protection de vos données :<br />
              <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a>
            </p>
            <p>
              Autorité de surveillance compétente :<br />
              Préposé fédéral à la protection des données et à la transparence (PFPDT)<br />
              <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.edoeb.admin.ch</a>
            </p>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-sm font-display font-semibold">
          <Link href="/cgu" className="text-primary hover:text-primary-dark transition-colors">
            CGU →
          </Link>
          <Link href="/cgv" className="text-primary hover:text-primary-dark transition-colors">
            CGV →
          </Link>
          <Link href="/" className="text-text-muted hover:text-text transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
