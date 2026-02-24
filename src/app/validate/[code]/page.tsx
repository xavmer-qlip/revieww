import { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import { APP_NAME, TEXTS } from '@/lib/constants';
import { ValidateClient } from './validate-client';

interface ValidatePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Validation du lot | ${APP_NAME}`,
  };
}

export default async function ValidatePage({ params }: ValidatePageProps) {
  const { code } = await params;
  const supabase = await createServiceClient();

  // Fetch spin by validation code (with business info)
  const { data: spin, error } = await supabase
    .from('spins')
    .select('*, businesses(name, primary_color, prize_validity_days)')
    .eq('validation_code', code.toUpperCase())
    .single();

  if (error || !spin) {
    return <NotFoundView />;
  }

  const business = spin.businesses as {
    name: string;
    primary_color: string;
    prize_validity_days: number;
  };

  // Check expiry
  const validityDays = business.prize_validity_days ?? 7;
  const createdAt = new Date(spin.created_at);
  const now = new Date();
  const daysSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const isExpired = daysSince > validityDays;

  return (
    <ValidateClient
      spin={{
        id: spin.id,
        validation_code: spin.validation_code,
        prize_label: spin.prize_label,
        prize_emoji: spin.prize_emoji,
        email: spin.email,
        claimed: spin.claimed,
        claimed_at: spin.claimed_at,
        created_at: spin.created_at,
      }}
      businessName={business.name}
      businessColor={business.primary_color}
      isExpired={isExpired}
    />
  );
}

function NotFoundView() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-text mb-3">
          {TEXTS.validate.notFound}
        </h1>
        <p className="text-text-muted font-body text-sm leading-relaxed">
          {TEXTS.validate.notFoundDescription}
        </p>
      </div>
    </div>
  );
}
