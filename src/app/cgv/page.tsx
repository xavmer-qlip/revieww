import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata = {
  title: 'Conditions générales de vente — woopla',
  description: 'CGV du service SaaS woopla.ch — qlip sàrl, Genève',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-center pt-8 pb-4">
        <Link href="/"><Logo size="md" /></Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <h1 className="text-3xl font-display font-bold text-text mb-2">
          Conditions générales de vente (CGV)
        </h1>
        <p className="text-sm font-body text-text-muted mb-8">
          Dernière mise à jour : 25 février 2026 — Version 1.0
        </p>

        <div className="font-body text-text-muted space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">1. Parties et documents contractuels</h2>
            <p className="mb-2">
              <strong className="text-text">1.1 Prestataire (éditeur du Service)</strong><br />
              qlip sàrl, Rue du Grand-Bureau 11, 1227 Les Acacias, Suisse.<br />
              Email : <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a><br />
              (ci-après « Prestataire »)
            </p>
            <p className="mb-2">
              <strong className="text-text">1.2 Client</strong><br />
              La personne morale ou l&apos;entreprise identifiée lors de la souscription (ci-après « Client »).
            </p>
            <p>
              <strong className="text-text">1.3 Documents contractuels</strong><br />
              Le contrat comprend : (i) les présentes CGV, (ii) les{' '}
              <Link href="/cgu" className="text-primary hover:underline">CGU</Link>,
              (iii) la{' '}
              <Link href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>,
              (iv) toute offre ou bon de commande.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">2. Définitions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text">« Service »</strong> : plateforme SaaS de gestion d&apos;engagement client (QR code, roue de la fortune, lots, collecte de contacts, tableau de bord).</li>
              <li><strong className="text-text">« Spin »</strong> : participation d&apos;un client final au mécanisme de lot via QR code, selon les paramètres du Client.</li>
              <li><strong className="text-text">« Contacts »</strong> : données de contact collectées (email, téléphone), selon consentements.</li>
              <li><strong className="text-text">« Lots »</strong> : avantages, biens ou services offerts par le Client à ses clients finaux via la roue de la fortune.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">3. Objet</h2>
            <p className="mb-2">
              Le Prestataire met à disposition du Client un accès au Service selon le plan souscrit.
            </p>
            <p>
              Sauf mention écrite contraire, le Prestataire fournit une obligation de moyens (best efforts)
              pour l&apos;exploitation du Service.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">4. Souscription</h2>
            <p>
              La souscription se fait en ligne via le site woopla.ch. Le contrat entre en vigueur à la
              date d&apos;acceptation en ligne (« click »), de création du compte ou d&apos;activation du
              Service, la première de ces dates prévalant. Conformément aux exigences SECO en matière
              de commerce électronique, les étapes de souscription sont clairement présentées, avec
              possibilité de corriger les erreurs avant confirmation.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">5. Plans, quotas et évolutions</h2>
            <p className="mb-2">
              <strong className="text-text">5.1</strong> Le Service est proposé sous forme de plans
              (Free, Starter, Growth, Pro) incluant des quotas (spins/mois, contacts).
            </p>

            <div className="my-4 overflow-x-auto">
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-background">
                    <th className="px-3 py-2 text-left font-display font-semibold text-text border-b border-border">Plan</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-text border-b border-border">Prix/mois</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-text border-b border-border">Spins/mois</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-text border-b border-border">Contacts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Free</td><td className="px-3 py-2 border-b border-border/50">Gratuit</td><td className="px-3 py-2 border-b border-border/50">30 (à vie)</td><td className="px-3 py-2 border-b border-border/50">30</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Starter</td><td className="px-3 py-2 border-b border-border/50">CHF 19.–</td><td className="px-3 py-2 border-b border-border/50">50</td><td className="px-3 py-2 border-b border-border/50">Illimité</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Growth</td><td className="px-3 py-2 border-b border-border/50">CHF 39.–</td><td className="px-3 py-2 border-b border-border/50">200</td><td className="px-3 py-2 border-b border-border/50">Illimité</td></tr>
                  <tr><td className="px-3 py-2">Pro</td><td className="px-3 py-2">CHF 79.–</td><td className="px-3 py-2">Illimité</td><td className="px-3 py-2">Illimité</td></tr>
                </tbody>
              </table>
            </div>

            <p className="mb-2">
              <strong className="text-text">5.2</strong> Tous les plans payants incluent un essai gratuit
              de 7 jours. Les quotas non utilisés ne sont pas reportés au mois suivant.
            </p>
            <p>
              <strong className="text-text">5.3</strong> Le Prestataire peut faire évoluer les fonctionnalités
              et les tarifs. Toute modification défavorable substantielle est notifiée au Client au moins
              30 jours avant son entrée en vigueur. Le Client peut résilier à la fin de la période en cours
              s&apos;il n&apos;accepte pas la modification.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">6. Prix, TVA et facturation</h2>
            <p className="mb-2">
              <strong className="text-text">6.1 Prix.</strong> Les prix sont affichés en CHF (francs suisses)
              au moment de la souscription.
            </p>
            <p className="mb-2">
              <strong className="text-text">6.2 TVA.</strong> Les prix affichés s&apos;entendent TTC.
              Le taux normal de TVA suisse (actuellement 8,1 %) s&apos;applique le cas échéant aux prestations
              imposables.
            </p>
            <p className="mb-2">
              <strong className="text-text">6.3 Facturation.</strong> La facturation est mensuelle,
              d&apos;avance, via le prestataire de paiement Stripe. Le paiement s&apos;effectue par carte
              de crédit ou de débit.
            </p>
            <p>
              <strong className="text-text">6.4 Retard de paiement.</strong> En cas de retard, le
              Prestataire peut (i) envoyer un rappel, (ii) suspendre l&apos;accès au Service après mise
              en demeure, et/ou (iii) résilier le contrat pour juste motif.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">7. Obligations du Client</h2>
            <p>Le Client est responsable :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>de la légalité de ses lots, de son règlement de concours et de ses communications marketing ;</li>
              <li>de sa conformité aux règles Google Reviews (cf. art. 4.3 des CGU) ;</li>
              <li>de s&apos;assurer qu&apos;il dispose des droits et consentements nécessaires avant d&apos;exploiter les Contacts collectés ;</li>
              <li>des lots promis à ses clients finaux — le Prestataire n&apos;est pas responsable de la qualité, disponibilité ou conformité des lots.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">8. Données et protection des données</h2>
            <p className="mb-2">
              Le traitement des données est régi par la{' '}
              <Link href="/confidentialite" className="text-primary hover:underline">Politique de confidentialité</Link>{' '}
              et les articles correspondants des CGU.
            </p>
            <p>
              Le Client garantit qu&apos;il respecte les obligations d&apos;information et de
              consentement envers les participants, conformément à la LPD révisée (art. 19 — devoir
              d&apos;informer étendu).
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">9. Disponibilité et support</h2>
            <p>
              Le Prestataire peut effectuer des maintenances (annoncées dans la mesure du possible).
              Aucun SLA n&apos;est garanti sauf accord spécifique. Le support est fourni par email
              à <a href="mailto:hello@woopla.ch" className="text-primary hover:underline">hello@woopla.ch</a>.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">10. Responsabilité</h2>
            <p className="mb-2">
              <strong className="text-text">10.1 Responsabilité générale.</strong> Chaque partie répond
              des dommages directs prouvés causés par sa faute.
            </p>
            <p className="mb-2">
              <strong className="text-text">10.2 Exclusion des dommages indirects.</strong> Sauf dol ou
              faute grave, aucune partie n&apos;est responsable des dommages indirects (perte de profit,
              perte d&apos;opportunité, perte de données non sauvegardées par le Client).
            </p>
            <p className="mb-2">
              <strong className="text-text">10.3 Plafond.</strong> Sauf dol ou faute grave (art. 100 CO),
              la responsabilité totale du Prestataire est plafonnée au montant total payé par le Client
              au cours des 12 derniers mois précédant l&apos;événement.
            </p>
            <p>
              <strong className="text-text">10.4 Plateformes tierces.</strong> Le Prestataire n&apos;est
              pas responsable des décisions de plateformes tierces (Google, Stripe, etc.), y compris la
              suppression de contenus, les restrictions de profils ou les indisponibilités externes.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">11. Durée et résiliation</h2>
            <p className="mb-2">
              <strong className="text-text">11.1 Durée.</strong> Le contrat est à durée indéterminée
              (mensuel), renouvelé tacitement à chaque période de facturation.
            </p>
            <p className="mb-2">
              <strong className="text-text">11.2 Résiliation ordinaire.</strong> Le Client peut résilier
              à tout moment depuis son tableau de bord (portail Stripe). La résiliation prend effet à la
              fin de la période de facturation en cours.
            </p>
            <p className="mb-2">
              <strong className="text-text">11.3 Résiliation pour juste motif.</strong> Chaque partie
              peut résilier avec effet immédiat en cas de manquement grave non remédié dans un délai de
              10 jours après notification écrite.
            </p>
            <p>
              <strong className="text-text">11.4 Effets.</strong> À la résiliation, l&apos;accès au
              Service est désactivé. Les données du Client sont conservées pendant 30 jours, puis supprimées
              sauf obligation légale contraire.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">12. Confidentialité</h2>
            <p>
              Chaque partie protège les informations confidentielles de l&apos;autre partie et limite
              l&apos;accès au strict nécessaire. Cette obligation survit à la résiliation du contrat.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">13. Modifications des CGV</h2>
            <p>
              Le Prestataire peut modifier les présentes CGV. La nouvelle version est notifiée par email
              au moins 30 jours avant son entrée en vigueur. Le Client peut résilier en cas de désaccord.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-base font-display font-semibold text-text mb-2">14. Droit applicable et for</h2>
            <p>
              Les présentes CGV sont soumises au droit suisse. Le for exclusif est Genève, sous réserve
              des fors impératifs.
            </p>
          </section>

        </div>

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4 text-sm font-display font-semibold">
          <Link href="/cgu" className="text-primary hover:text-primary-dark transition-colors">
            CGU →
          </Link>
          <Link href="/confidentialite" className="text-primary hover:text-primary-dark transition-colors">
            Politique de confidentialité →
          </Link>
          <Link href="/" className="text-text-muted hover:text-text transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
