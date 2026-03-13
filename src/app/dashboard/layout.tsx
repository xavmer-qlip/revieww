import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getActiveBusiness, getUserBusinesses } from '@/lib/active-business';
import type { Business } from '@/lib/types';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // ---- Authenticate ----
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ---- Fetch all businesses for this user ----
  const businesses = await getUserBusinesses(supabase, user.id);

  if (businesses.length === 0) {
    redirect('/onboarding');
  }

  // ---- Determine active business via cookie ----
  const business = (await getActiveBusiness(supabase, user.id))!;

  // ---- Auto-verify OAuth users ----
  if (!business.email_verified) {
    const provider = user.app_metadata?.provider;
    if (provider && provider !== 'email') {
      await supabase
        .from('businesses')
        .update({ email_verified: true })
        .eq('id', business.id);
      business.email_verified = true;
    }
  }

  // ---- Fetch spin count for current month ----
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: spinsUsed } = await supabase
    .from('spins')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', startOfMonth);

  return (
    <DashboardShell
      businessName={business.name}
      businessLogoUrl={business.logo_url}
      planType={business.plan_type}
      spinsUsed={spinsUsed ?? 0}
      spinsLimit={business.monthly_spin_limit}
      emailVerified={business.email_verified}
      businesses={businesses}
      activeBusinessId={business.id}
    >
      {children}
    </DashboardShell>
  );
}
