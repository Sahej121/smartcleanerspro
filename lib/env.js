import { z } from 'zod';

const isServer = typeof window === 'undefined';

const envSchema = z.object({
  // Public (Available on both client and server)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Server-only (Validated only on the server)
  DATABASE_URL: isServer ? z.string().min(1) : z.string().optional(),
  RAZORPAY_KEY_ID: isServer ? z.string().min(1) : z.string().optional(),
  RAZORPAY_KEY_SECRET: isServer ? z.string().min(1) : z.string().optional(),
  
  // Optional/Conditional
  RESEND_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  STAIN_DETECTION_API_URL: z.string().url().optional(),

  // Error Tracking (GlitchTip/Sentry)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  GLITCHTIP_SECURITY_ENDPOINT: z.string().url().optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // App settings
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse(isServer ? process.env : {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!_env.success) {
  if (isServer) {
    console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  } else {
    // On client, we just warn or handle silently if it's not critical
    console.warn('⚠️ Missing or invalid public environment variables');
  }
}

export const env = _env.data || {};

