import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function assertSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is invalid: "${url}". It must be a full URL like "https://<project-ref>.supabase.co".`
    );
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is invalid: "${url}".`);
  }

  if (
    hostname === 'base' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    !hostname.includes('.')
  ) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL hostname looks wrong: "${hostname}" (from "${url}"). Expected something like "<project-ref>.supabase.co".`
    );
  }

  return { url, anonKey };
}

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Middleware cannot use `next/headers` cookies — it must read/write
 * via the request/response objects instead.
 *
 * Returns { supabase, response } — caller must return `response`.
 */
export function createMiddlewareSupabase(request) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = assertSupabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
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
