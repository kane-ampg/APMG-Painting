import 'server-only';
import { redirect } from 'next/navigation';
import { isLocalPreview } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Two checks, both server-side, on every admin render and every action:
 * a live Supabase session, and membership of `admin_allowlist`. The RLS
 * policies enforce the same rule in the database, so this is the friendly
 * error, not the security boundary.
 *
 * A forbidden sign-in redirects back to the login page rather than
 * throwing: errors forwarded from Server Components render as a generic
 * message with no way to detect the cause, so the tailored "not an editor"
 * copy has to live on the login page instead of in an error boundary.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  if (isLocalPreview()) return { email: 'local-preview@localhost' };
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
  if (!data) redirect('/admin/login/?error=forbidden');
  return { email };
}
