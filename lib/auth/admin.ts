import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export class AdminForbiddenError extends Error {
  constructor(email: string) {
    super(`${email} is signed in but not on the admin allowlist`);
  }
}

/**
 * Two checks, both server-side, on every admin render and every action:
 * a live Supabase session, and membership of `admin_allowlist`. The RLS
 * policies enforce the same rule in the database, so this is the friendly
 * error, not the security boundary.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect('/admin/login/');

  const email = user.email.toLowerCase();
  const { data } = await supabase
    .from('admin_allowlist')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  if (!data) throw new AdminForbiddenError(email);
  return { email };
}
