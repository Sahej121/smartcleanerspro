import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function assertSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (Vercel Project → Settings → Environment Variables).'
    );
  }

  // Guard against common misconfig like "base" or missing scheme.
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

  // Catch placeholders like https://base, http://localhost, etc.
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
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions (anything that can access `next/headers` cookies).
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, anonKey } = assertSupabaseEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — ignore.
            // The middleware will handle refreshing the session.
          }
        },
      },
    }
  );
}
