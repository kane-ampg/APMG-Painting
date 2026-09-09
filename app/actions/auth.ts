'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site';

export type AuthState = { status: 'idle' | 'sent' | 'error'; message?: string };

/**
 * Where the sign-in link should land: this deployment, whichever it is.
 *
 * `siteUrl` is the *public* site's canonical origin, which on the editor
 * deployment is somebody else's domain — a link sent from
 * edit.apmgpainting.com.au that points at apmgpainting.com.au/admin/ lands
 * on a redirect back to the editor with the auth code already spent.
 * Reading the request's own host fixes that; `siteUrl` stays as the fallback
 * for the case where there is no host header to read at all.
 */
async function callbackUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const origin = host ? `${proto}://${host}` : siteUrl;
  return `${origin}/admin/auth/callback/`;
}

export async function sendMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(), shouldCreateUser: true },
  });
  if (error) return { status: 'error', message: 'Could not send the link. Try again in a minute.' };
  return { status: 'sent', message: `Check ${email} for a sign-in link.` };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login/');
}
