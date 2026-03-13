import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientsTable } from '@/components/dashboard/clients-table';
import { getActiveBusiness } from '@/lib/active-business';
import type { Business, Spin } from '@/lib/types';

export const metadata = {
  title: 'Avis & Contacts | woopla',
};

export default async function ClientsPage() {
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

  // ---- Fetch all spins for this business (ordered by most recent) ----
  const { data: spins, count } = await supabase
    .from('spins')
    .select('*', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5000);

  return (
    <ClientsTable
      spins={(spins as Spin[]) || []}
      totalCount={count ?? 0}
    />
  );
}
