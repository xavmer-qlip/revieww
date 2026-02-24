import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
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

  // ---- Fetch business ----
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single<Business>();

  if (!business) {
    redirect('/onboarding');
  }

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
    >
      {children}
    </DashboardShell>
  );
}
