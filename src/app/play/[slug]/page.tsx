import { Metadata, Viewport } from 'next';
import { createClient } from '@/lib/supabase/server';
import { APP_NAME } from '@/lib/constants';
import { Business, WheelSegment } from '@/lib/types';
import { PlayFlow } from '@/components/play/play-flow';

interface PlayPageProps {
  params: Promise<{ slug: string }>;
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata({
  params,
}: PlayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('slug', slug)
    .single();

  if (!business) {
    return {
      title: `Roue de la fortune | ${APP_NAME}`,
    };
  }

  return {
    title: `${business.name} - Tournez la roue ! | ${APP_NAME}`,
    description: `Jouez à la roue de la fortune chez ${business.name} et tentez de gagner un cadeau !`,
    openGraph: {
      title: `${business.name} - Tournez la roue !`,
      description: `Jouez à la roue de la fortune chez ${business.name} et tentez de gagner un cadeau !`,
      type: 'website',
    },
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch business by slug (public read via RLS)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (businessError || !business) {
    return <NotFoundView />;
  }

  if (!business.email_verified) {
    return <NotActivatedView businessName={business.name} />;
  }

  // Fetch wheel segments ordered by position
  const { data: segments, error: segmentsError } = await supabase
    .from('wheel_segments')
    .select('*')
    .eq('business_id', business.id)
    .order('position', { ascending: true });

  if (segmentsError || !segments || segments.length === 0) {
    return <NotFoundView />;
  }

  const typedBusiness = business as Business;
  const typedSegments = segments as WheelSegment[];

  return (
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden"
      style={
        {
          '--business-primary': typedBusiness.primary_color,
          '--business-secondary': typedBusiness.secondary_color,
        } as React.CSSProperties
      }
    >
      <PlayFlow business={typedBusiness} segments={typedSegments} />
    </div>
  );
}

function NotActivatedView({ businessName }: { businessName: string }) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-secondary via-secondary-light to-secondary p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">
          Commerce pas encore activé
        </h1>
        <p className="text-white/70 font-body text-sm leading-relaxed">
          {businessName} n&apos;est pas encore activé.
          Le propriétaire doit confirmer son adresse email pour activer la roue.
        </p>
        <a
          href="https://revieww.ch"
          className="inline-block mt-6 px-6 py-3 bg-primary text-white font-display font-semibold rounded-2xl hover:bg-primary-dark transition-colors"
        >
          Découvrir {APP_NAME}
        </a>
      </div>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-secondary via-secondary-light to-secondary p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎡</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">
          Roue introuvable
        </h1>
        <p className="text-white/70 font-body text-sm leading-relaxed">
          Cette roue n&apos;existe pas ou n&apos;est plus disponible.
          Verifiez le lien ou le QR code.
        </p>
        <a
          href="https://revieww.ch"
          className="inline-block mt-6 px-6 py-3 bg-primary text-white font-display font-semibold rounded-2xl hover:bg-primary-dark transition-colors"
        >
          Decouvrir {APP_NAME}
        </a>
      </div>
    </div>
  );
}
