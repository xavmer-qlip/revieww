import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardOverview } from '@/components/dashboard/overview';
import type { Business, Spin } from '@/lib/types';

export const metadata = {
  title: 'Vue d\u2019ensemble',
};

export default async function DashboardPage() {
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

  // ---- Date boundaries ----
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // ---- Fetch spins for current month ----
  const { data: currentMonthSpins, count: currentMonthCount } = await supabase
    .from('spins')
    .select('*', { count: 'exact' })
    .eq('business_id', business.id)
    .gte('created_at', startOfMonth)
    .order('created_at', { ascending: false });

  // ---- Fetch last 5 spins (for recent activity) ----
  const { data: recentSpins } = await supabase
    .from('spins')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // ---- Fetch previous month count (for trend comparison) ----
  const { count: previousMonthCount } = await supabase
    .from('spins')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('created_at', startOfPreviousMonth)
    .lte('created_at', endOfPreviousMonth);

  // ---- Fetch previous month spins for comparison ----
  const { data: previousMonthSpins } = await supabase
    .from('spins')
    .select('email, confidence_score')
    .eq('business_id', business.id)
    .gte('created_at', startOfPreviousMonth)
    .lte('created_at', endOfPreviousMonth);

  // ---- Fetch wheel segments count ----
  const { count: segmentsCount } = await supabase
    .from('wheel_segments')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id);

  // ---- Calculate stats ----
  const spins: Spin[] = (currentMonthSpins as Spin[]) ?? [];
  const totalSpinsThisMonth = currentMonthCount ?? 0;
  const totalSpinsPrevMonth = previousMonthCount ?? 0;

  // Reviews = spins with confidence_score >= 40 (assumed left a review)
  const reviewsThisMonth = spins.filter((s) => s.confidence_score >= 40).length;
  const prevMonthReviews = (previousMonthSpins ?? []).filter(
    (s: { confidence_score: number }) => s.confidence_score >= 40
  ).length;

  // Unique emails this month
  const uniqueEmails = new Set(spins.map((s) => s.email?.toLowerCase()).filter(Boolean));
  const emailsThisMonth = uniqueEmails.size;
  const prevMonthEmails = new Set(
    (previousMonthSpins ?? []).map((s: { email: string; confidence_score: number }) => s.email?.toLowerCase()).filter(Boolean)
  ).size;

  // Conversion rate (spins with email / total spins)
  const spinsWithEmail = spins.filter((s) => s.email && s.email.trim() !== '').length;
  const conversionRate =
    totalSpinsThisMonth > 0
      ? Math.round((spinsWithEmail / totalSpinsThisMonth) * 100)
      : 0;

  // Previous month conversion
  const prevMonthSpinsWithEmail = (previousMonthSpins ?? []).filter(
    (s: { email: string; confidence_score: number }) => s.email && s.email.trim() !== ''
  ).length;
  const prevConversionRate =
    totalSpinsPrevMonth > 0
      ? Math.round((prevMonthSpinsWithEmail / totalSpinsPrevMonth) * 100)
      : 0;

  // ---- Daily spin counts for last 30 days (for chart) ----
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: last30DaysSpins } = await supabase
    .from('spins')
    .select('created_at')
    .eq('business_id', business.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const dailyCounts: { date: string; count: number }[] = [];
  const dateMap = new Map<string, number>();

  (last30DaysSpins ?? []).forEach((spin: { created_at: string }) => {
    const date = spin.created_at.substring(0, 10); // YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) ?? 0) + 1);
  });

  // Fill all 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    dailyCounts.push({
      date: dateStr,
      count: dateMap.get(dateStr) ?? 0,
    });
  }

  // ---- Check if first time (0 total spins ever) ----
  const { count: totalSpinsEver } = await supabase
    .from('spins')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id);
  const isFirstTime = (totalSpinsEver ?? 0) === 0;

  // ---- Onboarding checklist ----
  const checklist = {
    accountCreated: true,
    googleLinkAdded: !!business.google_review_link,
    wheelConfigured: (segmentsCount ?? 0) > 0,
    qrCodeDownloaded: false, // TODO: track this separately
  };

  const checklistComplete =
    checklist.googleLinkAdded && checklist.wheelConfigured && checklist.qrCodeDownloaded;

  return (
    <DashboardOverview
      business={business}
      stats={{
        reviewsThisMonth,
        reviewsPrevMonth: prevMonthReviews,
        emailsThisMonth,
        emailsPrevMonth: prevMonthEmails,
        totalSpinsThisMonth,
        totalSpinsPrevMonth: totalSpinsPrevMonth,
        conversionRate,
        prevConversionRate,
      }}
      recentSpins={(recentSpins as Spin[]) ?? []}
      dailyCounts={dailyCounts}
      checklist={checklist}
      checklistComplete={checklistComplete}
      isFirstTime={isFirstTime}
    />
  );
}
