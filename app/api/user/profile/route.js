import { NextResponse } from 'next/server';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db/db';
import { createServerSupabase } from '@/lib/supabase-server';

export async function PATCH(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, language, currentPassword, newPassword } = body;

    // 1. Handle Password Change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      // Verify current password first
      const userRes = await query('SELECT password_hash, pin_hash, auth_id FROM users WHERE id = $1', [session.id]);
      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const u = userRes.rows[0];
      const isPasswordValid = u.password_hash ? await verifyPassword(currentPassword, u.password_hash) : false;
      const isPinValid = !isPasswordValid && u.pin_hash ? await verifyPassword(currentPassword, u.pin_hash) : false;

      if (!isPasswordValid && !isPinValid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
      }

      // If Supabase session, update Supabase Auth as well
      if (session.type === 'supabase' && u.auth_id) {
        const supabase = await createServerSupabase();
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) {
          return NextResponse.json({ error: `Supabase Auth error: ${authError.message}` }, { status: 400 });
        }
      }

      // Update local database password hash (for fallback login)
      const hashedPassword = await hashPassword(newPassword);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, session.id]);
    }

    // 2. Handle Name/Email/Language updates
    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (name) {
      updates.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (email) {
      // If email changes and it's a Supabase user, we should ideally update Supabase too
      // but email changes often require confirmation. For now, let's update the local DB.
      // In a production app, we'd call supabase.auth.updateUser({ email }) which triggers confirmation.
      updates.push(`email = $${paramIdx++}`);
      values.push(email);
      
      if (session.type === 'supabase') {
        const supabase = await createServerSupabase();
        await supabase.auth.updateUser({ email });
      }
    }
    if (language) {
      updates.push(`language = $${paramIdx++}`);
      values.push(language);
    }

    if (updates.length > 0) {
      values.push(session.id);
      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
        values
      );
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[PROFILE PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

