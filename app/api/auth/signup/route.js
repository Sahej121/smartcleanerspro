import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { query } from '@/lib/db/db';
import { verifyPaymentSignature } from '@/lib/payments/razorpay-service';

export async function POST(req) {
  try {
    const { name, email, password, role, tier, market, payment_id, order_id, signature } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Payment Verification for Paid Tiers
    const isPaidTier = tier === 'software_only' || tier === 'hardware_bundle';
    if (isPaidTier) {
      if (!payment_id || !order_id || !signature) {
        return NextResponse.json({ error: 'Payment information missing' }, { status: 402 });
      }
      
      const isValid = verifyPaymentSignature(payment_id, order_id, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 403 });
      }
    }

    // 2. Supabase Auth Signup
    const supabase = await createServerSupabase();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'owner',
        }
      }
    });

    if (authError) {
      console.error('[Signup] Supabase Auth Error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const authId = authData.user.id;

    // 3. Database Operations (Store & User Creation)
    // We use a simple sequential flow here, but a transaction would be better if we had direct DB access everywhere
    try {
      // Create Store
      const storeRes = await query(
        `INSERT INTO stores (store_name, country, subscription_tier, subscription_status) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [`${name}'s Atelier`, market || 'India', tier || 'software_only', isPaidTier ? 'active' : 'trial']
      );
      const storeId = storeRes.rows[0].id;

      // Create User
      const userRes = await query(
        `INSERT INTO users (auth_id, name, email, role, store_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [authId, name, email, 'owner', storeId]
      );

      // Link User back to Store as owner_id
      await query(`UPDATE stores SET owner_id = $1 WHERE id = $2`, [userRes.rows[0].id, storeId]);

      // Update Supabase metadata for the user
      await supabase.auth.updateUser({
        data: {
          app_user_id: userRes.rows[0].id,
          store_id: storeId,
          tier: tier || 'software_only'
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Signup successful',
        user: {
          id: userRes.rows[0].id,
          name,
          email,
          role: 'owner',
          store_id: storeId,
          tier: tier || 'software_only'
        }
      });

    } catch (dbError) {
      console.error('[Signup] Database Error:', dbError);
      // Note: In a production app, we would Rollback Supabase signup here 
      // by deleting the auth user if the DB insert fails.
      return NextResponse.json({ error: 'User registered but profile creation failed. Please contact support.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during signup' }, { status: 500 });
  }
}
