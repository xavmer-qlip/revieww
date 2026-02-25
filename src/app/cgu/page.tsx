import Link from 'next/link';

export const metadata = {
  title: 'Conditions générales d\'utilisation — revieww',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-display font-bold text-text mb-8">
          Conditions générales d&apos;utilisation
        </h1>

        <div className="prose prose-sm font-body text-text-muted space-y-6">
          <section>
            <h2 className="text-lg font-display font-semibold text-text">1. Objet</h2>
            <p>
              Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
              de la plateforme revieww.ch, un service permettant aux commerces de collecter des avis Google
              grâce à un système de gamification (roue de la fortune).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">2. Inscription</h2>
            <p>
              L&apos;inscription est ouverte à tout professionnel disposant d&apos;un commerce référencé sur Google.
              L&apos;utilisateur s&apos;engage à fournir des informations exactes et à maintenir la confidentialité
              de ses identifiants de connexion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">3. Utilisation du service</h2>
            <p>
              Le commerçant s&apos;engage à utiliser revieww de manière conforme aux lois en vigueur et aux
              politiques de Google concernant les avis. Il est interdit de générer de faux avis ou
              d&apos;utiliser le service de manière frauduleuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">4. Données personnelles</h2>
            <p>
              Les données collectées (emails, numéros de téléphone des clients) sont stockées de manière
              sécurisée et ne sont accessibles qu&apos;au commerçant concerné. revieww ne revend pas les données
              à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">5. Abonnements et paiements</h2>
            <p>
              Les prix sont indiqués en CHF (francs suisses). Tous les plans incluent une période d&apos;essai
              gratuite de 7 jours. L&apos;abonnement peut être résilié à tout moment depuis le dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">6. Responsabilité</h2>
            <p>
              revieww fournit le service en l&apos;état et ne garantit pas un nombre minimum d&apos;avis Google.
              Le commerçant reste seul responsable des lots proposés à ses clients via la roue de la fortune.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-text">7. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter à
              l&apos;adresse <a href="mailto:hello@revieww.ch" className="text-primary hover:underline">hello@revieww.ch</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link
            href="/signup"
            className="text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            ← Retour à l&apos;inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
