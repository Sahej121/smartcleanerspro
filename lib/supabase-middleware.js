import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Middleware cannot use `next/headers` cookies — it must read/write
 * via the request/response objects instead.
 *
 * Returns { supabase, response } — caller must return `response`.
 */
export function createMiddlewareSupabase(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookies into the request (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response with the updated request
          supabaseResponse = NextResponse.next({ request });
          // Mirror cookies into the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}
