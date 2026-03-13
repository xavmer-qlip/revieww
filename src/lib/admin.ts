import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Check if the current user is a mega-admin.
 * Admin emails are defined in ADMIN_EMAILS env var (comma-separated).
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Verify admin access from server context. Returns user if admin, null otherwise.
 */
export async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return null;
  }

  return user;
}

/**
 * Get service client for admin operations (bypasses RLS).
 */
export async function getAdminClient() {
  return createServiceClient();
}
