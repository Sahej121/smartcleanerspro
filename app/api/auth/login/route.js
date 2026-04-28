import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { query } from '@/lib/db/db';
import { normalizeTier } from '@/lib/tier-config';
import { verifyPassword, signPinToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { identifier, password, email } = await req.json();
    const loginUser = identifier || email;

    if (!loginUser || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    // If the user provided a phone number, look up their email first
    let loginEmail = loginUser;
    if (!loginUser.includes('@')) {
      const phoneRes = await query('SELECT email FROM users WHERE phone = $1', [loginUser]);
      if (phoneRes.rows.length > 0) {
        loginEmail = phoneRes.rows[0].email;
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Sign in via Supabase Auth
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (error) {
      console.log('[LOGIN] Supabase auth failed:', error.message);
      
      // Attempt PIN Fallback
      if (loginEmail && password) {
        // Find user by email, including retry tracking columns
        const pinUserRes = await query(`
          SELECT u.id, u.email, u.name, u.role, u.store_id, u.password_hash, u.pin_hash, u.pin_attempts, u.pin_locked_until, s.subscription_tier
          FROM users u
          LEFT JOIN stores s ON u.store_id = s.id
          WHERE email = $1
        `, [loginEmail]);

        if (pinUserRes.rows.length > 0) {
          const u = pinUserRes.rows[0];
          
          // Check lockout
          if (u.pin_locked_until && new Date(u.pin_locked_until) > new Date()) {
            return NextResponse.json({ 
              error: `Account locked due to too many PIN attempts. Try again after ${new Date(u.pin_locked_until).toLocaleTimeString()}.` 
            }, { status: 403 });
          }

          if (u.password_hash || u.pin_hash) {
            const isPasswordValid = u.password_hash
              ? await verifyPassword(password, u.password_hash)
              : false;
            const isPinValid = !isPasswordValid && u.pin_hash
              ? await verifyPassword(password, u.pin_hash)
              : false;
            
            if (isPasswordValid || isPinValid) {
              // Success! Reset attempts
              await query('UPDATE users SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1', [u.id]);
              
              const tier = normalizeTier(u.subscription_tier);
              const payload = {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                store_id: u.store_id,
                tier: tier
              };

              // Issue custom PIN session
              const token = await signPinToken(payload);
              const cookieStore = await cookies();
              cookieStore.set('cleanflow_pin_session', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
              });

              return NextResponse.json({ 
                success: true, 
                user: payload,
                type: 'pin'
              });
            } else {
              // PIN invalid, track attempt
              const newAttempts = (u.pin_attempts || 0) + 1;
              let lockoutUntil = null;
              
              if (newAttempts >= 4) {
                // Lock for 15 minutes
                lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
              }

              await query('UPDATE users SET pin_attempts = $1, pin_locked_until = $2 WHERE id = $3', [newAttempts, lockoutUntil, u.id]);
              
              if (newAttempts >= 4) {
                return NextResponse.json({ error: 'Too many failed attempts. Account locked for 15 minutes.' }, { status: 403 });
              }
            }
          }
        }
      }

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Look up application user by auth_id
    const res = await query(
      'SELECT u.*, s.subscription_tier FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.auth_id = $1',
      [data.user.id]
    );

    if (res.rows.length === 0) {
      console.log('[LOGIN] No application user found for auth_id:', data.user.id);
      return NextResponse.json({ error: 'User account not configured. Contact your admin.' }, { status: 403 });
    }

    const user = res.rows[0];
    const tier = normalizeTier(user.subscription_tier);

    // Optimization: Only update user_metadata if it has changed to save a network round-trip
    const existingMeta = data.user.user_metadata || {};
    const needsUpdate = 
      existingMeta.app_user_id !== user.id ||
      existingMeta.role !== user.role ||
      existingMeta.store_id !== user.store_id ||
      existingMeta.tier !== tier ||
      existingMeta.name !== user.name;

    if (needsUpdate) {
      await supabase.auth.updateUser({
        data: {
          app_user_id: user.id,
          role: user.role,
          store_id: user.store_id,
          tier: tier,
          name: user.name,
        }
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      store_id: user.store_id,
      tier
    };

    return NextResponse.json({ 
      success: true, 
      user: userPayload
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
