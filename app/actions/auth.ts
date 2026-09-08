'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site';

export type AuthState = { status: 'idle' | 'sent' | 'error'; message?: string };

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
    options: { emailRedirectTo: `${siteUrl}/admin/auth/callback/`, shouldCreateUser: true },
  });
  if (error) return { status: 'error', message: 'Could not send the link. Try again in a minute.' };
  return { status: 'sent', message: `Check ${email} for a sign-in link.` };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login/');
}
