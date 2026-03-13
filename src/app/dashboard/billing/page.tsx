import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BillingClient } from '@/components/dashboard/billing-client';
import { getActiveBusiness } from '@/lib/active-business';
import type { Business } from '@/lib/types';

export const metadata = {
  title: 'Abonnement | woopla',
};

export default async function BillingPage() {
  const supabase = await createClient();

  // ---- Authenticate ----
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ---- Fetch business ----
  const business = await getActiveBusiness(supabase, user.id);

  if (!business) {
    redirect('/onboarding');
  }

  // ---- Fetch spin count for current month ----
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const { count: spinsUsed } = await supabase
    .from('spins')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', startOfMonth);

  return (
    <BillingClient
      business={business}
      spinsUsed={spinsUsed ?? 0}
    />
  );
}
