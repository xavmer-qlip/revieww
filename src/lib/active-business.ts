import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Business } from '@/lib/types';

const COOKIE_NAME = 'woopla_active_business';

/**
 * Fetch all businesses for a user.
 */
export async function getUserBusinesses(
  supabase: SupabaseClient,
  userId: string
): Promise<Business[]> {
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return (businesses as Business[]) ?? [];
}

/**
 * Get the active business for a user, based on cookie or fallback to first.
 * Used in server components (dashboard layout, server pages).
 */
export async function getActiveBusiness(
  supabase: SupabaseClient,
  userId: string
): Promise<Business | null> {
  const businesses = await getUserBusinesses(supabase, userId);
  if (businesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(COOKIE_NAME)?.value;

  if (activeId) {
    const match = businesses.find((b) => b.id === activeId);
    if (match) return match;
  }

  return businesses[0];
}

/**
 * Get active business for API routes (using supabase client, no cookie access in some contexts).
 * Accepts an optional businessId from the cookie value passed by the caller.
 */
export async function getActiveBusinessForApi(
  supabase: SupabaseClient,
  userId: string,
  activeBusinessId?: string | null
): Promise<Business | null> {
  const businesses = await getUserBusinesses(supabase, userId);
  if (businesses.length === 0) return null;

  if (activeBusinessId) {
    const match = businesses.find((b) => b.id === activeBusinessId);
    if (match) return match;
  }

  return businesses[0];
}
