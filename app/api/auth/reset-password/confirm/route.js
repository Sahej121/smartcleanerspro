import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { logSystemEvent, transaction } from '@/lib/db/db';
import { hashResetToken } from '@/lib/reset-password';

async function ensureResetTable(db) {
  await db(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    const nextPassword = String(password || '');

    if (!token || !nextPassword) {
      return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
    }

    if (nextPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const passwordHash = await hashPassword(nextPassword);

    const result = await transaction(async (tx) => {
      await ensureResetTable(tx);
      await tx(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP
      `);

      const tokenRes = await tx(
        `SELECT prt.id, prt.user_id, u.email, u.auth_id, u.store_id
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token_hash = $1
           AND prt.used_at IS NULL
           AND prt.expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      if (tokenRes.rows.length === 0) {
        return { success: false };
      }

      const resetRow = tokenRes.rows[0];

      await tx(
        `UPDATE users
         SET password_hash = $1,
             pin_attempts = 0,
             pin_locked_until = NULL
         WHERE id = $2`,
        [passwordHash, resetRow.user_id]
      );

      if (resetRow.auth_id) {
        await tx(
          `UPDATE auth.users
           SET encrypted_password = crypt($1::text, gen_salt('bf')),
               updated_at = NOW(),
               recovery_token = '',
               email_change = '',
               email_change_token_new = ''
           WHERE id = $2`,
          [nextPassword, resetRow.auth_id]
        );
      }

      await tx(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = $1`,
        [resetRow.id]
      );

      return {
        success: true,
        email: resetRow.email,
        storeId: resetRow.store_id,
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    await logSystemEvent(
      'auth.password_reset',
      `Password reset completed for ${result.email}`,
      'info',
      result.storeId || null
    );

    return NextResponse.json(
      { message: 'Password reset complete. You can now sign in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset Password Confirm Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
