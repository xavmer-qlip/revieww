import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata = {
  title: 'Conditions générales d\'utilisation — woopla',
  description: 'CGU de la plateforme woopla.ch — qlip sàrl, Genève',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-center pt-8 pb-4">
        <Link href="/"><Logo size="md" /></Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-3xl font-display font-bold text-text mb-2">
          Conditions générales d&apos;utilisation (CGU)
        </h1>
        <p className="text-sm font-body text-text-muted mb-8">
          Dernière mise à jour : 25 février 2026 — Version 1.1
        </p>

        <div className="font-body text-text-muted space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">1. Objet</h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et
              l&apos;utilisation de la plateforme <strong className="text-text">woopla.ch</strong> (ci-après
              le « Service »), éditée par qlip sàrl. Le Service permet aux commerçants de créer des
              animations d&apos;engagement client (QR code, roue de la fortune, collecte de contacts)
              depuis un tableau de bord en ligne, et aux clients finaux de participer à ces animations.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">2. Éditeur</h2>
            <p>
              <strong className="text-text">qlip sàrl</strong><br />
              Rue du Grand-Bureau 11, 1227 Les Acacias, Suisse<br />
              Email : <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a>
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">3. Accès et comptes</h2>
            <p className="mb-2">
              <strong className="text-text">3.1 Inscription.</strong> L&apos;inscription est ouverte à tout
              professionnel ou entreprise disposant d&apos;un établissement commercial. L&apos;utilisateur
              s&apos;engage à fournir des informations exactes et à jour.
            </p>
            <p className="mb-2">
              <strong className="text-text">3.2 Sécurité du compte.</strong> L&apos;utilisateur est
              responsable de la confidentialité de ses identifiants de connexion. Il notifie immédiatement
              qlip sàrl de tout accès non autorisé.
            </p>
            <p>
              <strong className="text-text">3.3 Rôles.</strong> Le commerçant est responsable des
              actions de ses collaborateurs disposant d&apos;un accès au Service, y compris la révocation
              des droits en cas de départ.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">4. Utilisation autorisée et interdictions</h2>
            <p className="mb-2">
              <strong className="text-text">4.1 Utilisation loyale.</strong> Le Service doit être utilisé
              conformément aux lois suisses en vigueur, aux règles des plateformes tierces (Google, etc.)
              et aux présentes CGU.
            </p>
            <p className="mb-2">
              <strong className="text-text">4.2 Emailing.</strong> Les contacts collectés via le Service
              ne peuvent être utilisés à des fins marketing que si le participant a donné son consentement
              explicite (opt-in). Chaque communication doit comporter un moyen simple de désinscription
              et identifier clairement l&apos;expéditeur (art. 3 al. 1 let. o LCD, recommandations PFPDT).
            </p>
            <p className="mb-2">
              <strong className="text-text">4.3 Réseaux sociaux et liens tiers.</strong> Le Service permet
              d&apos;afficher des liens vers des plateformes tierces (Google, Instagram, Facebook, etc.) à titre
              informatif. Ces liens sont optionnels et ne conditionnent en aucun cas la participation au jeu
              ou l&apos;obtention d&apos;un lot. Il est <strong className="text-text">strictement interdit</strong> :
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>d&apos;offrir un lot en échange d&apos;un avis en ligne ;</li>
              <li>de conditionner un lot à la publication, modification ou suppression d&apos;un avis ;</li>
              <li>de mentionner une récompense dans une sollicitation d&apos;avis ;</li>
              <li>d&apos;orienter les clients pour obtenir uniquement des avis positifs.</li>
            </ul>
            <p className="mb-2">
              Le jeu concours et les lots sont une animation commerciale indépendante de toute plateforme
              d&apos;avis.
            </p>
            <p className="mb-2">
              <strong className="text-text">4.4 Anti-fraude.</strong> Il est interdit de générer des
              participations artificielles, d&apos;usurper des identités, de contourner les limitations de
              participation, de falsifier des preuves d&apos;achat ou de partager/revendre des codes de lot.
            </p>
            <p>
              <strong className="text-text">4.5 Rétro-ingénierie.</strong> Il est interdit de procéder
              à la rétro-ingénierie du Service, à l&apos;extraction massive de données (scraping) ou au
              contournement des protections techniques.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">5. Jeux concours — Obligations du commerçant</h2>
            <p className="mb-2">
              Le commerçant est seul organisateur de ses jeux concours / tirages au sort. À ce titre, il est
              responsable :
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>de la légalité de ses lots et de ses communications ;</li>
              <li>de la rédaction et publication d&apos;un règlement de jeu conforme (durée, zone, conditions de participation, lots, modalités de remise) ;</li>
              <li>du respect des règles applicables aux jeux promotionnels en Suisse (LJAr, LCD), notamment : durée limitée, pas de risque de jeu excessif, prix conforme au marché si achat requis ;</li>
              <li>de la remise effective des lots gagnés dans les délais annoncés.</li>
            </ul>
            <p>
              Aucune autorité suisse ne vérifie la bonne exécution d&apos;un jeu promotionnel conforme
              (Gespa). La responsabilité incombe entièrement à l&apos;organisateur, d&apos;où l&apos;importance
              d&apos;un règlement clair, de preuves et d&apos;une traçabilité.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">6. Données personnelles</h2>
            <p className="mb-2">
              Le traitement des données personnelles est décrit dans notre{' '}
              <Link href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>.
            </p>
            <p className="mb-2">
              <strong className="text-text">Rôles.</strong> Pour les données des participants collectées
              via le Service, le commerçant agit comme responsable du traitement et qlip sàrl comme
              sous-traitant (art. 9 LPD). Pour les données du compte commerçant (admins, facturation),
              qlip sàrl agit comme responsable.
            </p>
            <p>
              Le commerçant garantit qu&apos;il respecte les obligations d&apos;information et de
              consentement envers les participants (art. 19 LPD — devoir d&apos;informer étendu à tous
              les types de données personnelles).
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">7. Journalisation et audit</h2>
            <p>
              Le Service journalise certains événements (connexions, création/édition de lots, exports,
              validations, tentatives suspectes) à des fins de sécurité et de traçabilité, conformément
              aux recommandations de l&apos;OFJ/DFJP sur les mesures de sécurité et la journalisation.
              L&apos;utilisateur accepte la conservation de ces logs selon la Politique de confidentialité.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">8. Suspension et résiliation</h2>
            <p className="mb-2">
              qlip sàrl peut suspendre l&apos;accès au Service en cas de : non-paiement, risque de
              sécurité, suspicion de fraude, violation des CGU ou violation des règles des plateformes tierces.
            </p>
            <p>
              En cas de violation grave, la suspension peut être immédiate, sans préavis.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">9. Propriété intellectuelle</h2>
            <p>
              qlip sàrl conserve tous les droits de propriété intellectuelle sur le Service (logiciel,
              marques, documentation, design). L&apos;utilisateur dispose d&apos;une licence limitée, non
              exclusive et non transférable, pour utiliser le Service pendant la durée du contrat.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">10. Responsabilité</h2>
            <p className="mb-2">
              Les limitations et exclusions de responsabilité figurent dans les{' '}
              <Link href="/cgv" className="text-primary hover:underline">Conditions générales de vente</Link>.
            </p>
            <p>
              qlip sàrl ne garantit aucun résultat en termes d&apos;engagement, de volume de participations ou d&apos;impact commercial
              et n&apos;est pas responsable des décisions des plateformes tierces.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">11. Modifications</h2>
            <p>
              qlip sàrl peut modifier les présentes CGU. La nouvelle version est notifiée par email ou
              via le Service et applicable à la prochaine période de renouvellement. En cas de désaccord,
              l&apos;utilisateur peut résilier selon les conditions prévues dans les CGV.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">12. Droit applicable et for</h2>
            <p>
              Les présentes CGU sont soumises au droit suisse. Le for exclusif est Genève, sous réserve
              des fors impératifs.
            </p>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-sm font-display font-semibold">
          <Link href="/cgv" className="text-primary hover:text-primary-dark transition-colors">
            CGV →
          </Link>
          <Link href="/confidentialite" className="text-primary hover:text-primary-dark transition-colors">
            Politique de confidentialité →
          </Link>
          <Link href="/signup" className="text-text-muted hover:text-text transition-colors">
            ← Retour à l&apos;inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
