import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isEditor } from '@/lib/app-role';
import { hasSupabase, supabaseEnv } from '@/lib/supabase/env';

/**
 * Keeps the Supabase session cookie fresh and bounces anonymous visitors
 * off /admin. Public routes are never touched: the matcher below is the
 * whole story, and the public site stays static.
 */
export async function proxy(request: NextRequest) {
  if (!hasSupabase()) {
    // On the editor deployment, redirecting to `/` would bounce straight
    // back: next.config.ts sends `/` to `/admin/` there, and this would
    // send it back again — a redirect loop instead of a diagnosis. Say what
    // is actually wrong, and say it in a status code a monitor will notice.
    if (isEditor()) {
      console.warn(
        '[proxy] Editor deployment is missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY; /admin is unavailable.',
      );
      return new NextResponse(
        'Editor is not configured: Supabase environment variables are missing.',
        { status: 503 },
      );
    }
    // On the public site there is no admin to reach, so the homepage is the
    // right answer and there is no loop to fall into.
    return NextResponse.redirect(new URL('/', request.url));
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/auth/');
  if (!user && !isLogin) {
    return NextResponse.redirect(new URL('/admin/login/', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
